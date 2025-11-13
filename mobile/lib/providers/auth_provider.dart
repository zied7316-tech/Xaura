import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthProvider with ChangeNotifier {
  final _authService = AuthService();
  final _storage = StorageService();
  
  UserModel? _user;
  bool _isLoading = false;
  bool _isInitialized = false;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get isInitialized => _isInitialized;
  
  bool get isOwner => _user?.role == 'Owner';
  bool get isWorker => _user?.role == 'Worker';
  bool get isClient => _user?.role == 'Client';

  Future<void> init() async {
    await _storage.init();
    await checkAuthStatus();
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    _user = await _authService.getCurrentUser();
    notifyListeners();
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    notifyListeners();

    final result = await _authService.register(userData);

    if (result['success'] == true) {
      _user = result['user'];
    }

    _isLoading = false;
    notifyListeners();

    return result;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final result = await _authService.login(email, password);

    if (result['success'] == true) {
      _user = result['user'];
    }

    _isLoading = false;
    notifyListeners();

    return result;
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }

  String getDashboardRoute() {
    if (_user == null) return '/login';
    
    switch (_user!.role) {
      case 'Owner':
        return '/owner';
      case 'Worker':
        return '/worker';
      case 'Client':
        return '/client';
      default:
        return '/login';
    }
  }
}

