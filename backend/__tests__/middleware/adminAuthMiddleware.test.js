import { jest } from "@jest/globals";

const mockVerify = jest.fn();
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: mockVerify },
}));

const { isAdmin } = await import("../../middleware/adminAuthMiddleware.js");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("adminAuthMiddleware – isAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("returns 401 when no adminToken cookie is present", async () => {
    const req = { cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized, no token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when cookies is undefined", async () => {
    const req = {};
    const res = buildRes();
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 403 when token role is not admin", async () => {
    const req = { cookies: { adminToken: "some-token" } };
    const res = buildRes();
    const next = jest.fn();

    mockVerify.mockReturnValue({ id: "user123", role: "customer" });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied. Admin privileges required.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid / expired", async () => {
    const req = { cookies: { adminToken: "expired-token" } };
    const res = buildRes();
    const next = jest.fn();

    mockVerify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token or unauthorized access",
    });
  });

  it("sets req.admin and calls next for valid admin token", async () => {
    const decoded = { id: "admin1", role: "admin" };
    const req = { cookies: { adminToken: "valid-admin-token" } };
    const res = buildRes();
    const next = jest.fn();

    mockVerify.mockReturnValue(decoded);

    await isAdmin(req, res, next);

    expect(req.admin).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
