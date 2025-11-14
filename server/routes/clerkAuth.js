const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const db = require('../database');

const router = express.Router();

// Complete profile for Clerk user
router.post('/complete-profile-clerk', async (req, res) => {
  try {
    const userId = req.header('X-User-Id');
    const { name, user_type, bio, genres, experience_years, email } = req.body;

    console.log('Complete profile request:', { userId, name, user_type, email });

    if (!name || !user_type) {
      return res.status(400).json({ error: 'Name and user type required' });
    }

    // Use email from request body, or generate unique one
    const userEmail = email || `${userId}@clerk.user`;

    // Create or update user in local database
    db.get('SELECT id FROM users WHERE id = ?', [userId], (err, existingUser) => {
      if (err) {
        console.error('Database error checking user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        console.log('Updating existing user:', userId);
        // Update existing user
        db.run(
          'UPDATE users SET name = ?, user_type = ? WHERE id = ?',
          [name, user_type, userId],
          function(err) {
            if (err) {
              console.error('Error updating user:', err);
              return res.status(500).json({ error: 'Failed to update user: ' + err.message });
            }
            console.log('User updated successfully');
            completeProfile();
          }
        );
      } else {
        console.log('Creating new user:', userId, 'Email:', userEmail);
        // Create new user with unique email
        db.run(
          'INSERT INTO users (id, email, password, name, user_type) VALUES (?, ?, ?, ?, ?)',
          [userId, userEmail, '', name, user_type],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              console.error('Error details:', err.message);
              return res.status(500).json({ error: 'Failed to create user: ' + err.message });
            }
            console.log('User created successfully');
            completeProfile();
          }
        );
      }
    });

    async function completeProfile() {
      const profileId = uuidv4();
      
      // Update Clerk user metadata with user_type and name
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            user_type: user_type,
            name: name
          }
        });
        console.log('Updated Clerk metadata for user:', userId, 'Type:', user_type);
      } catch (clerkError) {
        console.error('Error updating Clerk metadata:', clerkError);
        return res.status(500).json({ error: 'Failed to update user metadata in Clerk' });
      }
      
      if (user_type === 'dj') {
        db.run(
          'INSERT OR REPLACE INTO dj_profiles (id, user_id, bio, genres, experience_years) VALUES (?, ?, ?, ?, ?)',
          [profileId, userId, bio, genres, experience_years || 0],
          function(err) {
            if (err) {
              console.error('Error creating DJ profile:', err);
              return res.status(500).json({ error: 'Failed to create profile' });
            }
            console.log('DJ profile created successfully');
            res.json({ success: true, user: { id: userId, name, user_type } });
          }
        );
      } else {
        db.run(
          'INSERT OR REPLACE INTO party_thrower_profiles (id, user_id, bio) VALUES (?, ?, ?)',
          [profileId, userId, bio],
          function(err) {
            if (err) {
              console.error('Error creating Party Thrower profile:', err);
              return res.status(500).json({ error: 'Failed to create profile' });
            }
            console.log('Party Thrower profile created successfully');
            res.json({ success: true, user: { id: userId, name, user_type } });
          }
        );
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

