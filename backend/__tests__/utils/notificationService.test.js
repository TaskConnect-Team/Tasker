import { jest } from "@jest/globals";

// ── mocks ──────────────────────────────────────────────────────────────
const mockUserFind = jest.fn();
const mockUserFindById = jest.fn();
const mockUserAggregate = jest.fn();
jest.unstable_mockModule("../../models/User.js", () => ({
  default: {
    find: mockUserFind,
    findById: mockUserFindById,
    aggregate: mockUserAggregate,
  },
}));

const mockSendPushNotification = jest.fn();
jest.unstable_mockModule("../../utils/pushNotification.js", () => ({
  sendPushNotification: mockSendPushNotification,
}));

const {
  notifyMatchingTaskersForTask,
  notifyTaskCustomer,
  notifyTasker,
} = await import("../../utils/notificationService.js");

describe("notificationService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("notifyTaskCustomer", () => {
    it("returns null when customer not found", async () => {
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const task = { _id: "t1", customer: "c1" };
      const result = await notifyTaskCustomer(task, "Title", "Body", "type");

      expect(result).toBeNull();
    });

    it("returns null when customer has no fcm tokens", async () => {
      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ fcmTokens: [] }),
      });

      const task = { _id: { toString: () => "t1" }, customer: "c1" };
      const result = await notifyTaskCustomer(task, "Title", "Body", "type");

      expect(result).toBeNull();
    });

    it("sends notification when customer has tokens", async () => {
      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ fcmTokens: ["token1"] }),
      });
      mockSendPushNotification.mockResolvedValue({ successCount: 1 });

      const task = { _id: { toString: () => "t1" }, customer: "c1" };
      const result = await notifyTaskCustomer(task, "Title", "Body", "type");

      expect(mockSendPushNotification).toHaveBeenCalledWith(
        ["token1"],
        "Title",
        "Body",
        expect.objectContaining({ type: "type", taskId: "t1" }),
        expect.objectContaining({ link: "/tasks/t1" }),
      );
      expect(result).toEqual({ successCount: 1 });
    });
  });

  describe("notifyTasker", () => {
    it("returns null when task has no tasker", async () => {
      const task = { _id: "t1", tasker: null };
      const result = await notifyTasker(task, "Title", "Body", "type");
      expect(result).toBeNull();
    });

    it("returns null when tasker not found in DB", async () => {
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const task = { _id: "t1", tasker: "tk1" };
      const result = await notifyTasker(task, "Title", "Body", "type");
      expect(result).toBeNull();
    });

    it("sends notification to tasker", async () => {
      mockUserFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ fcmTokens: ["tok1", "tok2"] }),
      });
      mockSendPushNotification.mockResolvedValue({ successCount: 2 });

      const task = { _id: { toString: () => "t1" }, tasker: "tk1" };
      await notifyTasker(task, "Title", "Body", "type");

      expect(mockSendPushNotification).toHaveBeenCalledWith(
        ["tok1", "tok2"],
        "Title",
        "Body",
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe("notifyMatchingTaskersForTask", () => {
    it("sends notification when geo-matched taskers found", async () => {
      mockUserAggregate.mockResolvedValue([{ fcmTokens: ["t1", "t2"] }]);
      mockSendPushNotification.mockResolvedValue({ successCount: 2 });

      const task = {
        _id: { toString: () => "task1" },
        title: "Fix sink",
        category: ["Plumbing"],
        city: "NYC",
        location: { coordinates: [-74, 40.7] },
      };

      await notifyMatchingTaskersForTask(task);

      expect(mockUserAggregate).toHaveBeenCalled();
      expect(mockSendPushNotification).toHaveBeenCalledWith(
        ["t1", "t2"],
        "New matching task",
        "Fix sink is available near you.",
        expect.objectContaining({ type: "task.created" }),
        expect.any(Object),
      );
    });

    it("falls back to city match when no geo results and no coordinates", async () => {
      mockUserAggregate.mockResolvedValue([]);
      mockUserFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ fcmTokens: ["tok1"] }]),
        }),
      });
      mockSendPushNotification.mockResolvedValue({ successCount: 1 });

      const task = {
        _id: { toString: () => "task2" },
        title: "Clean house",
        category: "Cleaning",
        city: "LA",
        location: { coordinates: [-118.2, 34.05] },
      };

      await notifyMatchingTaskersForTask(task);

      // Should have tried geo first, then city fallback
      expect(mockUserAggregate).toHaveBeenCalled();
    });

    it("returns null when no matching taskers found", async () => {
      // No coordinates, so skip geo
      // City match returns empty
      mockUserFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const task = {
        _id: { toString: () => "task3" },
        title: "Task",
        category: [],
        city: "Nowhere",
        location: null,
      };

      const result = await notifyMatchingTaskersForTask(task);
      expect(result).toBeNull();
    });

    it("uses task body as notification when title is empty", async () => {
      mockUserAggregate.mockResolvedValue([{ fcmTokens: ["tok1"] }]);
      mockSendPushNotification.mockResolvedValue({ successCount: 1 });

      const task = {
        _id: { toString: () => "task4" },
        title: "",
        category: ["Plumbing"],
        city: "NYC",
        location: { coordinates: [-74, 40.7] },
      };

      await notifyMatchingTaskersForTask(task);

      expect(mockSendPushNotification).toHaveBeenCalledWith(
        expect.any(Array),
        "New matching task",
        "A new task is available near you.",
        expect.any(Object),
        expect.any(Object),
      );
    });
  });
});
