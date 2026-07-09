import { jest } from "@jest/globals";

// ── mocks ──────────────────────────────────────────────────────────────
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
jest.unstable_mockModule("../../models/User.js", () => ({
  default: { findOne: mockFindOne, create: mockCreate },
}));

const mockOtpDeleteMany = jest.fn();
const mockOtpCreate = jest.fn();
const mockOtpFindOne = jest.fn();
jest.unstable_mockModule("../../models/Otp.js", () => ({
  default: {
    deleteMany: mockOtpDeleteMany,
    create: mockOtpCreate,
    findOne: mockOtpFindOne,
  },
}));

const mockCompare = jest.fn();
const mockHash = jest.fn();
jest.unstable_mockModule("bcryptjs", () => ({
  default: { compare: mockCompare, hash: mockHash },
}));

const mockSign = jest.fn();
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign: mockSign },
}));

const mockSendOtpEmail = jest.fn();
jest.unstable_mockModule("../../utils/sendEmail.js", () => ({
  sendOtpEmail: mockSendOtpEmail,
}));

const {
  signupUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  verifyOtp,
} = await import("../../controllers/authController.js");

// ── helpers ────────────────────────────────────────────────────────────
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.EMAIL_USER = "test@test.com";
    process.env.EMAIL_PASS = "pass";
  });

  // ── signupUser ─────────────────────────────────────────────────────
  describe("signupUser", () => {
    it("returns 400 when name is missing", async () => {
      const req = { body: { email: "a@b.com", password: "123456" } };
      const res = buildRes();
      await signupUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Name, email, and password are required" });
    });

    it("returns 400 when email is missing", async () => {
      const req = { body: { name: "Test", password: "123456" } };
      const res = buildRes();
      await signupUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when password is missing", async () => {
      const req = { body: { name: "Test", email: "a@b.com" } };
      const res = buildRes();
      await signupUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for invalid role", async () => {
      const req = { body: { name: "Test", email: "a@b.com", password: "123", role: "admin" } };
      const res = buildRes();
      await signupUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid role" });
    });

    it("returns 400 when user already exists", async () => {
      mockFindOne.mockResolvedValue({ email: "a@b.com" });
      const req = { body: { name: "Test", email: "a@b.com", password: "123456" } };
      const res = buildRes();
      await signupUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });

    it("returns 500 when email service is not configured", async () => {
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      const req = { body: { name: "Test", email: "a@b.com", password: "123456" } };
      const res = buildRes();
      await signupUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("returns 201 on successful signup and sends OTP", async () => {
      mockFindOne.mockResolvedValue(null);
      mockHash.mockResolvedValue("hashedValue");
      mockOtpCreate.mockResolvedValue({});
      mockSendOtpEmail.mockResolvedValue({ response: "OK" });

      const req = { body: { name: "Test", email: "a@b.com", password: "123456", role: "tasker" } };
      const res = buildRes();
      await signupUser(req, res);

      expect(mockOtpDeleteMany).toHaveBeenCalledWith({ email: "a@b.com" });
      expect(mockHash).toHaveBeenCalledTimes(2); // password + otp
      expect(mockOtpCreate).toHaveBeenCalled();
      expect(mockSendOtpEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── loginUser ──────────────────────────────────────────────────────
  describe("loginUser", () => {
    it("returns 400 when email is missing", async () => {
      const req = { body: { password: "123" } };
      const res = buildRes();
      await loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when password is missing", async () => {
      const req = { body: { email: "a@b.com" } };
      const res = buildRes();
      await loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when user not found", async () => {
      mockFindOne.mockResolvedValue(null);
      const req = { body: { email: "a@b.com", password: "123" } };
      const res = buildRes();
      await loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("returns 400 when password does not match", async () => {
      mockFindOne.mockResolvedValue({ email: "a@b.com", password: "hashed" });
      mockCompare.mockResolvedValue(false);
      const req = { body: { email: "a@b.com", password: "wrong" } };
      const res = buildRes();
      await loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("returns 200 with token on successful login", async () => {
      const fakeUser = {
        _id: { toString: () => "uid1" },
        name: "Test",
        email: "a@b.com",
        password: "hashed",
        role: "customer",
        skills: [],
        services: [],
      };
      mockFindOne.mockResolvedValue(fakeUser);
      mockCompare.mockResolvedValue(true);
      mockSign.mockReturnValue("jwt-token");

      const req = { body: { email: "a@b.com", password: "correct" } };
      const res = buildRes();
      await loginUser(req, res);

      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.message).toBe("Login successful");
      expect(body.token).toBe("jwt-token");
      expect(body.user.id).toBe("uid1");
    });
  });

  // ── getCurrentUser ─────────────────────────────────────────────────
  describe("getCurrentUser", () => {
    it("returns 401 when req.user is missing", async () => {
      const req = {};
      const res = buildRes();
      await getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 200 with user data", async () => {
      const fakeUser = {
        _id: { toString: () => "uid1" },
        name: "Test",
        email: "a@b.com",
        role: "customer",
        skills: [],
        services: [],
      };
      const req = { user: fakeUser };
      const res = buildRes();
      await getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].user.id).toBe("uid1");
    });
  });

  // ── logoutUser ─────────────────────────────────────────────────────
  describe("logoutUser", () => {
    it("clears cookie and returns 200", async () => {
      const req = {};
      const res = buildRes();
      await logoutUser(req, res);
      expect(res.clearCookie).toHaveBeenCalledWith(
        "token",
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logged out successfully" });
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────
  describe("verifyOtp", () => {
    it("returns 400 when email is missing", async () => {
      const req = { body: { otp: "123456" } };
      const res = buildRes();
      await verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when otp is missing", async () => {
      const req = { body: { email: "a@b.com" } };
      const res = buildRes();
      await verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when OTP record not found", async () => {
      mockOtpFindOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
      const req = { body: { email: "a@b.com", otp: "123456" } };
      const res = buildRes();
      await verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "OTP has expired or is invalid" });
    });

    it("returns 400 when OTP does not match", async () => {
      mockOtpFindOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({ otp: "hashedOtp", userData: {} }),
      });
      mockCompare.mockResolvedValue(false);
      const req = { body: { email: "a@b.com", otp: "wrong" } };
      const res = buildRes();
      await verifyOtp(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
    });

    it("creates user and returns auth response on valid OTP", async () => {
      const otpRecord = {
        otp: "hashedOtp",
        userData: { name: "Test", password: "hashedPw", role: "customer" },
      };
      mockOtpFindOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(otpRecord),
      });
      mockCompare.mockResolvedValue(true);
      mockFindOne.mockResolvedValue(null); // user does not already exist

      const createdUser = {
        _id: { toString: () => "newUid" },
        name: "Test",
        email: "a@b.com",
        role: "customer",
        skills: [],
        services: [],
      };
      mockCreate.mockResolvedValue(createdUser);
      mockSign.mockReturnValue("new-jwt");

      const req = { body: { email: "a@b.com", otp: "123456" } };
      const res = buildRes();
      await verifyOtp(req, res);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Test", email: "a@b.com", isVerified: true }),
      );
      expect(mockOtpDeleteMany).toHaveBeenCalledWith({ email: "a@b.com" });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
