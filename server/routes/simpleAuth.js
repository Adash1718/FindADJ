const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

// Sign up - just create account, no role yet
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username exists
    db.get('SELECT id FROM users WHERE email = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (user) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Create user without user_type (will be set during profile setup)
      db.run(
        'INSERT INTO users (id, email, password, name, user_type) VALUES (?, ?, ?, ?, ?)',
        [userId, username, hashedPassword, username, 'pending'],
        function(err) {
          if (err) {
            console.error('Database error creating user:', err);
            return res.status(500).json({ error: 'Failed to create account: ' + err.message });
          }

          console.log('User created successfully:', userId);
          res.status(201).json({
            user: {
              id: userId,
              username: username,
              user_type: null
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error during signin:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // If user_type is still pending, they need to complete profile
      const userType = user.user_type === 'pending' ? null : user.user_type;

      console.log('User signed in successfully:', user.id);
      res.json({
        user: {
          id: user.id,
          username: user.email,
          name: user.name,
          user_type: userType,
          email: user.email
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete profile (set role and profile info)
router.post('/complete-profile', async (req, res) => {
  try {
    const userId = req.header('X-User-Id');
    const { name, user_type, bio, genres, experience_years } = req.body;

    if (!name || !user_type) {
      return res.status(400).json({ error: 'Name and user type required' });
    }

    // Update user
    db.run(
      'UPDATE users SET name = ?, user_type = ? WHERE id = ?',
      [name, user_type, userId],
      function(err) {
        if (err) {
          console.error('Error updating user:', err);
          return res.status(500).json({ error: 'Failed to update user: ' + err.message });
        }
        
        console.log('User updated:', userId, 'to', user_type);

        // Create profile based on user type
        const profileId = uuidv4();
        if (user_type === 'dj') {
          db.run(
            'INSERT INTO dj_profiles (id, user_id, bio, genres, experience_years) VALUES (?, ?, ?, ?, ?)',
            [profileId, userId, bio, genres, experience_years || 0],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create profile' });
              }

              // Get the complete user data
              db.get('SELECT id, email, name, user_type FROM users WHERE id = ?', [userId], (err, user) => {
                res.json({
                  user: {
                    id: user.id,
                    username: user.email,
                    name: user.name,
                    user_type: user.user_type,
                    email: user.email
                  }
                });
              });
            }
          );
        } else {
          db.run(
            'INSERT INTO party_thrower_profiles (id, user_id, bio) VALUES (?, ?, ?)',
            [profileId, userId, bio],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create profile' });
              }

              // Get the complete user data
              db.get('SELECT id, email, name, user_type FROM users WHERE id = ?', [userId], (err, user) => {
                res.json({
                  user: {
                    id: user.id,
                    username: user.email,
                    name: user.name,
                    user_type: user.user_type,
                    email: user.email
                  }
                });
              });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

