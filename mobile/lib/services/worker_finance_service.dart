import 'api_service.dart';

class WorkerFinanceService {
  final _api = ApiService();

  Future<Map<String, dynamic>?> getWallet() async {
    try {
      final response = await _api.get('/worker-finance/wallet');
      if (response['success'] == true) {
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<dynamic>> getPaidEarnings() async {
    try {
      final response = await _api.get('/worker-finance/earnings/paid');
      if (response['success'] == true) {
        return response['data']['earnings'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getUnpaidEarnings() async {
    try {
      final response = await _api.get('/worker-finance/earnings/unpaid');
      if (response['success'] == true) {
        return response['data']['earnings'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getEstimatedEarnings() async {
    try {
      final response = await _api.get('/worker-finance/earnings/estimated');
      if (response['success'] == true) {
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<dynamic>> getPaymentHistory() async {
    try {
      final response = await _api.get('/worker-finance/payment-history');
      if (response['success'] == true) {
        return response['data']['payments'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> markEarningAsPaid(String earningId, String paymentMethod) async {
    try {
      final response = await _api.post('/worker-finance/earnings/$earningId/mark-paid', {
        'paymentMethod': paymentMethod,
      });
      if (response['success'] == true) {
        return {'success': true, 'data': response['data']};
      }
      throw Exception(response['message'] ?? 'Failed to mark as paid');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}

