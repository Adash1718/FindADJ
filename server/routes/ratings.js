const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create rating
router.post('/', authenticate, [
  body('event_id').notEmpty(),
  body('rated_user_id').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_id, rated_user_id, rating, review } = req.body;

    // Check if already rated
    db.get(
      'SELECT id FROM ratings WHERE event_id = ? AND rated_user_id = ? AND rater_user_id = ?',
      [event_id, rated_user_id, req.user.id],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (existing) {
          return res.status(400).json({ error: 'Already rated this user for this event' });
        }

        const ratingId = uuidv4();
        db.run(
          'INSERT INTO ratings (id, event_id, rated_user_id, rater_user_id, rating, review) VALUES (?, ?, ?, ?, ?, ?)',
          [ratingId, event_id, rated_user_id, req.user.id, rating, review],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create rating' });
            }

            // Update average rating for DJ or Party Thrower
            db.get('SELECT user_type FROM users WHERE id = ?', [rated_user_id], (err, user) => {
              if (!err && user) {
                if (user.user_type === 'dj') {
                  // Calculate new average for DJ
                  db.all(
                    'SELECT rating FROM ratings WHERE rated_user_id = ?',
                    [rated_user_id],
                    (err, ratings) => {
                      if (!err && ratings.length > 0) {
                        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
                        db.run(
                          'UPDATE dj_profiles SET average_rating = ? WHERE user_id = ?',
                          [avg, rated_user_id]
                        );
                      }
                    }
                  );
                } else {
                  // Calculate new average for Party Thrower
                  db.all(
                    'SELECT rating FROM ratings WHERE rated_user_id = ?',
                    [rated_user_id],
                    (err, ratings) => {
                      if (!err && ratings.length > 0) {
                        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
                        db.run(
                          'UPDATE party_thrower_profiles SET average_rating = ? WHERE user_id = ?',
                          [avg, rated_user_id]
                        );
                      }
                    }
                  );
                }
              }
            });

            db.get('SELECT * FROM ratings WHERE id = ?', [ratingId], (err, newRating) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json({ rating: newRating });
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get ratings for a user
router.get('/user/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      r.*,
      e.title as event_title,
      rater.name as rater_name
    FROM ratings r
    JOIN events e ON r.event_id = e.id
    JOIN users rater ON r.rater_user_id = rater.id
    WHERE r.rated_user_id = ?
    ORDER BY r.created_at DESC
  `;

  db.all(query, [userId], (err, ratings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ ratings });
  });
});

module.exports = router;

