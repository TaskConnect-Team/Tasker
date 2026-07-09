import { jest } from "@jest/globals";

// ── mocks ──────────────────────────────────────────────────────────────
const mockTaskCreate = jest.fn();
const mockTaskFind = jest.fn();
const mockTaskFindById = jest.fn();
const mockTaskAggregate = jest.fn();
const mockUserFindById = jest.fn();
const mockSendPushNotification = jest.fn();
jest.unstable_mockModule("../../models/Task.js", () => ({
  default: {
    create: mockTaskCreate,
    find: mockTaskFind,
    findById: mockTaskFindById,
    aggregate: mockTaskAggregate,
  },
}));

jest.unstable_mockModule("../../models/User.js", () => ({
  default: {
    findById: mockUserFindById,
  },
}));

jest.unstable_mockModule("../../utils/pushNotification.js", () => ({
  sendPushNotification: mockSendPushNotification,
}));

jest.unstable_mockModule("../../utils/notificationService.js", () => ({
  notifyMatchingTaskersForTask: jest.fn().mockResolvedValue(null),
  notifyTaskCustomer: jest.fn().mockResolvedValue(null),
  notifyTasker: jest.fn().mockResolvedValue(null),
}));

const {
  createTask,
  getTasks,
  getTaskById,
  acceptTask,
  startTask,
  updateTaskStatus,
  cancelTask,
  searchTasks,
} = await import("../../controllers/taskController.js");

