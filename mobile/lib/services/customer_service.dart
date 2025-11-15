import 'api_service.dart';

class CustomerService {
  final _api = ApiService();

  Future<Map<String, dynamic>> getCustomers() async {
    try {
      final response = await _api.get('/customers');
      if (response['success'] == true) {
        return {
          'success': true,
          'data': response['data']['customers'] ?? [],
          'summary': response['data']['summary'],
        };
      }
      return {'success': false, 'data': [], 'summary': null};
    } catch (e) {
      return {'success': false, 'data': [], 'summary': null, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>?> getCustomerDetails(String customerId) async {
    try {
      final response = await _api.get('/customers/$customerId');
      if (response['success'] == true) {
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> updateCustomerProfile(String customerId, Map<String, dynamic> data) async {
    try {
      final response = await _api.put('/customers/$customerId', data);
      if (response['success'] == true) {
        return {'success': true, 'customer': response['data']['customer']};
      }
      throw Exception(response['message'] ?? 'Failed to update customer');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> addCustomerNote(String customerId, Map<String, dynamic> noteData) async {
    try {
      final response = await _api.post('/customers/$customerId/notes', noteData);
      if (response['success'] == true) {
        return {'success': true, 'note': response['data']['note']};
      }
      throw Exception(response['message'] ?? 'Failed to add note');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}

