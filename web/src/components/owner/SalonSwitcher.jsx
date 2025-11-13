import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import salonOwnershipService from '../../services/salonOwnershipService';
import { Store, ChevronDown, Plus, Check } from 'lucide-react';

const SalonSwitcher = () => {
  const [salons, setSalons] = useState([]);
  const [activeSalon, setActiveSalon] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySalons();
  }, []);

  const fetchMySalons = async () => {
    try {
      setLoading(true);
      const data = await salonOwnershipService.getMySalons();
      setSalons(data.data);
      
      // Set active salon (primary or first)
      const primary = data.data.find((s) => s.isPrimary);
      const active = primary || data.data[0];
      setActiveSalon(active);
      
      // Store in localStorage
      if (active) {
        localStorage.setItem('activeSalonId', active._id);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
      toast.error('Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSalon = async (salon) => {
    setActiveSalon(salon);
    localStorage.setItem('activeSalonId', salon._id);
    setIsOpen(false);
    
    // Reload page to refresh data for new salon
    window.location.reload();
  };

  const handleSetPrimary = async (salonId, e) => {
    e.stopPropagation();
    try {
      await salonOwnershipService.setPrimarySalon(salonId);
      toast.success('Primary salon updated!');
      fetchMySalons();
    } catch (error) {
      console.error('Error setting primary salon:', error);
      toast.error('Failed to set primary salon');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <Store className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (salons.length === 0) {
    return null;
  }

  if (salons.length === 1) {
    // Only one salon, no need for switcher
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
        <Store className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">{salons[0].name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Salon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors min-w-[200px]"
      >
        <Store className="w-5 h-5 text-blue-600" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-blue-900">
            {activeSalon?.name || 'Select Salon'}
          </p>
          <p className="text-xs text-blue-600">{salons.length} salons</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                Your Salons
              </p>
              
              {salons.map((salon) => (
                <div
                  key={salon._id}
                  onClick={() => handleSwitchSalon(salon)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    activeSalon?._id === salon._id
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activeSalon?._id === salon._id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <Store className={`w-5 h-5 ${
                        activeSalon?._id === salon._id ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{salon.name}</p>
                        {salon.isPrimary && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{salon.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{salon.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!salon.isPrimary && (
                      <button
                        onClick={(e) => handleSetPrimary(salon._id, e)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Set as primary"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {activeSalon?._id === salon._id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t mt-2 pt-2">
                <a
                  href="/owner/salons"
                  className="flex items-center gap-2 p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add New Salon</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalonSwitcher;


