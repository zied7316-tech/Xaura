import 'api_service.dart';

class SalonSearchService {
  final _api = ApiService();

  Future<List<dynamic>> searchSalons({Map<String, dynamic>? filters}) async {
    try {
      String endpoint = '/salon-search';
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

  Future<Map<String, dynamic>?> getSalonDetails(String salonId) async {
    try {
      final response = await _api.get('/salon-search/$salonId');
      if (response['success'] == true) {
        return response['data']['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<String>> getCities() async {
    try {
      final response = await _api.get('/salon-search/cities');
      if (response['success'] == true) {
        return List<String>.from(response['data']['data'] ?? []);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

