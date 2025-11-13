import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import activityLogService from '../../services/activityLogService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    targetType: '',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters.page, filters.limit, filters.action, filters.targetType, filters.status]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await activityLogService.getActivityLogs(filters);
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await activityLogService.getActivityStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await activityLogService.exportActivityLogs(filters);
      toast.success('Activity logs exported successfully!');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Clear logs older than 90 days? This cannot be undone.')) {
      return;
    }

    try {
      const result = await activityLogService.clearOldLogs(90);
      toast.success(result.message);
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear old logs');
    }
  };

  const getActionColor = (action) => {
    if (action.includes('delete') || action.includes('banned')) return 'text-red-600';
    if (action.includes('suspend')) return 'text-orange-600';
    if (action.includes('activated') || action.includes('unbanned')) return 'text-green-600';
    if (action.includes('created')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'user_banned', label: 'User Banned' },
    { value: 'user_unbanned', label: 'User Unbanned' },
    { value: 'user_deleted', label: 'User Deleted' },
    { value: 'salon_suspended', label: 'Salon Suspended' },
    { value: 'salon_activated', label: 'Salon Activated' },
    { value: 'subscription_updated', label: 'Subscription Updated' },
    { value: 'login', label: 'Login' },
  ];

  const targetTypes = [
    { value: '', label: 'All Types' },
    { value: 'User', label: 'User' },
    { value: 'Salon', label: 'Salon' },
    { value: 'Subscription', label: 'Subscription' },
    { value: 'System', label: 'System' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Activity Logs</h1>
        <p className="text-gray-600 mt-2">Track all Super Admin actions and system activities</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Activities</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Last 24 Hours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.recentActivity?.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.statusBreakdown?.length > 0
                ? Math.round(
                    ((stats.statusBreakdown.find((s) => s._id === 'success')?.count || 0) /
                      stats.total) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Most Active</p>
            <p className="text-sm font-semibold text-gray-800">
              {stats.topAdmins?.[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full p-2 border rounded-lg"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value, page: 1 })}
            >
              {targetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({
                  page: 1,
                  limit: 50,
                  action: '',
                  targetType: '',
                  status: '',
                  startDate: '',
                  endDate: '',
                  search: '',
                });
                setTimeout(fetchLogs, 100);
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {exporting ? '📄 Exporting...' : '📥 Export CSV'}
          </button>
          <button
            onClick={handleClearOldLogs}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            🗑️ Clear Old Logs (90+ days)
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <LoadingSkeleton count={10} />
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.admin?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{log.admin?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.targetName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{log.targetType || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total
                logs)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.pages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;


