import 'api_service.dart';

class SalonOwnershipService {
  final _api = ApiService();

  Future<Map<String, dynamic>> getMySalons() async {
    try {
      final response = await _api.get('/my-salons');
      if (response['success'] == true) {
        return {
          'success': true,
          'data': response['data']['salons'] ?? [],
        };
      }
      return {'success': false, 'data': []};
    } catch (e) {
      return {'success': false, 'data': [], 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>?> getMySalon(String id) async {
    try {
      final response = await _api.get('/my-salons/$id');
      if (response['success'] == true) {
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> setPrimarySalon(String id) async {
    try {
      final response = await _api.put('/my-salons/$id/set-primary');
      return response['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> addSalon(Map<String, dynamic> salonData) async {
    try {
      final response = await _api.post('/my-salons', salonData);
      if (response['success'] == true) {
        return {'success': true, 'salon': response['data']['salon']};
      }
      throw Exception(response['message'] ?? 'Failed to add salon');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}

