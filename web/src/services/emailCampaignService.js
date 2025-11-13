import api from './api';

const emailCampaignService = {
  // Campaigns
  getAllCampaigns: async (params = {}) => {
    const response = await api.get('/super-admin/campaigns', { params });
    return response;
  },

  getCampaign: async (id) => {
    const response = await api.get(`/super-admin/campaigns/${id}`);
    return response;
  },

  createCampaign: async (campaignData) => {
    const response = await api.post('/super-admin/campaigns', campaignData);
    return response;
  },

  updateCampaign: async (id, campaignData) => {
    const response = await api.put(`/super-admin/campaigns/${id}`, campaignData);
    return response;
  },

  deleteCampaign: async (id) => {
    const response = await api.delete(`/super-admin/campaigns/${id}`);
    return response;
  },

  sendCampaign: async (id) => {
    const response = await api.post(`/super-admin/campaigns/${id}/send`);
    return response;
  },

  scheduleCampaign: async (id, scheduledFor) => {
    const response = await api.post(`/super-admin/campaigns/${id}/schedule`, {
      scheduledFor,
    });
    return response;
  },

  sendTestEmail: async (id, email) => {
    const response = await api.post(`/super-admin/campaigns/${id}/test`, { email });
    return response;
  },

  getCampaignStats: async (id) => {
    const response = await api.get(`/super-admin/campaigns/${id}/stats`);
    return response;
  },

  previewRecipients: async (segmentation) => {
    const response = await api.post('/super-admin/campaigns/preview-recipients', {
      segmentation,
    });
    return response;
  },

  // Templates
  getAllTemplates: async (params = {}) => {
    const response = await api.get('/super-admin/campaigns/templates/all', { params });
    return response;
  },

  getTemplate: async (id) => {
    const response = await api.get(`/super-admin/campaigns/templates/${id}`);
    return response;
  },

  createTemplate: async (templateData) => {
    const response = await api.post('/super-admin/campaigns/templates', templateData);
    return response;
  },
};

export default emailCampaignService;


