class AppConstants {
  // API Configuration
  static const String apiUrl = 'http://10.0.2.2:5000/api'; // Android emulator
  // static const String apiUrl = 'http://localhost:5000/api'; // iOS simulator
  // static const String apiUrl = 'https://your-api.com/api'; // Production
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  
  // User Roles
  static const String roleOwner = 'Owner';
  static const String roleWorker = 'Worker';
  static const String roleClient = 'Client';
  
  // Appointment Status
  static const String statusPending = 'pending';
  static const String statusConfirmed = 'confirmed';
  static const String statusCompleted = 'completed';
  static const String statusCancelled = 'cancelled';
  
  // Service Categories
  static const List<String> serviceCategories = [
    'Haircut',
    'Coloring',
    'Styling',
    'Manicure',
    'Pedicure',
    'Facial',
    'Massage',
    'Waxing',
    'Other',
  ];
  
  // Days of Week
  static const List<String> daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration cacheTimeout = Duration(minutes: 5);
}

