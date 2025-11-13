import api from './api';

const supportTicketService = {
  // Super Admin APIs
  getAllTickets: async (params = {}) => {
    const response = await api.get('/tickets/admin/all', { params });
    return response;
  },

  getTicketStats: async () => {
    const response = await api.get('/tickets/admin/stats');
    return response;
  },

  assignTicket: async (id) => {
    const response = await api.post(`/tickets/admin/${id}/assign`);
    return response;
  },

  updateTicketStatus: async (id, status) => {
    const response = await api.put(`/tickets/admin/${id}/status`, { status });
    return response;
  },

  // Owner APIs
  getMyTickets: async (params = {}) => {
    const response = await api.get('/tickets/my-tickets', { params });
    return response;
  },

  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response;
  },

  // Shared APIs
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response;
  },

  getTicketMessages: async (id) => {
    const response = await api.get(`/tickets/${id}/messages`);
    return response;
  },

  addMessage: async (id, message, isInternal = false) => {
    const response = await api.post(`/tickets/${id}/messages`, {
      message,
      isInternal,
    });
    return response;
  },
};

export default supportTicketService;


