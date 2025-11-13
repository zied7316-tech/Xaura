import api from './api';

const chatService = {
  /**
   * Get or create chat with a worker/client
   */
  getOrCreateChat: async (workerId = null, clientId = null, appointmentId = null) => {
    const response = await api.post('/chats', {
      workerId,
      clientId,
      appointmentId,
    });
    return response;
  },

  /**
   * Get all my chats
   */
  getMyChats: async () => {
    const response = await api.get('/chats');
    return response;
  },

  /**
   * Get single chat
   */
  getChat: async (id) => {
    const response = await api.get(`/chats/${id}`);
    return response;
  },

  /**
   * Get messages for a chat
   */
  getChatMessages: async (id) => {
    const response = await api.get(`/chats/${id}/messages`);
    return response;
  },

  /**
   * Send a message
   */
  sendMessage: async (id, message) => {
    const response = await api.post(`/chats/${id}/messages`, { message });
    return response;
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async () => {
    const response = await api.get('/chats/unread/count');
    return response;
  },

  /**
   * Delete chat
   */
  deleteChat: async (id) => {
    const response = await api.delete(`/chats/${id}`);
    return response;
  },
};

export default chatService;


