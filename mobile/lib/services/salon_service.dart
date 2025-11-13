import '../models/salon_model.dart';
import 'api_service.dart';

class SalonService {
  final _api = ApiService();

  Future<SalonModel?> createSalon(Map<String, dynamic> salonData) async {
    try {
      final response = await _api.post('/salons', salonData);
      
      if (response['success'] == true) {
        return SalonModel.fromJson(response['data']['salon']);
      }
      
      throw Exception(response['message'] ?? 'Failed to create salon');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<SalonModel?> getSalonById(String id) async {
    try {
      final response = await _api.get('/salons/$id');
      
      if (response['success'] == true) {
        return SalonModel.fromJson(response['data']['salon']);
      }
      
      return null;
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<SalonModel?> getSalonByQRCode(String qrCode) async {
    try {
      final response = await _api.get('/salons/qr/$qrCode');
      
      if (response['success'] == true) {
        return SalonModel.fromJson(response['data']['salon']);
      }
      
      return null;
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<Map<String, dynamic>> getQRCodeImage(String salonId) async {
    try {
      final response = await _api.get('/salons/$salonId/qr-image');
      
      if (response['success'] == true) {
        return response['data'];
      }
      
      throw Exception('Failed to get QR code');
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}

