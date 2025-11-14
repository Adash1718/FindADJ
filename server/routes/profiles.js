const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get DJ profile
router.get('/dj/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      dp.bio,
      dp.genres,
      dp.experience_years,
      dp.average_rating,
      dp.total_events,
      dp.created_at
    FROM users u
    JOIN dj_profiles dp ON u.id = dp.user_id
    WHERE u.id = ?
  `;

  db.get(query, [userId], (err, profile) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!profile) {
      return res.status(404).json({ error: 'DJ profile not found' });
    }
    res.json({ profile });
  });
});

// Get Party Thrower profile
router.get('/party-thrower/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      pt.bio,
      pt.average_rating,
      pt.total_events_created,
      pt.created_at
    FROM users u
    JOIN party_thrower_profiles pt ON u.id = pt.user_id
    WHERE u.id = ?
  `;

  db.get(query, [userId], (err, profile) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!profile) {
      return res.status(404).json({ error: 'Party Thrower profile not found' });
    }
    res.json({ profile });
  });
});

// Update DJ profile
router.patch('/dj/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  // Verify user owns this profile
  if (req.user.id !== userId && req.user.user_type !== 'dj') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { bio, genres, experience_years } = req.body;
  const updates = [];
  const values = [];

  if (bio !== undefined) {
    updates.push('bio = ?');
    values.push(bio);
  }
  if (genres !== undefined) {
    updates.push('genres = ?');
    values.push(genres);
  }
  if (experience_years !== undefined) {
    updates.push('experience_years = ?');
    values.push(experience_years);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(userId);

  db.run(
    `UPDATE dj_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Update Party Thrower profile
router.patch('/party-thrower/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  // Verify user owns this profile
  if (req.user.id !== userId && req.user.user_type !== 'party_thrower') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { bio } = req.body;

  if (bio === undefined) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  db.run(
    'UPDATE party_thrower_profiles SET bio = ? WHERE user_id = ?',
    [bio, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Get notifications
router.get('/notifications', authenticate, (req, res) => {
  const query = `
    SELECT 
      n.*,
      e.title as event_title
    FROM notifications n
    LEFT JOIN events e ON n.event_id = e.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `;

  db.all(query, [req.user.id], (err, notifications) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ notifications });
  });
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

module.exports = router;

