import { jest } from "@jest/globals";

// ── mocks ──────────────────────────────────────────────────────────────
const mockSendEachForMulticast = jest.fn();

jest.unstable_mockModule("firebase-admin/app", () => ({
  getApps: jest.fn().mockReturnValue([{ name: "mock" }]),
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));

jest.unstable_mockModule("firebase-admin/messaging", () => ({
  getMessaging: jest.fn().mockReturnValue({
    sendEachForMulticast: mockSendEachForMulticast,
  }),
}));

const mockUpdateMany = jest.fn();
jest.unstable_mockModule("../../models/User.js", () => ({
  default: { updateMany: mockUpdateMany },
}));

const { sendPushNotification } = await import("../../utils/pushNotification.js");

describe("pushNotification – sendPushNotification", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns zero counts when tokens array is empty", async () => {
    const result = await sendPushNotification([], "Title", "Body");
    expect(result).toEqual({ successCount: 0, failureCount: 0, responses: [] });
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it("returns zero counts when tokens is null", async () => {
    const result = await sendPushNotification(null, "Title", "Body");
    expect(result).toEqual({ successCount: 0, failureCount: 0, responses: [] });
  });

  it("de-duplicates tokens", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1", "tok1", "tok1"], "Title", "Body");

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.tokens).toEqual(["tok1"]);
  });

  it("filters out falsy tokens", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1", "", null, undefined], "Title", "Body");

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.tokens).toEqual(["tok1"]);
  });

  it("sends notification with correct structure", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1"], "Hello", "World", { taskId: "t1" });

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.notification).toEqual({ title: "Hello", body: "World" });
    expect(message.data.taskId).toBe("t1");
  });

  it("converts data values to strings", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1"], "T", "B", { num: 42, bool: true });

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.data.num).toBe("42");
    expect(message.data.bool).toBe("true");
  });

  it("strips null/undefined from data payload", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1"], "T", "B", { a: "ok", b: null, c: undefined });

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.data).toEqual({ a: "ok" });
  });

  it("adds webpush block when link option is absolute URL", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1"], "T", "B", {}, { link: "https://example.com/task/1" });

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.webpush).toBeDefined();
    expect(message.webpush.fcmOptions.link).toBe("https://example.com/task/1");
  });

  it("does not add fcmOptions for relative link", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await sendPushNotification(["tok1"], "T", "B", { url: "/tasks/1" });

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.webpush).toBeDefined();
    expect(message.webpush.fcmOptions).toBeUndefined();
  });

  it("cleans up dead tokens with invalid-registration-token error", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [
        { success: true },
        { success: false, error: { code: "messaging/invalid-registration-token" } },
        { success: false, error: { code: "messaging/registration-token-not-registered" } },
      ],
    });
    mockUpdateMany.mockResolvedValue({});

    await sendPushNotification(["good", "dead1", "dead2"], "T", "B");

    expect(mockUpdateMany).toHaveBeenCalledWith(
      { fcmTokens: { $in: ["dead1", "dead2"] } },
      { $pull: { fcmTokens: { $in: ["dead1", "dead2"] } } },
    );
  });

  it("does not clean up tokens for non-dead-token errors", async () => {
    mockSendEachForMulticast.mockResolvedValue({
      responses: [
        { success: false, error: { code: "messaging/internal-error" } },
      ],
    });

    await sendPushNotification(["tok1"], "T", "B");

    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
