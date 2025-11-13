class AppointmentModel {
  final String id;
  final String clientId;
  final String workerId;
  final String serviceId;
  final String salonId;
  final DateTime dateTime;
  final String status;
  final String notes;
  final double servicePriceAtBooking;
  final int serviceDurationAtBooking;
  
  // Populated fields
  final Map<String, dynamic>? clientData;
  final Map<String, dynamic>? workerData;
  final Map<String, dynamic>? serviceData;
  final Map<String, dynamic>? salonData;

  AppointmentModel({
    required this.id,
    required this.clientId,
    required this.workerId,
    required this.serviceId,
    required this.salonId,
    required this.dateTime,
    required this.status,
    this.notes = '',
    required this.servicePriceAtBooking,
    required this.serviceDurationAtBooking,
    this.clientData,
    this.workerData,
    this.serviceData,
    this.salonData,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['_id'] ?? json['id'] ?? '',
      clientId: json['clientId'] is String ? json['clientId'] : json['clientId']['_id'],
      workerId: json['workerId'] is String ? json['workerId'] : json['workerId']['_id'],
      serviceId: json['serviceId'] is String ? json['serviceId'] : json['serviceId']['_id'],
      salonId: json['salonId'] is String ? json['salonId'] : json['salonId']['_id'],
      dateTime: DateTime.parse(json['dateTime']),
      status: json['status'] ?? 'pending',
      notes: json['notes'] ?? '',
      servicePriceAtBooking: (json['servicePriceAtBooking'] ?? 0).toDouble(),
      serviceDurationAtBooking: json['serviceDurationAtBooking'] ?? 0,
      clientData: json['clientId'] is Map ? json['clientId'] : null,
      workerData: json['workerId'] is Map ? json['workerId'] : null,
      serviceData: json['serviceId'] is Map ? json['serviceId'] : null,
      salonData: json['salonId'] is Map ? json['salonId'] : null,
    );
  }

  String get clientName => clientData?['name'] ?? 'Unknown';
  String get workerName => workerData?['name'] ?? 'Unknown';
  String get serviceName => serviceData?['name'] ?? 'Unknown';
  String get salonName => salonData?['name'] ?? 'Unknown';
}

