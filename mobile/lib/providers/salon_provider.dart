import 'package:flutter/material.dart';
import '../models/salon_model.dart';
import '../services/salon_service.dart';

class SalonProvider with ChangeNotifier {
  final _salonService = SalonService();
  
  SalonModel? _currentSalon;
  bool _isLoading = false;
  String? _error;

  SalonModel? get currentSalon => _currentSalon;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<SalonModel?> getSalonById(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentSalon = await _salonService.getSalonById(id);
      _isLoading = false;
      notifyListeners();
      return _currentSalon;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<SalonModel?> getSalonByQRCode(String qrCode) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentSalon = await _salonService.getSalonByQRCode(qrCode);
      _isLoading = false;
      notifyListeners();
      return _currentSalon;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<SalonModel?> createSalon(Map<String, dynamic> salonData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentSalon = await _salonService.createSalon(salonData);
      _isLoading = false;
      notifyListeners();
      return _currentSalon;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  void clearCurrentSalon() {
    _currentSalon = null;
    notifyListeners();
  }
}

