import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import billingService from '../../services/billingService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const BillingPage = () => {
  const [billing, setBilling] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    status: '',
    startDate: '',
    endDate: '',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchBilling();
    fetchRevenueStats();
  }, [filters.page, filters.status]);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const data = await billingService.getAllBillingHistory(filters);
      setBilling(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching billing:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const data = await billingService.getRevenueStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setRevenueStats(data.data);
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
    }
  };

  const handleManualCharge = async (subscriptionId) => {
    if (!confirm('Are you sure you want to manually charge this subscription?')) {
      return;
    }

    try {
      setProcessing(true);
      const result = await billingService.manualCharge(subscriptionId);
      if (result.success) {
        toast.success('Subscription charged successfully!');
        fetchBilling();
        fetchRevenueStats();
      } else {
        toast.error('Failed to charge subscription');
      }
    } catch (error) {
      console.error('Error charging subscription:', error);
      toast.error('Failed to charge subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryPayment = async (billingId) => {
    try {
      setProcessing(true);
      const result = await billingService.retryPayment(billingId);
      if (result.success) {
        toast.success('Payment retried successfully!');
        fetchBilling();
        fetchRevenueStats();
      } else {
        toast.error('Payment retry failed');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessMonthly = async () => {
    if (!confirm('Process monthly billing for all due subscriptions? This will charge all salons.')) {
      return;
    }

    try {
      setProcessing(true);
      const result = await billingService.processMonthlyBilling();
      toast.success(`Billing processed: ${result.data.succeeded} succeeded, ${result.data.failed} failed`);
      fetchBilling();
      fetchRevenueStats();
    } catch (error) {
      console.error('Error processing monthly billing:', error);
      toast.error('Failed to process monthly billing');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `${amount?.toFixed(3) || '0.000'} د.ت`; // Tunisian Dinar with Arabic symbol
  };

  const handleMarkAsPaid = async (billingId) => {
    const transactionId = prompt('Enter transaction ID (optional):');
    const paymentMethod = prompt('Payment method (cash/bank_transfer/ccp/d17/flouci):') || 'cash';

    try {
      setProcessing(true);
      await billingService.markPaymentAsPaid(billingId, transactionId, paymentMethod, '');
      toast.success('Payment marked as paid!');
      fetchBilling();
      fetchRevenueStats();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('Failed to mark payment as paid');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Billing & Revenue</h1>
          <p className="text-gray-600 mt-2">Manage platform billing and subscriptions</p>
        </div>
        <button
          onClick={handleProcessMonthly}
          disabled={processing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
          Process Monthly Billing
        </button>
      </div>

      {/* Revenue Stats Cards */}
      {revenueStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total Revenue</p>
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(revenueStats.totalRevenue)}</p>
            <p className="text-xs opacity-90 mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Monthly Recurring</p>
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(revenueStats.mrr)}</p>
            <p className="text-xs opacity-90 mt-1">MRR</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Transactions</p>
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{revenueStats.totalTransactions}</p>
            <p className="text-xs opacity-90 mt-1">Total completed</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Failed Payments</p>
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{revenueStats.failedPayments}</p>
            <p className="text-xs opacity-90 mt-1">Needs attention</p>
          </div>
        </div>
      )}

      {/* Revenue by Plan */}
      {revenueStats?.revenueByPlan && revenueStats.revenueByPlan.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {revenueStats.revenueByPlan.map((plan) => (
              <div key={plan._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-800">{plan._id || 'Unknown'} Plan</p>
                  <p className="text-sm text-gray-600">{plan.count} transactions</p>
                </div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(plan.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>

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

          <div className="flex items-end">
            <button
              onClick={() => {
                fetchBilling();
                fetchRevenueStats();
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Billing Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <LoadingSkeleton count={10} />
        ) : billing.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No billing records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Salon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billing.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.salon?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{record.salon?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.subscription?.plan || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                        {record.status === 'failed' && record.retryAttempts > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Retry {record.retryAttempts}/3)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {record.transactionId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(record._id)}
                            disabled={processing}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 font-medium"
                          >
                            ✓ Mark Paid
                          </button>
                        )}
                        {record.status === 'failed' && record.retryAttempts < 3 && (
                          <button
                            onClick={() => handleRetryPayment(record._id)}
                            disabled={processing}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total records)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.pages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
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

export default BillingPage;

