import { protect } from '../middleware/authMiddleware.js';

describe('Auth Middleware Security', () => {
  it('should return 401 Not Authorized if no token is provided', () => {
    // Mock the Express req, res, and next objects
    const req = {
      headers: {} // No authorization header
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    // Execute the middleware
    protect(req, res, next);

    // Assert that the middleware caught the error and responded with 401
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Not authorized, no token' })
    );
    expect(next).not.toHaveBeenCalled(); // Ensures the user didn't get through
  });
});