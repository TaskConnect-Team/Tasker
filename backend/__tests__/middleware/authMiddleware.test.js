import { jest } from "@jest/globals";

// Mock jsonwebtoken
const mockVerify = jest.fn();
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: mockVerify },
}));

// Mock User model
const mockFindById = jest.fn();
jest.unstable_mockModule("../../models/User.js", () => ({
  default: { findById: mockFindById },
}));

const { default: protect } = await import("../../middleware/authMiddleware.js");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authMiddleware – protect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("returns 401 when no token cookie is present", async () => {
    const req = { cookies: {} };
    const res = buildRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized, no token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when cookies is undefined", async () => {
    const req = {};
    const res = buildRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when token is invalid", async () => {
    const req = { cookies: { token: "bad-token" } };
    const res = buildRes();
    const next = jest.fn();

    mockVerify.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token invalid" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when decoded user is not found in DB", async () => {
    const req = { cookies: { token: "valid-token" } };
    const res = buildRes();
    const next = jest.fn();

    mockVerify.mockReturnValue({ id: "user123" });
    mockFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("sets req.user and calls next on valid token", async () => {
    const mockUser = { _id: "user123", name: "Test User", role: "customer" };
    const req = { cookies: { token: "valid-token" } };
    const res = buildRes();
    const next = jest.fn();

    mockVerify.mockReturnValue({ id: "user123" });
    mockFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

    await protect(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
