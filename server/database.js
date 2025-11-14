const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table (both Party Throwers and DJs)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      user_type TEXT CHECK(user_type IN ('party_thrower', 'dj', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // DJ Profiles
  db.run(`
    CREATE TABLE IF NOT EXISTS dj_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      bio TEXT,
      genres TEXT,
      experience_years INTEGER,
      average_rating REAL DEFAULT 0,
      total_events INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Party Thrower Profiles
  db.run(`
    CREATE TABLE IF NOT EXISTS party_thrower_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      bio TEXT,
      average_rating REAL DEFAULT 0,
      total_events_created INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Events
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      location_private INTEGER DEFAULT 1,
      size INTEGER,
      audience TEXT,
      age_range_min INTEGER,
      age_range_max INTEGER,
      occupancy INTEGER,
      theme TEXT,
      music_genres TEXT,
      time_frame_start DATETIME,
      time_frame_end DATETIME,
      provided_equipment TEXT,
      necessary_equipment TEXT,
      additional_notes TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'completed', 'cancelled')),
      selected_dj_id TEXT,
      pending_dj_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (selected_dj_id) REFERENCES users(id),
      FOREIGN KEY (pending_dj_id) REFERENCES users(id)
    )
  `);

  // Queue (DJs who joined the event queue)
  db.run(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      dj_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (dj_id) REFERENCES users(id),
      UNIQUE(event_id, dj_id)
    )
  `);

  // Messages
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  // Ratings (for events and DJs)
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      rated_user_id TEXT NOT NULL,
      rater_user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (rated_user_id) REFERENCES users(id),
      FOREIGN KEY (rater_user_id) REFERENCES users(id)
    )
  `);

  // Notifications
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      event_id TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
});

module.exports = db;

