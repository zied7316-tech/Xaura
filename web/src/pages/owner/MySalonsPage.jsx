import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import salonOwnershipService from '../../services/salonOwnershipService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Store, Plus, Star, Users, Calendar, MapPin, Mail, Phone } from 'lucide-react';

const MySalonsPage = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newSalon, setNewSalon] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const data = await salonOwnershipService.getMySalons();
      setSalons(data.data);
    } catch (error) {
      console.error('Error fetching salons:', error);
      toast.error('Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalon = async () => {
    if (!newSalon.name || !newSalon.email || !newSalon.phone || !newSalon.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdding(true);
      await salonOwnershipService.addSalon(newSalon);
      toast.success('Salon added successfully!');
      setShowAddModal(false);
      setNewSalon({ name: '', email: '', phone: '', address: '', description: '' });
      fetchSalons();
    } catch (error) {
      console.error('Error adding salon:', error);
      toast.error('Failed to add salon');
    } finally {
      setAdding(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await salonOwnershipService.setPrimarySalon(id);
      toast.success('Primary salon updated!');
      fetchSalons();
    } catch (error) {
      console.error('Error setting primary salon:', error);
      toast.error('Failed to set primary salon');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Salons</h1>
          <p className="text-gray-600 mt-2">Manage all your salon locations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Salon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Salons</p>
          <p className="text-2xl font-bold text-gray-800">{salons.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Primary Salon</p>
          <p className="text-lg font-semibold text-blue-600">
            {salons.find((s) => s.isPrimary)?.name || 'Not set'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Your Role</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">
            {salons[0]?.role || 'Owner'}
          </p>
        </div>
      </div>

      {/* Salons Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : salons.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Salons Yet</h3>
          <p className="text-gray-600 mb-4">Add your first salon to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Add Your First Salon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salons.map((salon) => (
            <div
              key={salon._id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                salon.isPrimary ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Header */}
              <div
                className={`h-24 bg-gradient-to-r ${
                  salon.isPrimary
                    ? 'from-blue-500 to-blue-600'
                    : 'from-gray-500 to-gray-600'
                }`}
              >
                <div className="p-4 flex items-start justify-between">
                  {salon.isPrimary && (
                    <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Primary
                    </span>
                  )}
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
                    {salon.role}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{salon.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {salon.servicesCount && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {salon.servicesCount}
                        </span>
                      )}
                      {salon.appointmentsCount && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {salon.appointmentsCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      salon.isPrimary ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <Store
                      className={`w-6 h-6 ${
                        salon.isPrimary ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {salon.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{salon.address}</span>
                    </div>
                  )}
                  {salon.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>{salon.email}</span>
                    </div>
                  )}
                  {salon.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{salon.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <a
                    href={`/owner/salon?id=${salon._id}`}
                    className="flex-1 px-4 py-2 text-center border rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Manage
                  </a>
                  {!salon.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(salon._id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Salon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Add New Salon</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salon Name *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={newSalon.name}
                  onChange={(e) => setNewSalon({ ...newSalon, name: e.target.value })}
                  placeholder="Glamour Hair Studio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded-lg"
                    value={newSalon.email}
                    onChange={(e) => setNewSalon({ ...newSalon, email: e.target.value })}
                    placeholder="contact@salon.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    className="w-full p-2 border rounded-lg"
                    value={newSalon.phone}
                    onChange={(e) => setNewSalon({ ...newSalon, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={newSalon.address}
                  onChange={(e) => setNewSalon({ ...newSalon, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows="3"
                  value={newSalon.description}
                  onChange={(e) => setNewSalon({ ...newSalon, description: e.target.value })}
                  placeholder="Tell us about your salon..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddSalon}
                disabled={adding}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Salon'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySalonsPage;


