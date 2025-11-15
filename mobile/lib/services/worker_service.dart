import 'api_service.dart';

class WorkerService {
  final _api = ApiService();

  Future<List<dynamic>> getWorkers() async {
    try {
      final response = await _api.get('/workers');
      if (response['success'] == true) {
        return response['data']['workers'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getWorkerDetails(String id) async {
    try {
      final response = await _api.get('/workers/$id');
      if (response['success'] == true) {
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> updateWorker(String id, Map<String, dynamic> workerData) async {
    try {
      final response = await _api.put('/workers/$id', workerData);
      if (response['success'] == true) {
        return {'success': true, 'worker': response['data']['worker']};
      }
      throw Exception(response['message'] ?? 'Failed to update worker');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> removeWorker(String id) async {
    try {
      final response = await _api.delete('/workers/$id');
      return response['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> getWorkerPerformance(String id, {Map<String, dynamic>? params}) async {
    try {
      String endpoint = '/workers/$id/performance';
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
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<dynamic>> compareWorkers() async {
    try {
      final response = await _api.get('/workers/performance/compare');
      if (response['success'] == true) {
        return response['data']['comparison'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

