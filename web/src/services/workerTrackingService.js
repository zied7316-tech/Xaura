import api from './api';

export const workerTrackingService = {
  // Get tracking settings (Owner only)
  getSettings: async () => {
    const response = await api.get('/worker-tracking/settings');
    return response.data;
  },

  // Update tracking settings (Owner only)
  updateSettings: async (settings) => {
    const response = await api.put('/worker-tracking/settings', settings);
    return response.data;
  },

  // Get worker's salon tracking settings (for workers to check if tracking is enabled)
  getMySalonSettings: async () => {
    const response = await api.get('/worker-tracking/my-salon-settings');
    return response.data;
  },

  // Worker reports location/WiFi (for mobile app)
  reportLocation: async (data) => {
    const response = await api.post('/worker-tracking/report', data);
    return response.data;
  }
};

