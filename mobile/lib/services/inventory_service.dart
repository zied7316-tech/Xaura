import 'api_service.dart';

class InventoryService {
  final _api = ApiService();

  Future<Map<String, dynamic>> getProducts() async {
    try {
      final response = await _api.get('/inventory');
      if (response['success'] == true) {
        return {
          'success': true,
          'data': response['data']['products'] ?? [],
          'stats': response['data']['stats'],
        };
      }
      return {'success': false, 'data': [], 'stats': null};
    } catch (e) {
      return {'success': false, 'data': [], 'stats': null, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>?> getProduct(String productId) async {
    try {
      final response = await _api.get('/inventory/$productId');
      if (response['success'] == true) {
        return response['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> productData) async {
    try {
      final response = await _api.post('/inventory', productData);
      if (response['success'] == true) {
        return {'success': true, 'product': response['data']['product']};
      }
      throw Exception(response['message'] ?? 'Failed to create product');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> updateProduct(String productId, Map<String, dynamic> productData) async {
    try {
      final response = await _api.put('/inventory/$productId', productData);
      if (response['success'] == true) {
        return {'success': true, 'product': response['data']['product']};
      }
      throw Exception(response['message'] ?? 'Failed to update product');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> deleteProduct(String productId) async {
    try {
      final response = await _api.delete('/inventory/$productId');
      return response['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> restockProduct(String productId, int quantity) async {
    try {
      final response = await _api.put('/inventory/$productId/restock', {'quantity': quantity});
      if (response['success'] == true) {
        return {'success': true, 'product': response['data']['product']};
      }
      throw Exception(response['message'] ?? 'Failed to restock');
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<List<dynamic>> getLowStockProducts() async {
    try {
      final response = await _api.get('/inventory/alerts/low-stock');
      if (response['success'] == true) {
        return response['data']['products'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

