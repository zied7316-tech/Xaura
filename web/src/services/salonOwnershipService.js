import api from './api';

const salonOwnershipService = {
  /**
   * Get all salons owned by current user
   */
  getMySalons: async () => {
    const response = await api.get('/my-salons');
    return response;
  },

  /**
   * Get single salon details
   */
  getMySalon: async (id) => {
    const response = await api.get(`/my-salons/${id}`);
    return response;
  },

  /**
   * Set primary salon
   */
  setPrimarySalon: async (id) => {
    const response = await api.put(`/my-salons/${id}/set-primary`);
    return response;
  },

  /**
   * Add a new salon
   */
  addSalon: async (salonData) => {
    const response = await api.post('/my-salons', salonData);
    return response;
  },

  /**
   * Check if user has access to salon
   */
  checkSalonAccess: async (id) => {
    const response = await api.get(`/my-salons/${id}/check-access`);
    return response;
  },

  /**
   * Transfer salon ownership
   */
  transferOwnership: async (id, newOwnerEmail) => {
    const response = await api.post(`/my-salons/${id}/transfer`, {
      newOwnerEmail,
    });
    return response;
  },

  /**
   * Grant access to another user
   */
  grantAccess: async (id, userEmail, role = 'manager', permissions = {}) => {
    const response = await api.post(`/my-salons/${id}/grant-access`, {
      userEmail,
      role,
      permissions,
    });
    return response;
  },

  /**
   * Revoke user access
   */
  revokeAccess: async (id, userId) => {
    const response = await api.delete(`/my-salons/${id}/revoke-access/${userId}`);
    return response;
  },
};

export default salonOwnershipService;


