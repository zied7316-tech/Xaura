import api from './api'

export const reportsService = {
  // Get comprehensive business reports
  getBusinessReports: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/reports', { params })
    return response.data
  }
}




