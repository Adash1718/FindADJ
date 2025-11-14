import api from './auth';

export const invitationService = {
  sendInvitation: async (eventId, djId) => {
    const response = await api.post(`/queue/${eventId}/invite/${djId}`);
    return response.data;
  },

  acceptInvitation: async (eventId) => {
    const response = await api.post(`/queue/${eventId}/accept`);
    return response.data;
  },

  declineInvitation: async (eventId) => {
    const response = await api.post(`/queue/${eventId}/decline`);
    return response.data;
  },
};

