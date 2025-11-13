import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import emailCampaignService from '../../services/emailCampaignService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Mail, Send, Clock, CheckCircle, XCircle, Users, Plus, Eye } from 'lucide-react';

const EmailCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    segmentation: {
      plan: [],
      status: [],
    },
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, [filters.page, filters.status]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await emailCampaignService.getAllCampaigns(filters);
      setCampaigns(data.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await emailCampaignService.createCampaign(newCampaign);
      toast.success('Campaign created successfully!');
      setShowCreateModal(false);
      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        segmentation: { plan: [], status: [] },
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendCampaign = async (id, name) => {
    if (!confirm(`Send campaign "${name}" to all recipients? This cannot be undone.`)) {
      return;
    }

    try {
      setProcessing(true);
      const result = await emailCampaignService.sendCampaign(id);
      toast.success(`Campaign sent! ${result.data.sent} succeeded, ${result.data.failed} failed`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendTest = async (id) => {
    const email = prompt('Enter email address for test:');
    if (!email) return;

    try {
      await emailCampaignService.sendTestEmail(id, email);
      toast.success('Test email sent!');
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Failed to send test email');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    const icons = {
      draft: Mail,
      scheduled: Clock,
      sending: Send,
      sent: CheckCircle,
      failed: XCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status]} flex items-center gap-1 w-fit`}>
        {Icon && <Icon className="w-3 h-3" />}
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Email Campaigns</h1>
          <p className="text-gray-600 mt-2">Send targeted emails to salon owners</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Campaigns</p>
          <p className="text-2xl font-bold text-gray-800">{campaigns.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">
            {campaigns.filter((c) => c.status === 'draft').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Sent</p>
          <p className="text-2xl font-bold text-green-600">
            {campaigns.filter((c) => c.status === 'sent').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">
            {campaigns.filter((c) => c.status === 'scheduled').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <select
            className="p-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="sending">Sending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <LoadingSkeleton count={5} />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No campaigns yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first campaign
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Subject:</strong> {campaign.subject}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.totalRecipients} recipients
                      </span>
                      {campaign.stats && campaign.status === 'sent' && (
                        <>
                          <span>✉️ {campaign.stats.sent} sent</span>
                          <span>👁️ {campaign.stats.opened} opened ({campaign.openRate}%)</span>
                          <span>🖱️ {campaign.stats.clicked} clicked ({campaign.clickRate}%)</span>
                        </>
                      )}
                      <span>
                        Created: {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSendTest(campaign._id)}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                        >
                          📧 Test
                        </button>
                        <button
                          onClick={() => handleSendCampaign(campaign._id, campaign.name)}
                          disabled={processing}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4 inline mr-1" />
                          Send Now
                        </button>
                      </>
                    )}
                    {campaign.status === 'sent' && (
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View Stats
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Campaign</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Monthly Newsletter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  placeholder="New Features Available!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Content * (HTML supported)
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows="8"
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                  placeholder="<h2>Hello {{salonName}}!</h2><p>We're excited to announce...</p>"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{salonName}}`} and {`{{ownerName}}`} for personalization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Plans (optional)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['Free', 'Basic', 'Professional', 'Enterprise'].map((plan) => (
                    <label key={plan} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newCampaign.segmentation.plan.includes(plan)}
                        onChange={(e) => {
                          const plans = e.target.checked
                            ? [...newCampaign.segmentation.plan, plan]
                            : newCampaign.segmentation.plan.filter((p) => p !== plan);
                          setNewCampaign({
                            ...newCampaign,
                            segmentation: { ...newCampaign.segmentation, plan: plans },
                          });
                        }}
                      />
                      {plan}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to send to all plans
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCampaign}
                disabled={processing}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Creating...' : 'Create Campaign'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedCampaign.name} - Statistics</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Recipients</p>
                <p className="text-3xl font-bold text-blue-800">
                  {selectedCampaign.totalRecipients}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Delivered</p>
                <p className="text-3xl font-bold text-green-800">
                  {selectedCampaign.stats?.delivered || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Open Rate</p>
                <p className="text-3xl font-bold text-purple-800">
                  {selectedCampaign.openRate || 0}%
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600">Click Rate</p>
                <p className="text-3xl font-bold text-orange-800">
                  {selectedCampaign.clickRate || 0}%
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCampaign(null)}
              className="w-full py-2 border rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaignsPage;


