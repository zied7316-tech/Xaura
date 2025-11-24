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

      // Prepare settings with auto-enable logic
      let settingsToSave = { ...settings };

      // Validate and auto-enable WiFi settings if WiFi method is selected
      if (settingsToSave.method === 'wifi') {
        if (!settingsToSave.wifi.ssid || settingsToSave.wifi.ssid.trim() === '') {
          toast.error('Please enter a WiFi network name (SSID)');
          setSaving(false);
          return;
        }
        // Auto-enable WiFi if SSID is provided
        settingsToSave.wifi = {
          ...settingsToSave.wifi,
          ssid: settingsToSave.wifi.ssid.trim(),
          enabled: true
        };
      }

      // Validate and auto-enable GPS settings if GPS method is selected
      if (settingsToSave.method === 'gps') {
        if (!settingsToSave.gps.latitude || !settingsToSave.gps.longitude) {
          toast.error('Please set the salon location (latitude and longitude)');
          setSaving(false);
          return;
        }
        // Auto-enable GPS if coordinates are provided
        settingsToSave.gps = {
          ...settingsToSave.gps,
          enabled: true,
          radius: settingsToSave.gps.radius || 100
        };
      }

      // Prepare the payload to match backend expectations
      // Always send both wifi and gps objects, but disable the non-selected method
      const payload = {
        method: settingsToSave.method,
        wifi: {
          ssid: settingsToSave.method === 'wifi' ? settingsToSave.wifi.ssid : (settingsToSave.wifi.ssid || ''),
          enabled: settingsToSave.method === 'wifi' ? settingsToSave.wifi.enabled : false
        },
        gps: {
          latitude: settingsToSave.method === 'gps' ? settingsToSave.gps.latitude : (settingsToSave.gps.latitude || null),
          longitude: settingsToSave.method === 'gps' ? settingsToSave.gps.longitude : (settingsToSave.gps.longitude || null),
          radius: settingsToSave.gps.radius || 100,
          enabled: settingsToSave.method === 'gps' ? settingsToSave.gps.enabled : false
        }
      };

      console.log('[TRACKING] Saving settings:', JSON.stringify(payload, null, 2));
      
      try {
        const response = await workerTrackingService.updateSettings(payload);
        console.log('[TRACKING] Response received:', response);
        
        // The service returns response.data, which contains the data object
        // Check if response has the expected structure (method, wifi, gps) as success indicator
        if (response && (response.success || (response.method && response.wifi && response.gps))) {
          toast.success('Tracking settings saved successfully!');
          // Update local state with the saved settings
          setSettings(settingsToSave);
          // Reload settings to get the updated data from backend
          await loadSettings();
        } else {
          const errorMsg = response?.message || 'Failed to save settings';
          console.error('[TRACKING] Save failed - response:', response);
          toast.error(errorMsg);
        }
      } catch (apiError) {
        // Handle API errors separately
        console.error('[TRACKING] API Error:', apiError);
        console.error('[TRACKING] API Error response:', apiError.response);
        console.error('[TRACKING] API Error data:', apiError.response?.data);
        const errorMsg = apiError.response?.data?.message || apiError.message || 'Failed to save settings';
        toast.error(errorMsg);
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('[TRACKING] Error saving settings:', error);
      console.error('[TRACKING] Error details:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        stack: error.stack
      });
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save settings';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleMethodChange = (method) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        method,
        wifi: { ...prev.wifi, enabled: method === 'wifi' && prev.wifi.ssid ? true : (method === 'wifi' ? prev.wifi.enabled : false) },
        gps: { ...prev.gps, enabled: method === 'gps' && prev.gps.latitude && prev.gps.longitude ? true : (method === 'gps' ? prev.gps.enabled : false) }
      };
      return newSettings;
    });
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
            enabled: true,
            radius: prev.gps.radius || 100
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
                        onChange={(e) => {
                          const ssid = e.target.value;
                          setSettings(prev => ({
                            ...prev,
                            wifi: { 
                              ...prev.wifi, 
                              ssid: ssid,
                              enabled: ssid.trim() !== '' ? true : prev.wifi.enabled
                            }
                          }));
                        }}
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
                          onChange={(e) => {
                            const lat = parseFloat(e.target.value) || null;
                            setSettings(prev => ({
                              ...prev,
                              gps: { 
                                ...prev.gps, 
                                latitude: lat,
                                enabled: lat !== null && prev.gps.longitude !== null ? true : prev.gps.enabled
                              }
                            }));
                          }}
                          className="flex-1"
                        />
                        <Input
                          label="Longitude"
                          type="number"
                          step="any"
                          placeholder="-74.0060"
                          value={settings.gps.longitude || ''}
                          onChange={(e) => {
                            const lng = parseFloat(e.target.value) || null;
                            setSettings(prev => ({
                              ...prev,
                              gps: { 
                                ...prev.gps, 
                                longitude: lng,
                                enabled: prev.gps.latitude !== null && lng !== null ? true : prev.gps.enabled
                              }
                            }));
                          }}
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

