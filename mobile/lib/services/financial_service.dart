import 'api_service.dart';

class FinancialService {
  final _api = ApiService();

  // Payments
  Future<Map<String, dynamic>> createPayment(Map<String, dynamic> paymentData) async {
    try {
      final response = await _api.post('/payments', paymentData);
      if (response['success'] == true) {
        return {'success': true, 'payment': response['data']['payment']};
      }
      throw Exception(response['message'] ?? 'Failed to create payment');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<List<dynamic>> getPayments({Map<String, dynamic>? params}) async {
    try {
      String endpoint = '/payments';
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
        return response['data']['payments'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getRevenueSummary({Map<String, dynamic>? params}) async {
    try {
      String endpoint = '/payments/revenue';
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

  // Expenses
  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> expenseData) async {
    try {
      final response = await _api.post('/expenses', expenseData);
      if (response['success'] == true) {
        return {'success': true, 'expense': response['data']['expense']};
      }
      throw Exception(response['message'] ?? 'Failed to create expense');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<List<dynamic>> getExpenses({Map<String, dynamic>? params}) async {
    try {
      String endpoint = '/expenses';
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
        return response['data']['expenses'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> deleteExpense(String id) async {
    try {
      final response = await _api.delete('/expenses/$id');
      return response['success'] == true;
    } catch (e) {
      return false;
    }
  }

  // Analytics
  Future<Map<String, dynamic>?> getProfitLoss({Map<String, dynamic>? params}) async {
    try {
      String endpoint = '/analytics/profit-loss';
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
}

