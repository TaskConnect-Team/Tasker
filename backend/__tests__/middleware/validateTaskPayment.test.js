import { jest } from "@jest/globals";

const mockFindById = jest.fn();
jest.unstable_mockModule("../../models/Task.js", () => ({
  default: { findById: mockFindById },
}));

const { validateTaskPayment } = await import("../../middleware/validateTaskPayment.js");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("validateTaskPayment middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when task is not found", async () => {
    mockFindById.mockResolvedValue(null);

    const req = { params: { taskId: "abc" }, user: { _id: "u1" } };
    const res = buildRes();
    const next = jest.fn();

    await validateTaskPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not the task customer", async () => {
    mockFindById.mockResolvedValue({
      customer: { toString: () => "otherUser" },
      status: "completed",
      paymentStatus: "none",
    });

    const req = { params: { taskId: "t1" }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    const next = jest.fn();

    await validateTaskPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized to pay for this task" });
  });

  it("returns 400 when task status is not completed", async () => {
    mockFindById.mockResolvedValue({
      customer: { toString: () => "u1" },
      status: "open",
      paymentStatus: "none",
    });

    const req = { params: { taskId: "t1" }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    const next = jest.fn();

    await validateTaskPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Task must be completed before payment" });
  });

  it("returns 400 when task is already paid", async () => {
    mockFindById.mockResolvedValue({
      customer: { toString: () => "u1" },
      status: "completed",
      paymentStatus: "paid",
    });

    const req = { params: { taskId: "t1" }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    const next = jest.fn();

    await validateTaskPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Task already paid" });
  });

  it("sets req.task and calls next on valid payment", async () => {
    const task = {
      customer: { toString: () => "u1" },
      status: "completed",
      paymentStatus: "none",
    };
    mockFindById.mockResolvedValue(task);

    const req = { params: { taskId: "t1" }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    const next = jest.fn();

    await validateTaskPayment(req, res, next);

    expect(req.task).toBe(task);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    mockFindById.mockRejectedValue(new Error("DB connection lost"));

    const req = { params: { taskId: "t1" }, user: { _id: "u1" } };
    const res = buildRes();
    const next = jest.fn();

    await validateTaskPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB connection lost" });
  });
});
