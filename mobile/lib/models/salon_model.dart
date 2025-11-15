import '../utils/image_utils.dart';

class SalonModel {
  final String id;
  final String name;
  final String description;
  final String phone;
  final String? email;
  final String? logo;
  final String qrCode;
  final String ownerId;
  final Address? address;
  final Map<String, WorkingHours>? workingHours;
  final bool isActive;

  SalonModel({
    required this.id,
    required this.name,
    required this.description,
    required this.phone,
    this.email,
    this.logo,
    required this.qrCode,
    required this.ownerId,
    this.address,
    this.workingHours,
    this.isActive = true,
  });
  
  /// Get full logo URL
  String? get logoUrl => ImageUtils.getImageUrl(logo);

  factory SalonModel.fromJson(Map<String, dynamic> json) {
    Map<String, WorkingHours>? hours;
    if (json['workingHours'] != null) {
      hours = {};
      (json['workingHours'] as Map<String, dynamic>).forEach((key, value) {
        hours![key] = WorkingHours.fromJson(value);
      });
    }

    return SalonModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'],
      logo: json['logo'],
      qrCode: json['qrCode'] ?? '',
      ownerId: json['ownerId'] ?? '',
      address: json['address'] != null ? Address.fromJson(json['address']) : null,
      workingHours: hours,
      isActive: json['isActive'] ?? true,
    );
  }
}

class Address {
  final String street;
  final String city;
  final String state;
  final String zipCode;
  final String country;

  Address({
    required this.street,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.country,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      street: json['street'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      zipCode: json['zipCode'] ?? '',
      country: json['country'] ?? '',
    );
  }

  String get fullAddress => '$street, $city, $state $zipCode';
}

class WorkingHours {
  final String open;
  final String close;
  final bool isClosed;

  WorkingHours({
    required this.open,
    required this.close,
    this.isClosed = false,
  });

  factory WorkingHours.fromJson(Map<String, dynamic> json) {
    return WorkingHours(
      open: json['open'] ?? '09:00',
      close: json['close'] ?? '18:00',
      isClosed: json['isClosed'] ?? false,
    );
  }
}

