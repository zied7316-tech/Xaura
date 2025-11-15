import { useState, useEffect } from 'react';
import { workerTrackingService } from '../../services/workerTrackingService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Wifi, MapPin, ToggleLeft, ToggleRight, Save, Info } from 'lucide-react';

const WorkerTrackingSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    method: 'manual',
    wifi: {
      ssid: '',
      enabled: false
    },
    gps: {
      latitude: null,
      longitude: null,
      radius: 100,
      enabled: false
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await workerTrackingService.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load tracking settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await workerTrackingService.updateSettings(settings);
      if (response.success) {
        toast.success('Tracking settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleMethodChange = (method) => {
    setSettings(prev => ({
      ...prev,
      method,
      wifi: { ...prev.wifi, enabled: method === 'wifi' ? prev.wifi.enabled : false },
      gps: { ...prev.gps, enabled: method === 'gps' ? prev.gps.enabled : false }
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your location...', { id: 'location' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          gps: {
            ...prev.gps,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            enabled: true
          }
        }));
        toast.success('Location captured!', { id: 'location' });
      },
      (error) => {
        toast.error('Failed to get location. Please enter manually.', { id: 'location' });
        console.error('Geolocation error:', error);
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Worker Availability Tracking</h1>
        <p className="text-gray-600 mt-1">
          Configure how workers' availability is automatically tracked
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Manual Mode */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.method === 'manual'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMethodChange('manual')}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  settings.method === 'manual' ? 'bg-primary-600' : 'bg-gray-200'
                }`}>
                  <ToggleLeft className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Manual</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Workers manually toggle their availability status. No automatic tracking.
                  </p>
                </div>
                {settings.method === 'manual' && (
                  <div className="text-primary-600 font-semibold">Active</div>
                )}
              </div>
            </div>

            {/* WiFi Mode */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.method === 'wifi'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMethodChange('wifi')}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  settings.method === 'wifi' ? 'bg-primary-600' : 'bg-gray-200'
                }`}>
                  <Wifi className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">WiFi Tracking</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Workers automatically become available when connected to salon WiFi.
                  </p>
                  {settings.method === 'wifi' && (
                    <div className="mt-3">
                      <Input
                        label="WiFi Network Name (SSID)"
                        placeholder="Salon-WiFi"
                        value={settings.wifi.ssid}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          wifi: { ...prev.wifi, ssid: e.target.value }
                        }))}
                        className="mt-2"
                      />
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettings(prev => ({
                              ...prev,
                              wifi: { ...prev.wifi, enabled: !prev.wifi.enabled }
                            }));
                          }}
                          className="flex items-center gap-2"
                        >
                          {settings.wifi.enabled ? (
                            <ToggleRight className="text-primary-600" size={24} />
                          ) : (
                            <ToggleLeft className="text-gray-400" size={24} />
                          )}
                          <span className="text-sm font-medium">
                            {settings.wifi.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {settings.method === 'wifi' && (
                  <div className="text-primary-600 font-semibold">Active</div>
                )}
              </div>
            </div>

            {/* GPS Mode */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.method === 'gps'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMethodChange('gps')}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  settings.method === 'gps' ? 'bg-primary-600' : 'bg-gray-200'
                }`}>
                  <MapPin className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">GPS Location Tracking</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Workers automatically become available when within salon location radius.
                  </p>
                  {settings.method === 'gps' && (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          label="Latitude"
                          type="number"
                          step="any"
                          placeholder="40.7128"
                          value={settings.gps.latitude || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            gps: { ...prev.gps, latitude: parseFloat(e.target.value) || null }
                          }))}
                          className="flex-1"
                        />
                        <Input
                          label="Longitude"
                          type="number"
                          step="any"
                          placeholder="-74.0060"
                          value={settings.gps.longitude || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            gps: { ...prev.gps, longitude: parseFloat(e.target.value) || null }
                          }))}
                          className="flex-1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          getCurrentLocation();
                        }}
                        className="w-full"
                      >
                        <MapPin size={16} className="mr-2" />
                        Use Current Location
                      </Button>
                      <Input
                        label="Radius (meters)"
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.gps.radius}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          gps: { ...prev.gps, radius: parseInt(e.target.value) || 100 }
                        }))}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettings(prev => ({
                              ...prev,
                              gps: { ...prev.gps, enabled: !prev.gps.enabled }
                            }));
                          }}
                          className="flex items-center gap-2"
                        >
                          {settings.gps.enabled ? (
                            <ToggleRight className="text-primary-600" size={24} />
                          ) : (
                            <ToggleLeft className="text-gray-400" size={24} />
                          )}
                          <span className="text-sm font-medium">
                            {settings.gps.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {settings.method === 'gps' && (
                  <div className="text-primary-600 font-semibold">Active</div>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <Info className="text-blue-600 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Manual:</strong> Workers toggle status manually in the app</li>
                  <li><strong>WiFi:</strong> Worker app detects connection to salon WiFi and automatically sets status to "Available"</li>
                  <li><strong>GPS:</strong> Worker app detects location within the radius and automatically sets status to "Available"</li>
                </ul>
                <p className="mt-2 text-xs">
                  Note: Workers must grant location/WiFi permissions in the mobile app for automatic tracking to work.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <Button onClick={handleSave} loading={saving} className="w-full">
              <Save size={18} className="mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerTrackingSettingsPage;

