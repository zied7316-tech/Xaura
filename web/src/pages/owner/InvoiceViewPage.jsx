import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { workerFinanceService } from '../../services/workerFinanceService'
import { salonAccountService } from '../../services/salonAccountService'
import Button from '../../components/ui/Button'
import { Printer, ArrowLeft, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const InvoiceViewPage = () => {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      const [invoiceData, salonData] = await Promise.all([
        workerFinanceService.getInvoice(invoiceId),
        salonAccountService.getSalonAccount()
      ])
      
      setInvoice(invoiceData)
      setSalon(salonData?.salon || null)
    } catch (error) {
      console.error('Error loading invoice:', error)
      toast.error('Failed to load invoice')
      navigate('/owner/worker-payments')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Invoice not found</p>
        <Button onClick={() => navigate('/owner/worker-payments')} className="mt-4">
          Back to Payments
        </Button>
      </div>
    )
  }

  const salonAddress = salon?.address
    ? `${salon.address.street || ''} ${salon.address.city || ''} ${salon.address.state || ''} ${salon.address.zipCode || ''}`.trim()
    : ''

  return (
    <div className="space-y-6">
      {/* Action Bar - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate('/owner/worker-payments')}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Payments
        </Button>
        <Button
          onClick={handlePrint}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Printer size={18} className="mr-2" />
          Print Invoice
        </Button>
      </div>

      {/* Invoice Document - Print Optimized */}
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto print:shadow-none print:p-0">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-sm text-gray-600">Invoice Number: <span className="font-semibold">{invoice.invoiceNumber}</span></p>
              <p className="text-sm text-gray-600">Date: <span className="font-semibold">{formatDate(invoice.paidDate || invoice.createdAt)}</span></p>
            </div>
            {salon && (
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{salon.name}</h2>
                {salonAddress && <p className="text-sm text-gray-600">{salonAddress}</p>}
                {salon.phone && <p className="text-sm text-gray-600">Phone: {salon.phone}</p>}
                {salon.email && <p className="text-sm text-gray-600">Email: {salon.email}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Worker Information */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">PAY TO:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900">{invoice.workerId?.name || 'Worker'}</p>
            {invoice.workerId?.email && <p className="text-sm text-gray-600">Email: {invoice.workerId.email}</p>}
            {invoice.workerId?.phone && <p className="text-sm text-gray-600">Phone: {invoice.workerId.phone}</p>}
          </div>
        </div>

        {/* Period Information */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Period Start</p>
            <p className="font-semibold text-gray-900">{formatDate(invoice.periodStart)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Period End</p>
            <p className="font-semibold text-gray-900">{formatDate(invoice.periodEnd)}</p>
          </div>
        </div>

        {/* Services Breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">SERVICES BREAKDOWN</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Service Price</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Commission</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Earning</th>
                </tr>
              </thead>
              <tbody>
                {invoice.breakdown && invoice.breakdown.length > 0 ? (
                  invoice.breakdown.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(item.date)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.serviceName || 'Service'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">{formatCurrency(item.servicePrice || 0)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">{item.commissionPercentage || 0}%</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.workerEarning || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">No services listed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="border-t-2 border-gray-300 pt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Services:</span>
                <span className="font-semibold text-gray-900">{invoice.appointmentsCount || 0}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
                <span>Total Amount:</span>
                <span className="text-primary-600">{formatCurrency(invoice.totalAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize">{invoice.paymentMethod?.replace('_', ' ') || 'Cash'}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Status</p>
              <p className="font-semibold text-green-600 capitalize">{invoice.status || 'Paid'}</p>
            </div>
            {invoice.paidDate && (
              <div>
                <p className="text-gray-600 mb-1">Paid Date</p>
                <p className="font-semibold text-gray-900">{formatDate(invoice.paidDate)}</p>
              </div>
            )}
            {invoice.generatedBy && (
              <div>
                <p className="text-gray-600 mb-1">Generated By</p>
                <p className="font-semibold text-gray-900">{invoice.generatedBy.name || 'Owner'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (() => {
          // Parse notes to extract advance deduction info
          const notesText = invoice.notes;
          const advanceMatch = notesText.match(/Advances deducted:\s*([\d.]+)\s*\(Gross earnings:\s*([\d.]+)\)/);
          const hasFullBalance = notesText.includes('Full balance payment');
          
          return (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Notes:</p>
              <div className="space-y-2">
                {hasFullBalance && (
                  <p className="text-sm font-medium text-gray-700">Full balance payment</p>
                )}
                {advanceMatch && (
                  <div className="text-sm text-red-600 font-semibold space-y-1">
                    <p className="text-red-600">
                      <span className="font-bold">Advances deducted:</span> {formatCurrency(parseFloat(advanceMatch[1]))}
                    </p>
                    <p className="text-red-600">
                      <span className="font-bold">Gross earnings:</span> {formatCurrency(parseFloat(advanceMatch[2]))}
                    </p>
                  </div>
                )}
                {!advanceMatch && !hasFullBalance && (
                  <p className="text-sm text-gray-600 whitespace-pre-line">{notesText}</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This is an official invoice document. Please keep for your records.</p>
          <p className="mt-1">Generated on {formatDate(invoice.createdAt)}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:p-0,
          .print\\:hidden {
            visibility: hidden !important;
            display: none !important;
          }
          .print\\:shadow-none *,
          .print\\:p-0 * {
            visibility: visible;
          }
          .bg-white {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}

export default InvoiceViewPage

