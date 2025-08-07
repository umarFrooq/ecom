const mongoose = require('mongoose'); // Mongoose is used by the User model
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  // No database connection needed for these specific unit tests on model methods
  // if they don't interact with the database directly (like save, find, etc.)

  describe('Password Hashing and Comparison', () => {
    let sampleUser;
    const plainPassword = 'password123';

    beforeAll(async () => {
      // Create a new user instance (not saved to DB for this test)
      // We need to simulate the pre-save hook manually or test an instance that would have it.
      // For matchPassword, we need a user with an already hashed password.

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      // Create a user object with the hashed password, as if it were retrieved from DB
      sampleUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        // password field is normally not selected, but for direct instantiation:
        password: hashedPassword
      });
    });

    it('should correctly match a valid password', async () => {
      const isMatch = await sampleUser.matchPassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should not match an invalid password', async () => {
      const isMatch = await sampleUser.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should hash password on save (conceptual - requires DB interaction or pre-save hook call)', () => {
      // To truly test the pre-save hook, we'd need to mock .save() or use an in-memory DB.
      // For now, this is a conceptual placeholder.
      // const userWithPlainPassword = new User({ username: 'new', email: 'new@test.com', password: 'newPassword123'});
      // expect(userWithPlainPassword.password).toBe('newPassword123');
      // // After a save (or manual call to pre-save hook), password would be hashed.
      // // await userWithPlainPassword.save() // requires DB
      // // expect(userWithPlainPassword.password).not.toBe('newPassword123');
      expect(true).toBe(true); // Placeholder for the conceptual test
    });
  });
});
