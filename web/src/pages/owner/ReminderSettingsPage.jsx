import { useState, useEffect } from 'react'
import { reminderService } from '../../services/reminderService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { 
  Bell, Mail, MessageSquare, Send, CheckCircle, Settings,
  AlertCircle, Clock, Phone
} from 'lucide-react'
import toast from 'react-hot-toast'

const ReminderSettingsPage = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await reminderService.getReminderSettings()
      setSettings(data.data)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load reminder settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await reminderService.updateReminderSettings(settings)
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (method) => {
    if (method === 'sms' && !testPhone) {
      toast.error('Please enter a phone number to test')
      return
    }
    if (method === 'email' && !testEmail) {
      toast.error('Please enter an email to test')
      return
    }

    setTesting(true)
    try {
      const result = await reminderService.testReminderConfig(method, testPhone, testEmail)
      if (result.data[method]?.mock) {
        toast.success(`Test mode: ${method === 'sms' ? 'SMS' : 'Email'} would be sent!`)
      } else if (result.data[method]?.success) {
        toast.success(`Test ${method === 'sms' ? 'SMS' : 'email'} sent successfully!`)
      } else {
        toast.error(result.data[method]?.error || 'Test failed')
      }
    } catch (error) {
      toast.error('Failed to send test')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reminder Settings</h1>
          <p className="text-gray-600 mt-1">Configure SMS and email appointment reminders</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <CheckCircle size={18} />
          Save Settings
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Reduce No-Shows by 70%!</p>
              <p>Automatic reminders help clients remember their appointments. Configure SMS (Twilio) and/or Email below.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="text-green-600" size={24} />
              SMS Reminders (Twilio)
            </CardTitle>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium">Enabled</span>
              <input
                type="checkbox"
                checked={settings.sms?.enabled || false}
                onChange={(e) => setSettings({
                  ...settings,
                  sms: { ...settings.sms, enabled: e.target.checked }
                })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Twilio Account SID"
              value={settings.sms?.accountSid || ''}
              onChange={(e) => setSettings({
                ...settings,
                sms: { ...settings.sms, accountSid: e.target.value }
              })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={!settings.sms?.enabled}
            />
            <Input
              label="Twilio Auth Token"
              type="password"
              value={settings.sms?.authToken || ''}
              onChange={(e) => setSettings({
                ...settings,
                sms: { ...settings.sms, authToken: e.target.value }
              })}
              placeholder="Enter your auth token"
              disabled={!settings.sms?.enabled}
            />
          </div>

          <Input
            label="Twilio Phone Number"
            value={settings.sms?.phoneNumber || ''}
            onChange={(e) => setSettings({
              ...settings,
              sms: { ...settings.sms, phoneNumber: e.target.value }
            })}
            placeholder="+1234567890"
            disabled={!settings.sms?.enabled}
          />

          <Input
            label="Send Reminder (Hours Before)"
            type="number"
            min="1"
            max="72"
            value={settings.sms?.reminderHours || 24}
            onChange={(e) => setSettings({
              ...settings,
              sms: { ...settings.sms, reminderHours: parseInt(e.target.value) }
            })}
            disabled={!settings.sms?.enabled}
          />

          <Textarea
            label="SMS Template"
            rows={3}
            value={settings.sms?.template || ''}
            onChange={(e) => setSettings({
              ...settings,
              sms: { ...settings.sms, template: e.target.value }
            })}
            placeholder="Hi {clientName}! Reminder..."
            disabled={!settings.sms?.enabled}
            helperText="Available variables: {clientName}, {service}, {time}, {date}, {worker}, {salon}"
          />

          {/* Test SMS */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Test SMS Configuration</p>
            <div className="flex gap-2">
              <Input
                placeholder="+1234567890"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                disabled={!settings.sms?.enabled || !settings.sms?.accountSid}
              />
              <Button
                onClick={() => handleTest('sms')}
                disabled={!settings.sms?.enabled || !settings.sms?.accountSid || testing}
                loading={testing}
              >
                <Send size={16} />
                Test SMS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="text-blue-600" size={24} />
              Email Reminders
            </CardTitle>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium">Enabled</span>
              <input
                type="checkbox"
                checked={settings.email?.enabled || false}
                onChange={(e) => setSettings({
                  ...settings,
                  email: { ...settings.email, enabled: e.target.checked }
                })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SMTP Host"
              value={settings.email?.smtpHost || ''}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, smtpHost: e.target.value }
              })}
              placeholder="smtp.gmail.com"
              disabled={!settings.email?.enabled}
              helperText="Gmail: smtp.gmail.com"
            />
            <Input
              label="SMTP Port"
              type="number"
              value={settings.email?.smtpPort || 587}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, smtpPort: parseInt(e.target.value) }
              })}
              placeholder="587"
              disabled={!settings.email?.enabled}
              helperText="587 (TLS) or 465 (SSL)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SMTP Username/Email"
              value={settings.email?.smtpUser || ''}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, smtpUser: e.target.value }
              })}
              placeholder="your-email@gmail.com"
              disabled={!settings.email?.enabled}
            />
            <Input
              label="SMTP Password"
              type="password"
              value={settings.email?.smtpPassword || ''}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, smtpPassword: e.target.value }
              })}
              placeholder="Enter password or app password"
              disabled={!settings.email?.enabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="From Email"
              type="email"
              value={settings.email?.fromEmail || ''}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, fromEmail: e.target.value }
              })}
              placeholder="noreply@yoursalon.com"
              disabled={!settings.email?.enabled}
            />
            <Input
              label="From Name"
              value={settings.email?.fromName || ''}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, fromName: e.target.value }
              })}
              placeholder="Your Salon Name"
              disabled={!settings.email?.enabled}
            />
          </div>

          <Input
            label="Send Reminder (Hours Before)"
            type="number"
            min="1"
            max="72"
            value={settings.email?.reminderHours || 24}
            onChange={(e) => setSettings({
              ...settings,
              email: { ...settings.email, reminderHours: parseInt(e.target.value) }
            })}
            disabled={!settings.email?.enabled}
          />

          <Input
            label="Email Subject"
            value={settings.email?.template?.subject || ''}
            onChange={(e) => setSettings({
              ...settings,
              email: { 
                ...settings.email, 
                template: { ...settings.email.template, subject: e.target.value }
              }
            })}
            placeholder="Appointment Reminder - {salon}"
            disabled={!settings.email?.enabled}
          />

          <Textarea
            label="Email Body"
            rows={6}
            value={settings.email?.template?.body || ''}
            onChange={(e) => setSettings({
              ...settings,
              email: { 
                ...settings.email, 
                template: { ...settings.email.template, body: e.target.value }
              }
            })}
            disabled={!settings.email?.enabled}
            helperText="Available variables: {clientName}, {service}, {time}, {date}, {worker}, {salon}"
          />

          {/* Test Email */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Test Email Configuration</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={!settings.email?.enabled || !settings.email?.smtpHost}
              />
              <Button
                onClick={() => handleTest('email')}
                disabled={!settings.email?.enabled || !settings.email?.smtpHost || testing}
                loading={testing}
              >
                <Send size={16} />
                Test Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={24} />
            Additional Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Send Confirmation Messages</p>
              <p className="text-sm text-gray-600">Notify clients when appointment is confirmed</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sendConfirmation || false}
              onChange={(e) => setSettings({ ...settings, sendConfirmation: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Send Thank You Messages</p>
              <p className="text-sm text-gray-600">Thank clients after service is completed</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sendThankYou || false}
              onChange={(e) => setSettings({ ...settings, sendThankYou: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SMS Setup */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare size={18} className="text-green-600" />
              SMS Setup (Twilio)
            </h3>
            <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
              <li>Create free account at <a href="https://www.twilio.com" target="_blank" rel="noopener" className="text-primary-600 hover:underline">twilio.com</a></li>
              <li>Get a phone number from Twilio console</li>
              <li>Copy Account SID and Auth Token</li>
              <li>Paste credentials above</li>
              <li>Test with your phone number</li>
            </ol>
          </div>

          <hr />

          {/* Email Setup */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Mail size={18} className="text-blue-600" />
              Email Setup (Gmail)
            </h3>
            <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
              <li>Use Gmail account for your salon</li>
              <li>Enable 2-Factor Authentication</li>
              <li>Create App Password: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-primary-600 hover:underline">Generate here</a></li>
              <li>Use: <code className="bg-gray-200 px-1 rounded">smtp.gmail.com</code> as host, port <code className="bg-gray-200 px-1 rounded">587</code></li>
              <li>Enter your Gmail and App Password</li>
              <li>Test with your email</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-green-900 mb-2">💡 Tips for Success</h3>
          <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
            <li><strong>SMS:</strong> Best for immediate reminders (24h before)</li>
            <li><strong>Email:</strong> Great for detailed information</li>
            <li><strong>Both:</strong> Use both for maximum effectiveness</li>
            <li><strong>Test:</strong> Always test before enabling</li>
            <li><strong>Timing:</strong> 24 hours is optimal (not too early, not too late)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReminderSettingsPage




