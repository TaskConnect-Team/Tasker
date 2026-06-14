import { jest } from "@jest/globals";

const mockCountDocuments = jest.fn();
jest.unstable_mockModule("../../models/Task.js", () => ({
  default: { countDocuments: mockCountDocuments },
}));

const { getCustomerDashboardStats } = await import(
  "../../controllers/dashboardController.js"
);

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("dashboardController", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getCustomerDashboardStats", () => {
    it("returns counts for open, active, completed tasks", async () => {
      mockCountDocuments
        .mockResolvedValueOnce(3)  // open
        .mockResolvedValueOnce(2)  // active
        .mockResolvedValueOnce(5); // completed

      const req = { user: { _id: "cust1" } };
      const res = buildRes();

      await getCustomerDashboardStats(req, res);

      expect(mockCountDocuments).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ open: 3, active: 2, completed: 5 });
    });

    it("returns 500 on error", async () => {
      mockCountDocuments.mockRejectedValue(new Error("DB error"));

      const req = { user: { _id: "cust1" } };
      const res = buildRes();

      await getCustomerDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
    });
  });
});
