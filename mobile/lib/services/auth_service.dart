import '../models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final _api = ApiService();
  final _storage = StorageService();

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final response = await _api.post('/auth/register', userData);
      
      if (response['success'] == true) {
        final user = UserModel.fromJson(response['data']['user']);
        final token = response['data']['token'];
        
        await _storage.saveToken(token);
        await _storage.saveUser(user);
        
        return {'success': true, 'user': user};
      }
      
      throw Exception(response['message'] ?? 'Registration failed');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _api.post('/auth/login', {
        'email': email,
        'password': password,
      });
      
      if (response['success'] == true) {
        final user = UserModel.fromJson(response['data']['user']);
        final token = response['data']['token'];
        
        await _storage.saveToken(token);
        await _storage.saveUser(user);
        
        return {'success': true, 'user': user};
      }
      
      throw Exception(response['message'] ?? 'Login failed');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<UserModel?> getCurrentUser() async {
    try {
      final token = await _storage.getToken();
      if (token == null) return null;

      final response = await _api.get('/auth/me');
      
      if (response['success'] == true) {
        final user = UserModel.fromJson(response['data']['user']);
        await _storage.saveUser(user);
        return user;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  UserModel? getCachedUser() {
    return _storage.getUser();
  }

  // Verify email
  Future<Map<String, dynamic>> verifyEmail(String token) async {
    try {
      final response = await _api.get('/auth/verify-email?token=$token');
      return {
        'success': response['success'] == true,
        'message': response['message'] ?? 'Email verified successfully',
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Resend verification email
  Future<Map<String, dynamic>> resendVerification(String email) async {
    try {
      final response = await _api.post('/auth/resend-verification', {'email': email});
      return {
        'success': response['success'] == true,
        'message': response['message'] ?? 'Verification email sent',
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Forgot password
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _api.post('/auth/forgot-password', {'email': email});
      return {
        'success': response['success'] == true,
        'message': response['message'] ?? 'Password reset email sent',
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Reset password
  Future<Map<String, dynamic>> resetPassword(String token, String password) async {
    try {
      final response = await _api.post('/auth/reset-password', {
        'token': token,
        'password': password,
      });
      return {
        'success': response['success'] == true,
        'message': response['message'] ?? 'Password reset successfully',
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}