// ── helpers ────────────────────────────────────────────────────────────
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("taskController", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createTask ─────────────────────────────────────────────────────
  describe("createTask", () => {
    it("returns 403 when user is not a customer", async () => {
      const req = { user: { role: "tasker", id: "u1" }, body: {} };
      const res = buildRes();
      await createTask(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 400 when lat/lng are missing", async () => {
      const req = {
        user: { role: "customer", id: "u1" },
        body: { title: "Fix sink", description: "Leaky", price: 50, city: "NYC" },
      };
      const res = buildRes();
      await createTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "lat and lng are required" });
    });

    it("creates task with valid data", async () => {
      const createdTask = {
        _id: "t1",
        title: "Fix sink",
        price: 50,
        city: "NYC",
        location: { type: "Point", coordinates: [-74, 40.7] },
        locationLabel: "",
        toObject() { return { ...this }; },
      };
      mockTaskCreate.mockResolvedValue(createdTask);

      const req = {
        user: { role: "customer", id: "u1" },
        body: { title: "Fix sink", description: "Leaky", price: 50, city: "NYC", lat: 40.7, lng: -74 },
      };
      const res = buildRes();
      await createTask(req, res);

      expect(mockTaskCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fix sink",
          location: { type: "Point", coordinates: [-74, 40.7] },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ── getTaskById ────────────────────────────────────────────────────
  describe("getTaskById", () => {
    it("returns 404 when task not found", async () => {
      mockTaskFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const req = { params: { id: "t1" } };
      const res = buildRes();
      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns serialized task on success", async () => {
      const task = {
        _id: "t1",
        title: "Fix sink",
        location: { type: "Point", coordinates: [-74, 40.7] },
        locationLabel: "Downtown NYC",
        city: "NYC",
        toObject() { return { ...this }; },
      };
      mockTaskFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(task) });

      const req = { params: { id: "t1" } };
      const res = buildRes();
      await getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.locationLabel).toBe("Downtown NYC");
      expect(body.geoLocation).toEqual({ type: "Point", coordinates: [-74, 40.7] });
    });
  });

  // ── acceptTask ─────────────────────────────────────────────────────
  describe("acceptTask", () => {
    it("returns 404 when task not found", async () => {
      mockTaskFindById.mockResolvedValue(null);

      const req = { params: { id: "t1" }, user: { _id: "u1", name: "Tasker" } };
      const res = buildRes();
      await acceptTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when task is already assigned", async () => {
      mockTaskFindById.mockResolvedValue({ status: "assigned" });

      const req = { params: { id: "t1" }, user: { _id: "u1" } };
      const res = buildRes();
      await acceptTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("accepts an open task", async () => {
      const task = {
        _id: "t1",
        status: "open",
        location: { type: "Point", coordinates: [-74, 40.7] },
        locationLabel: "",
        city: "NYC",
        save: jest.fn(),
        toObject() { return { ...this }; },
      };
      mockTaskFindById.mockResolvedValue(task);

      const req = { params: { id: "t1" }, user: { _id: "u1", name: "Alice" } };
      const res = buildRes();
      await acceptTask(req, res);

      expect(task.tasker).toBe("u1");
      expect(task.status).toBe("assigned");
      expect(task.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task accepted successfully" }),
      );
    });
  });

  // ── startTask ─────────────────────────────────────────────────────
  describe("startTask", () => {
    it("starts an assigned task for the owning tasker and notifies the customer", async () => {
      const task = {
        _id: "t1",
        status: "assigned",
        tasker: { toString: () => "u1" },
        customer: "c1",
        save: jest.fn(),
        toObject() { return { ...this }; },
      };

      mockTaskFindById.mockResolvedValue(task);
      mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue({ fcmTokens: ["tok1"] }) });
      mockSendPushNotification.mockResolvedValue({ successCount: 1 });

      const req = { params: { id: "t1" }, user: { _id: { toString: () => "u1" }, name: "Alice" } };
      const res = buildRes();
      await startTask(req, res);

      expect(task.status).toBe("in-progress");
      expect(task.save).toHaveBeenCalled();
      expect(mockSendPushNotification).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task started successfully" }),
      );
    });
  });

  // ── updateTaskStatus ───────────────────────────────────────────────
  describe("updateTaskStatus", () => {
    it("returns 400 for invalid status", async () => {
      const req = { body: { status: "deleted" }, params: { id: "t1" }, user: { _id: "u1" } };
      const res = buildRes();
      await updateTaskStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid status update" });
    });

    it("returns 404 when task not found", async () => {
      mockTaskFindById.mockResolvedValue(null);
      const req = { body: { status: "in-progress" }, params: { id: "t1" }, user: { _id: "u1" } };
      const res = buildRes();
      await updateTaskStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("transitions open → assigned", async () => {
      const task = {
        _id: "t1",
        status: "open",
        tasker: null,
        location: { type: "Point", coordinates: [-74, 40.7] },
        locationLabel: "",
        city: "NYC",
        save: jest.fn(),
        toObject() { return { ...this }; },
      };
      mockTaskFindById.mockResolvedValue(task);

      const req = {
        body: { status: "assigned" },
        params: { id: "t1" },
        user: { _id: { toString: () => "u1" }, name: "Bob" },
      };
      const res = buildRes();
      await updateTaskStatus(req, res);

      expect(task.status).toBe("assigned");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("rejects in-progress when task is not assigned", async () => {
      const task = {
        _id: "t1",
        status: "open",
        tasker: null,
        save: jest.fn(),
      };
      mockTaskFindById.mockResolvedValue(task);

      const req = {
        body: { status: "in-progress" },
        params: { id: "t1" },
        user: { _id: { toString: () => "u1" } },
      };
      const res = buildRes();
      await updateTaskStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── cancelTask ─────────────────────────────────────────────────────
  describe("cancelTask", () => {
    it("returns 404 when task not found", async () => {
      mockTaskFindById.mockResolvedValue(null);
      const req = { params: { id: "t1" }, user: { _id: "u1" } };
      const res = buildRes();
      await cancelTask(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when user is not the customer", async () => {
      mockTaskFindById.mockResolvedValue({
        customer: { toString: () => "otherUser" },
        status: "open",
      });
      const req = { params: { id: "t1" }, user: { _id: { toString: () => "u1" } } };
      const res = buildRes();
      await cancelTask(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 400 when task is not open", async () => {
      mockTaskFindById.mockResolvedValue({
        customer: { toString: () => "u1" },
        status: "assigned",
      });
      const req = { params: { id: "t1" }, user: { _id: { toString: () => "u1" } } };
      const res = buildRes();
      await cancelTask(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("cancels an open task", async () => {
      const task = {
        _id: "t1",
        title: "Fix sink",
        customer: { toString: () => "u1" },
        status: "open",
        location: { type: "Point", coordinates: [-74, 40.7] },
        locationLabel: "",
        city: "NYC",
        save: jest.fn(),
        toObject() { return { ...this }; },
      };
      mockTaskFindById.mockResolvedValue(task);

      const req = { params: { id: "t1" }, user: { _id: { toString: () => "u1" } } };
      const res = buildRes();
      await cancelTask(req, res);

      expect(task.status).toBe("cancelled");
      expect(task.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task cancelled successfully" }),
      );
    });
  });

  // ── searchTasks ────────────────────────────────────────────────────
  describe("searchTasks", () => {
    it("searches tasks with query and filters", async () => {
      mockTaskFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const req = {
        query: { q: "plumbing", status: "open", minPrice: "10", maxPrice: "100" },
      };
      const res = buildRes();
      await searchTasks(req, res);

      expect(mockTaskFind).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("defaults status to open when not provided", async () => {
      mockTaskFind.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const req = { query: {} };
      const res = buildRes();
      await searchTasks(req, res);

      const query = mockTaskFind.mock.calls[0][0];
      expect(query.status).toBe("open");
    });
  });
});
