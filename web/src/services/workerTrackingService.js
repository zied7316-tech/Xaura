import api from './api';

export const workerTrackingService = {
  // Get tracking settings
  getSettings: async () => {
    const response = await api.get('/worker-tracking/settings');
    return response.data;
  },

  // Update tracking settings
  updateSettings: async (settings) => {
    const response = await api.put('/worker-tracking/settings', settings);
    return response.data;
  },

  // Worker reports location/WiFi (for mobile app)
  reportLocation: async (data) => {
    const response = await api.post('/worker-tracking/report', data);
    return response.data;
  }
};

