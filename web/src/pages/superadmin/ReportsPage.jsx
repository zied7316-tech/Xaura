import { useState } from 'react';
import { toast } from 'react-hot-toast';
import reportService from '../../services/reportService';
import { FileText, Download, Calendar, TrendingUp, Users, Store, DollarSign } from 'lucide-react';

const ReportsPage = () => {
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Report options
  const [reportOptions, setReportOptions] = useState({
    format: 'pdf',
    startDate: '',
    endDate: '',
    salonId: '',
  });

  const reportTypes = [
    {
      id: 'platform',
      name: 'Platform Overview',
      description: 'Complete platform statistics, growth trends, and key metrics',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      fields: ['format'],
    },
    {
      id: 'financial',
      name: 'Financial Report',
      description: 'Revenue analysis, MRR, transaction history, and top performers',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      fields: ['format', 'dateRange'],
    },
    {
      id: 'salon',
      name: 'Salon Performance',
      description: 'Individual salon metrics, appointments, revenue, and workers',
      icon: Store,
      color: 'from-purple-500 to-purple-600',
      fields: ['format', 'salonId'],
    },
    {
      id: 'users',
      name: 'User Analytics',
      description: 'User distribution, growth trends, and signup statistics',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      fields: ['format'],
    },
  ];

  const handleGenerateReport = async (reportType) => {
    try {
      setGenerating(true);
      
      let result;
      switch (reportType) {
        case 'platform':
          result = await reportService.generatePlatformReport(reportOptions.format);
          break;
        case 'financial':
          result = await reportService.generateFinancialReport(
            reportOptions.format,
            reportOptions.startDate || null,
            reportOptions.endDate || null
          );
          break;
        case 'salon':
          result = await reportService.generateSalonReport(
            reportOptions.format,
            reportOptions.salonId || null
          );
          break;
        case 'users':
          result = await reportService.generateUserReport(reportOptions.format);
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (result.success) {
        toast.success('Report generated and downloaded successfully!');
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const renderReportOptions = (reportType) => {
    const report = reportTypes.find((r) => r.id === reportType);
    if (!report) return null;

    return (
      <div className="mt-6 space-y-4">
        {/* Format Selection */}
        {report.fields.includes('format') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setReportOptions({ ...reportOptions, format: 'pdf' })}
                className={`flex-1 p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  reportOptions.format === 'pdf'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">PDF</span>
              </button>
              <button
                onClick={() => setReportOptions({ ...reportOptions, format: 'excel' })}
                className={`flex-1 p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  reportOptions.format === 'excel'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Excel</span>
              </button>
            </div>
          </div>
        )}

        {/* Date Range */}
        {report.fields.includes('dateRange') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-lg"
                value={reportOptions.startDate}
                onChange={(e) =>
                  setReportOptions({ ...reportOptions, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-lg"
                value={reportOptions.endDate}
                onChange={(e) =>
                  setReportOptions({ ...reportOptions, endDate: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Salon ID */}
        {report.fields.includes('salonId') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salon ID (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty for all salons"
              className="w-full p-2 border rounded-lg"
              value={reportOptions.salonId}
              onChange={(e) =>
                setReportOptions({ ...reportOptions, salonId: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a salon ID to generate report for a specific salon only
            </p>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => handleGenerateReport(reportType)}
            disabled={generating}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <Download className={`w-5 h-5 ${generating ? 'animate-bounce' : ''}`} />
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={() => setSelectedReport(null)}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Advanced Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate professional PDF and Excel reports with comprehensive analytics
        </p>
      </div>

      {!selectedReport ? (
        /* Report Selection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedReport(report.id)}
              >
                <div className={`h-3 bg-gradient-to-r ${report.color}`} />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 bg-gradient-to-r ${report.color} rounded-lg text-white`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {report.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{report.description}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        PDF
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Excel
                      </span>
                    </div>
                    <button className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                      Generate →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Report Builder */
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            {(() => {
              const report = reportTypes.find((r) => r.id === selectedReport);
              const Icon = report?.icon;
              return (
                <>
                  <div
                    className={`p-4 bg-gradient-to-r ${report?.color} rounded-lg text-white`}
                  >
                    {Icon && <Icon className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{report?.name}</h2>
                    <p className="text-gray-600">{report?.description}</p>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="border-t pt-6">{renderReportOptions(selectedReport)}</div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">PDF Reports</h4>
          </div>
          <p className="text-sm text-blue-800">
            Professional formatted reports perfect for presentations and printing
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Excel Export</h4>
          </div>
          <p className="text-sm text-green-800">
            Editable spreadsheets for further analysis and custom calculations
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Date Ranges</h4>
          </div>
          <p className="text-sm text-purple-800">
            Filter reports by custom date ranges for precise analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;


