import 'package:flutter/material.dart';
import '../models/appointment_model.dart';
import '../services/appointment_service.dart';

class AppointmentProvider with ChangeNotifier {
  final _appointmentService = AppointmentService();
  
  List<AppointmentModel> _appointments = [];
  bool _isLoading = false;
  String? _error;

  List<AppointmentModel> get appointments => _appointments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAppointments({String? status, String? date}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _appointments = await _appointmentService.getAppointments(
        status: status,
        date: date,
      );
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<AppointmentModel?> createAppointment(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final appointment = await _appointmentService.createAppointment(data);
      if (appointment != null) {
        _appointments.insert(0, appointment);
      }
      _isLoading = false;
      notifyListeners();
      return appointment;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateAppointmentStatus(String id, String status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _appointmentService.updateAppointmentStatus(id, status);
      if (success) {
        // Update local list
        final index = _appointments.indexWhere((a) => a.id == id);
        if (index != -1) {
          // Reload appointments to get updated data
          await loadAppointments();
        }
      }
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  List<AppointmentModel> get todayAppointments {
    final today = DateTime.now();
    return _appointments.where((appointment) {
      return appointment.dateTime.year == today.year &&
          appointment.dateTime.month == today.month &&
          appointment.dateTime.day == today.day;
    }).toList();
  }

  List<AppointmentModel> get upcomingAppointments {
    final now = DateTime.now();
    return _appointments.where((appointment) {
      return appointment.dateTime.isAfter(now) &&
          (appointment.status == 'pending' || appointment.status == 'confirmed');
    }).toList();
  }
}

