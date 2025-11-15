import 'api_service.dart';

class ReportsService {
  final _api = ApiService();

  Future<Map<String, dynamic>?> getBusinessReports(String? startDate, String? endDate) async {
    try {
      String endpoint = '/reports';
      final params = <String, String>{};
      if (startDate != null) params['startDate'] = startDate;
      if (endDate != null) params['endDate'] = endDate;
      
      if (params.isNotEmpty) {
        final queryParams = params.entries.map((e) => '${e.key}=${e.value}').join('&');
        endpoint += '?$queryParams';
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
}

