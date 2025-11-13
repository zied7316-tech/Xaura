import '../models/appointment_model.dart';
import 'api_service.dart';

class AppointmentService {
  final _api = ApiService();

  Future<List<AppointmentModel>> getAppointments({
    String? status,
    String? date,
  }) async {
    try {
      String endpoint = '/appointments';
      List<String> params = [];
      
      if (status != null) params.add('status=$status');
      if (date != null) params.add('date=$date');
      
      if (params.isNotEmpty) {
        endpoint += '?${params.join('&')}';
      }

      final response = await _api.get(endpoint);
      
      if (response['success'] == true) {
        final appointments = (response['data']['appointments'] as List)
            .map((json) => AppointmentModel.fromJson(json))
            .toList();
        return appointments;
      }
      
      return [];
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<AppointmentModel?> createAppointment(Map<String, dynamic> data) async {
    try {
      final response = await _api.post('/appointments', data);
      
      if (response['success'] == true) {
        return AppointmentModel.fromJson(response['data']['appointment']);
      }
      
      throw Exception(response['message'] ?? 'Failed to create appointment');
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<bool> updateAppointmentStatus(String id, String status) async {
    try {
      final response = await _api.put('/appointments/$id/status', {
        'status': status,
      });
      
      return response['success'] == true;
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}

