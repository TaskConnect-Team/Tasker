import { jest } from "@jest/globals";

const mockReviewFindOne = jest.fn();
const mockReviewCreate = jest.fn();
const mockReviewAggregate = jest.fn();
jest.unstable_mockModule("../../models/Review.js", () => ({
  default: {
    findOne: mockReviewFindOne,
    create: mockReviewCreate,
    aggregate: mockReviewAggregate,
  },
}));

const mockTaskFindById = jest.fn();
jest.unstable_mockModule("../../models/Task.js", () => ({
  default: { findById: mockTaskFindById },
}));

const mockUserFindByIdAndUpdate = jest.fn();
jest.unstable_mockModule("../../models/User.js", () => ({
  default: { findByIdAndUpdate: mockUserFindByIdAndUpdate },
}));

const { createReview } = await import("../../controllers/reviewController.js");

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("reviewController – createReview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when taskId is missing", async () => {
    const req = { body: { rating: 4 }, user: { _id: "u1" } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Task is required" });
  });

  it("returns 400 when rating is out of range", async () => {
    const req = { body: { taskId: "t1", rating: 6 }, user: { _id: "u1" } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Rating must be between 1 and 5" });
  });

  it("returns 400 when rating is 0", async () => {
    const req = { body: { taskId: "t1", rating: 0 }, user: { _id: "u1" } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when rating is not a number", async () => {
    const req = { body: { taskId: "t1", rating: "abc" }, user: { _id: "u1" } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when task not found", async () => {
    mockTaskFindById.mockResolvedValue(null);
    const req = { body: { taskId: "t1", rating: 4 }, user: { _id: "u1" } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 403 when user is not the task customer", async () => {
    mockTaskFindById.mockResolvedValue({
      _id: "t1",
      customer: { toString: () => "otherUser" },
      status: "completed",
      tasker: "tasker1",
    });
    const req = { body: { taskId: "t1", rating: 4 }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 400 when task is not completed", async () => {
    mockTaskFindById.mockResolvedValue({
      _id: "t1",
      customer: { toString: () => "u1" },
      status: "open",
      tasker: "tasker1",
    });
    const req = { body: { taskId: "t1", rating: 4 }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Task must be completed to review" });
  });

  it("returns 400 when task has no tasker", async () => {
    mockTaskFindById.mockResolvedValue({
      _id: "t1",
      customer: { toString: () => "u1" },
      status: "completed",
      tasker: null,
    });
    const req = { body: { taskId: "t1", rating: 4 }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Task has no tasker assigned" });
  });

  it("returns 409 when review already submitted", async () => {
    mockTaskFindById.mockResolvedValue({
      _id: "t1",
      customer: { toString: () => "u1" },
      status: "completed",
      tasker: "tasker1",
    });
    mockReviewFindOne.mockResolvedValue({ _id: "existingReview" });

    const req = { body: { taskId: "t1", rating: 4 }, user: { _id: { toString: () => "u1" } } };
    const res = buildRes();
    await createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("creates review and updates tasker rating on success", async () => {
    const task = {
      _id: "t1",
      customer: { toString: () => "u1" },
      status: "completed",
      tasker: "tasker1",
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockTaskFindById.mockResolvedValue(task);
    mockReviewFindOne.mockResolvedValue(null);

    const review = { _id: "r1", rating: 4, comment: "Great" };
    mockReviewCreate.mockResolvedValue(review);
    mockReviewAggregate.mockResolvedValue([{ averageRating: 4.5, totalReviews: 10 }]);
    mockUserFindByIdAndUpdate.mockResolvedValue({});

    const req = {
      body: { taskId: "t1", rating: 4, comment: "Great", tags: ["fast", "clean"] },
      user: { _id: { toString: () => "u1" } },
    };
    const res = buildRes();
    await createReview(req, res);

    expect(mockReviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4, comment: "Great", tags: ["fast", "clean"] }),
    );
    expect(task.save).toHaveBeenCalled();
    expect(task.status).toBe("reviewed");
    expect(task.rating).toBe(4);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      "tasker1",
      expect.objectContaining({ averageRating: 4.5, totalReviews: 10 }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
