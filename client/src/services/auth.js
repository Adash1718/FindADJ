import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user info to requests
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    const userData = JSON.parse(user);
    config.headers['X-User-Id'] = userData.id;
    config.headers['X-User-Type'] = userData.user_type;
    console.log('API Request Headers:', { userId: userData.id, userType: userData.user_type });
  } else {
    console.warn('No user data in localStorage for API request');
  }
  return config;
});

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const eventService = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
};

export const queueService = {
  join: async (eventId) => {
    const response = await api.post(`/queue/${eventId}/join`);
    return response.data;
  },

  leave: async (eventId) => {
    const response = await api.delete(`/queue/${eventId}/leave`);
    return response.data;
  },

  getQueue: async (eventId) => {
    const response = await api.get(`/queue/${eventId}`);
    return response.data;
  },

  selectDJ: async (eventId, djId) => {
    const response = await api.post(`/queue/${eventId}/select/${djId}`);
    return response.data;
  },

  optOut: async (eventId) => {
    const response = await api.post(`/queue/${eventId}/opt-out`);
    return response.data;
  },
};

export const messageService = {
  send: async (eventId, receiverId, content) => {
    const response = await api.post('/messages', { event_id: eventId, receiver_id: receiverId, content });
    return response.data;
  },

  getByEvent: async (eventId) => {
    const response = await api.get(`/messages/event/${eventId}`);
    return response.data;
  },

  getConversation: async (eventId, userId) => {
    const response = await api.get(`/messages/event/${eventId}/user/${userId}`);
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },
};

export const profileService = {
  getDJ: async (userId) => {
    const response = await api.get(`/profiles/dj/${userId}`);
    return response.data;
  },

  getPartyThrower: async (userId) => {
    const response = await api.get(`/profiles/party-thrower/${userId}`);
    return response.data;
  },

  updateDJ: async (userId, data) => {
    const response = await api.patch(`/profiles/dj/${userId}`, data);
    return response.data;
  },

  updatePartyThrower: async (userId, data) => {
    const response = await api.patch(`/profiles/party-thrower/${userId}`, data);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/profiles/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await api.patch(`/profiles/notifications/${notificationId}/read`);
    return response.data;
  },
};

export const ratingService = {
  create: async (eventId, ratedUserId, rating, review) => {
    const response = await api.post('/ratings', { event_id: eventId, rated_user_id: ratedUserId, rating, review });
    return response.data;
  },

  getByUser: async (userId) => {
    const response = await api.get(`/ratings/user/${userId}`);
    return response.data;
  },
};

export default api;

