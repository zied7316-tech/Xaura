import 'api_service.dart';

class ServiceService {
  final _api = ApiService();

  Future<Map<String, dynamic>> createService(Map<String, dynamic> serviceData) async {
    try {
      final response = await _api.post('/services', serviceData);
      if (response['success'] == true) {
        return {'success': true, 'service': response['data']['service']};
      }
      throw Exception(response['message'] ?? 'Failed to create service');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<List<dynamic>> getAllServices({Map<String, dynamic>? params}) async {
    try {
      String endpoint = '/services';
      if (params != null && params.isNotEmpty) {
        final queryParams = params.entries
            .where((e) => e.value != null)
            .map((e) => '${e.key}=${e.value}')
            .join('&');
        if (queryParams.isNotEmpty) {
          endpoint += '?$queryParams';
        }
      }
      
      final response = await _api.get(endpoint);
      if (response['success'] == true) {
        return response['data']['services'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getServiceById(String id) async {
    try {
      final response = await _api.get('/services/$id');
      if (response['success'] == true) {
        return response['data']['service'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> updateService(String id, Map<String, dynamic> serviceData) async {
    try {
      final response = await _api.put('/services/$id', serviceData);
      if (response['success'] == true) {
        return {'success': true, 'service': response['data']['service']};
      }
      throw Exception(response['message'] ?? 'Failed to update service');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> deleteService(String id) async {
    try {
      final response = await _api.delete('/services/$id');
      return response['success'] == true;
    } catch (e) {
      return false;
    }
  }
}

