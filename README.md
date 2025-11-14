# FindADJ - Connect DJs with Event Creators

A full-stack application that connects DJs with Party Throwers (Event Creators) through an event queue system.

## Features

### Party Throwers
- Create events with detailed criteria (location, size, audience, age range, theme, music genres, equipment, etc.)
- View DJ queue for their events
- Select DJs from the queue
- Message DJs before making a selection
- Receive ratings and reviews from DJs and attendees

### DJs
- Browse available events
- Join event queues (first-come-first-served)
- Build profile with ratings and reviews
- Message event creators
- Accept or opt out of event requests

### Events
- Detailed event creation with all criteria
- Queue system for DJs to join
- Status management (open, closed, completed, cancelled)
- Messaging system between creators and DJs
- Rating system for both DJs and Party Throwers

## Tech Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, React Router
- **Authentication**: JWT
- **Database**: SQLite (easily migratable to PostgreSQL)

## Setup

1. Install dependencies:
```bash
npm run install-all
```

2. Create a `.env` file in the root directory:
```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

3. Start the development server:
```bash
npm run dev
```

This will start both the backend server (port 5000) and the React frontend (port 3000).

## Project Structure

```
FindADJ/
├── server/
│   ├── index.js              # Express server setup
│   ├── database.js           # SQLite database initialization
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   └── routes/
│       ├── auth.js          # Authentication routes
│       ├── events.js        # Event management routes
│       ├── queue.js         # Queue management routes
│       ├── messages.js      # Messaging routes
│       ├── ratings.js       # Rating/review routes
│       └── profiles.js     # Profile routes
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service functions
│   │   └── App.js           # Main app component
│   └── public/
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (Party Thrower only)
- `PATCH /api/events/:id/status` - Update event status

### Queue
- `GET /api/queue/:eventId` - Get queue for event
- `POST /api/queue/:eventId/join` - Join queue (DJ only)
- `DELETE /api/queue/:eventId/leave` - Leave queue (DJ only)
- `POST /api/queue/:eventId/select/:djId` - Select DJ (Party Thrower only)
- `POST /api/queue/:eventId/opt-out` - Opt out as selected DJ

### Messages
- `GET /api/messages/event/:eventId` - Get all messages for event
- `GET /api/messages/event/:eventId/user/:userId` - Get conversation
- `POST /api/messages` - Send message

### Ratings
- `POST /api/ratings` - Create rating
- `GET /api/ratings/user/:userId` - Get ratings for user

### Profiles
- `GET /api/profiles/dj/:userId` - Get DJ profile
- `GET /api/profiles/party-thrower/:userId` - Get Party Thrower profile
- `PATCH /api/profiles/dj/:userId` - Update DJ profile
- `PATCH /api/profiles/party-thrower/:userId` - Update Party Thrower profile
- `GET /api/profiles/notifications` - Get notifications
- `PATCH /api/profiles/notifications/:id/read` - Mark notification as read

## Database Schema

- **users**: User accounts (both DJs and Party Throwers)
- **dj_profiles**: DJ-specific profile information
- **party_thrower_profiles**: Party Thrower-specific profile information
- **events**: Event details and criteria
- **queue**: DJ queue entries for events
- **messages**: Messages between users
- **ratings**: Ratings and reviews
- **notifications**: User notifications

## Future Enhancements

- Real-time notifications using WebSockets
- Event reminders (30 minutes before event)
- Advanced search and filtering
- Image uploads for profiles and events
- Payment integration
- Calendar integration
- Mobile app

## License

ISC

