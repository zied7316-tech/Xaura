import api from './api';

const reportService = {
  /**
   * Generate Platform Overview Report
   */
  generatePlatformReport: async (format = 'pdf') => {
    const response = await api.post(
      '/super-admin/reports/platform',
      { format },
      { responseType: 'blob' }
    );

    // Download file
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `platform-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  },

  /**
   * Generate Financial Report
   */
  generateFinancialReport: async (format = 'pdf', startDate = null, endDate = null) => {
    const response = await api.post(
      '/super-admin/reports/financial',
      { format, startDate, endDate },
      { responseType: 'blob' }
    );

    // Download file
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `financial-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  },

  /**
   * Generate Salon Performance Report
   */
  generateSalonReport: async (format = 'pdf', salonId = null) => {
    const response = await api.post(
      '/super-admin/reports/salon',
      { format, salonId },
      { responseType: 'blob' }
    );

    // Download file
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `salon-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  },

  /**
   * Generate User Analytics Report
   */
  generateUserReport: async (format = 'pdf') => {
    const response = await api.post(
      '/super-admin/reports/users',
      { format },
      { responseType: 'blob' }
    );

    // Download file
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `user-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  },
};

export default reportService;


