import 'api_service.dart';

class AvailabilityService {
  final _api = ApiService();

  // Worker endpoints
  Future<Map<String, dynamic>?> getMyAvailability() async {
    try {
      final response = await _api.get('/availability/my-schedule');
      if (response['success'] == true) {
        return response['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> updateMyAvailability(Map<String, dynamic> data) async {
    try {
      final response = await _api.put('/availability/my-schedule', data);
      if (response['success'] == true) {
        return {'success': true, 'data': response['data']['data']};
      }
      throw Exception(response['message'] ?? 'Failed to update availability');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Public/Client endpoints
  Future<List<dynamic>> getAvailableWorkers(String salonId, {Map<String, dynamic>? filters}) async {
    try {
      String endpoint = '/availability/salon/$salonId/workers';
      if (filters != null && filters.isNotEmpty) {
        final queryParams = filters.entries
            .where((e) => e.value != null)
            .map((e) => '${e.key}=${e.value}')
            .join('&');
        if (queryParams.isNotEmpty) {
          endpoint += '?$queryParams';
        }
      }
      
      final response = await _api.get(endpoint);
      if (response['success'] == true) {
        return response['data']['data'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getWorkerTimeSlots(String workerId, {Map<String, dynamic>? filters}) async {
    try {
      String endpoint = '/availability/worker/$workerId/slots';
      if (filters != null && filters.isNotEmpty) {
        final queryParams = filters.entries
            .where((e) => e.value != null)
            .map((e) => '${e.key}=${e.value}')
            .join('&');
        if (queryParams.isNotEmpty) {
          endpoint += '?$queryParams';
        }
      }
      
      final response = await _api.get(endpoint);
      if (response['success'] == true) {
        return response['data']['data'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

