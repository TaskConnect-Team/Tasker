import { jest } from "@jest/globals";
import { authorizeRoles, isCustomer, isTasker } from "../../middleware/roleMiddleware.js";

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("roleMiddleware", () => {
  describe("authorizeRoles", () => {
    it("returns 401 when req.user is missing", () => {
      const req = {};
      const res = buildRes();
      const next = jest.fn();

      authorizeRoles("customer")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Not authorized" });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 403 when user role is not in allowed list", () => {
      const req = { user: { role: "tasker" } };
      const res = buildRes();
      const next = jest.fn();

      authorizeRoles("customer")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next when user role matches", () => {
      const req = { user: { role: "customer" } };
      const res = buildRes();
      const next = jest.fn();

      authorizeRoles("customer")(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("accepts multiple roles", () => {
      const req = { user: { role: "tasker" } };
      const res = buildRes();
      const next = jest.fn();

      authorizeRoles("customer", "tasker")(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("isCustomer", () => {
    it("allows customer role", () => {
      const req = { user: { role: "customer" } };
      const res = buildRes();
      const next = jest.fn();

      isCustomer(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("rejects tasker role", () => {
      const req = { user: { role: "tasker" } };
      const res = buildRes();
      const next = jest.fn();

      isCustomer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("isTasker", () => {
    it("allows tasker role", () => {
      const req = { user: { role: "tasker" } };
      const res = buildRes();
      const next = jest.fn();

      isTasker(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("rejects customer role", () => {
      const req = { user: { role: "customer" } };
      const res = buildRes();
      const next = jest.fn();

      isTasker(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
