import 'api_service.dart';

class SalonClientService {
  final _api = ApiService();

  Future<Map<String, dynamic>?> getSalonInfoByQR(String qrCode) async {
    try {
      final response = await _api.get('/salon-clients/qr/$qrCode');
      if (response['success'] == true) {
        return {'salon': response['data']['salon']};
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> joinSalonViaQR(String qrCode) async {
    try {
      final response = await _api.post('/salon-clients/join', {'qrCode': qrCode});
      if (response['success'] == true) {
        return {
          'success': true,
          'message': response['message'] ?? 'Successfully joined salon',
          'data': response['data'],
          'alreadyJoined': response['alreadyJoined'] ?? false,
        };
      }
      throw Exception(response['message'] ?? 'Failed to join salon');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<List<dynamic>> getMySalons() async {
    try {
      final response = await _api.get('/salon-clients/my-salons');
      if (response['success'] == true) {
        return response['data']['salons'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

