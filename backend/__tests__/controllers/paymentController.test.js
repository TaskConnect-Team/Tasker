import { jest } from "@jest/globals";

const mockUserFindById = jest.fn();
jest.unstable_mockModule("../../models/User.js", () => ({
  default: { findById: mockUserFindById },
}));

jest.unstable_mockModule("../../models/Task.js", () => ({
  default: {},
}));

const mockPaymentIntentsCreate = jest.fn();
jest.unstable_mockModule("stripe", () => ({
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: { create: mockPaymentIntentsCreate },
  })),
}));

const { createPaymentIntent, makePayment } = await import(
  "../../controllers/paymentController.js"
);

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("paymentController", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createPaymentIntent", () => {
    it("creates a Stripe payment intent with correct amount", async () => {
      const task = { _id: "t1", price: 50, finalPrice: null, save: jest.fn() };
      mockPaymentIntentsCreate.mockResolvedValue({ client_secret: "pi_secret" });

      const req = { task, user: { _id: { toString: () => "u1" } } };
      const res = buildRes();
      await createPaymentIntent(req, res);

      expect(task.finalPrice).toBe(50);
      expect(task.save).toHaveBeenCalled();
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5000, currency: "usd" }),
      );
      expect(res.json).toHaveBeenCalledWith({ clientSecret: "pi_secret" });
    });

    it("does not override existing finalPrice", async () => {
      const task = { _id: "t1", price: 50, finalPrice: 45, save: jest.fn() };
      mockPaymentIntentsCreate.mockResolvedValue({ client_secret: "pi_secret" });

      const req = { task, user: { _id: { toString: () => "u1" } } };
      const res = buildRes();
      await createPaymentIntent(req, res);

      expect(task.finalPrice).toBe(45);
      expect(task.save).not.toHaveBeenCalled();
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 4500 }),
      );
    });

    it("returns 500 on Stripe error", async () => {
      const task = { _id: "t1", price: 50, finalPrice: 50, save: jest.fn() };
      mockPaymentIntentsCreate.mockRejectedValue(new Error("Stripe down"));

      const req = { task, user: { _id: { toString: () => "u1" } } };
      const res = buildRes();
      await createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("makePayment", () => {
    it("calculates commission and pays tasker", async () => {
      const task = {
        _id: "t1",
        finalPrice: 100,
        tasker: "tasker1",
        paymentStatus: "none",
        save: jest.fn(),
      };
      const tasker = { balance: 200, save: jest.fn() };
      mockUserFindById.mockResolvedValue(tasker);

      const req = { task, user: { _id: "u1" } };
      const res = buildRes();
      await makePayment(req, res);

      expect(task.platformFee).toBe(10);       // 10% of 100
      expect(task.taskerEarning).toBe(90);      // 100 - 10
      expect(tasker.balance).toBe(290);         // 200 + 90
      expect(task.paymentStatus).toBe("paid");
      expect(task.save).toHaveBeenCalled();
      expect(tasker.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Payment successful",
          paidAmount: 100,
          platformFee: 10,
          taskerReceived: 90,
        }),
      );
    });

    it("returns 500 when tasker lookup fails", async () => {
      const task = { _id: "t1", finalPrice: 100, tasker: "tasker1", save: jest.fn() };
      mockUserFindById.mockRejectedValue(new Error("DB fail"));

      const req = { task, user: { _id: "u1" } };
      const res = buildRes();
      await makePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
