class UserModel {
  final String id;
  final String email;
  final String name;
  final String phone;
  final String role;
  final String? avatar;
  final String? salonId;
  final bool isActive;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.phone,
    required this.role,
    this.avatar,
    this.salonId,
    this.isActive = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'Client',
      avatar: json['avatar'],
      salonId: json['salonId'],
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'role': role,
      'avatar': avatar,
      'salonId': salonId,
      'isActive': isActive,
    };
  }

  bool get isOwner => role == 'Owner';
  bool get isWorker => role == 'Worker';
  bool get isClient => role == 'Client';
}

