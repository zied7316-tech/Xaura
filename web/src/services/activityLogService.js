import api from './api';

const activityLogService = {
  /**
   * Get all activity logs with filtering and pagination
   */
  getActivityLogs: async (params = {}) => {
    const response = await api.get('/super-admin/activity-logs', { params });
    return response;
  },

  /**
   * Get activity log statistics
   */
  getActivityStats: async (params = {}) => {
    const response = await api.get('/super-admin/activity-logs/stats', { params });
    return response;
  },

  /**
   * Get single activity log details
   */
  getActivityLog: async (id) => {
    const response = await api.get(`/super-admin/activity-logs/${id}`);
    return response;
  },

  /**
   * Export activity logs to CSV
   */
  exportActivityLogs: async (params = {}) => {
    const response = await api.get('/super-admin/activity-logs/export', {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  },

  /**
   * Delete activity log
   */
  deleteActivityLog: async (id) => {
    const response = await api.delete(`/super-admin/activity-logs/${id}`);
    return response;
  },

  /**
   * Clear old logs
   */
  clearOldLogs: async (days = 90) => {
    const response = await api.post('/super-admin/activity-logs/clear-old', { days });
    return response;
  },
};

export default activityLogService;


