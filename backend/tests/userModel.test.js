import mongoose from 'mongoose';
import User from '../models/User.js'; // Adjust path to your User model

describe('User Model Validation', () => {
  it('should fail validation if the required email field is missing', async () => {
    // Create a user object without an email
    const userWithoutEmail = new User({
      name: 'John Doe',
      password: 'securepassword123',
      role: 'customer'
    });

    let error;
    try {
      await userWithoutEmail.validate(); // .validate() checks schema without hitting the DB
    } catch (err) {
      error = err;
    }

    // Assert that a validation error was thrown specifically for the email field
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.email).toBeDefined();
  });
});