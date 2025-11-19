import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/salon_search_service.dart';
import '../../services/availability_service.dart';
import '../../services/appointment_service.dart';
import '../../widgets/custom_button.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class BookAppointmentScreen extends StatefulWidget {
  final String? salonId;
  final String? serviceId;
  
  const BookAppointmentScreen({super.key, this.salonId, this.serviceId});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final _salonSearchService = SalonSearchService();
  final _availabilityService = AvailabilityService();
  final _appointmentService = AppointmentService();
  
  Map<String, dynamic>? _salonDetails;
  int _step = 1; // 1: Service, 2: Worker, 3: Date & Time
  List<Map<String, dynamic>> _selectedServices = []; // Support multiple services
  Map<String, dynamic>? _selectedWorker;
  DateTime? _selectedDate;
  String? _selectedTime;
  List<dynamic> _availableSlots = [];
  bool _loading = true;
  bool _loadingSlots = false;
  bool _booking = false;

  @override
  void initState() {
    super.initState();
    if (widget.salonId != null) {
      _loadSalonDetails();
    }
    if (widget.serviceId != null) {
      // Pre-select service if provided
    }
  }

  Future<void> _loadSalonDetails() async {
    if (widget.salonId == null) return;
    
    setState(() => _loading = true);
    try {
      final details = await _salonSearchService.getSalonDetails(widget.salonId!);
      setState(() {
        _salonDetails = details;
        if (widget.serviceId != null && details != null && details['services'] != null) {
          final services = details['services'] as List<dynamic>?;
          if (services != null) {
            final service = services.firstWhere(
              (s) => (s['_id'] ?? s['id']) == widget.serviceId,
              orElse: () => null,
            );
            if (service != null) {
              _selectedServices = [service];
              _step = 2;
            }
          }
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading salon: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadAvailableSlots() async {
    if (_selectedWorker == null || _selectedDate == null || _selectedServices.isEmpty) return;
    
    setState(() => _loadingSlots = true);
    try {
      final workerId = _selectedWorker!['_id'] ?? _selectedWorker!['id'];
      // Calculate total duration for multiple services
      final totalDuration = _selectedServices.fold<int>(
        0,
        (sum, service) => sum + (service['duration'] as int? ?? 0),
      );
      
      final slots = await _availabilityService.getWorkerTimeSlots(
        workerId,
        filters: {
          'date': _selectedDate!.toIso8601String().split('T')[0],
          'serviceId': _selectedServices[0]['_id'] ?? _selectedServices[0]['id'],
          'totalDuration': totalDuration.toString(),
        },
      );
      setState(() {
        _availableSlots = slots;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading slots: ${e.toString()}')),
      );
    } finally {
      setState(() => _loadingSlots = false);
    }
  }

  Future<void> _bookAppointment() async {
    if (_selectedServices.isEmpty || _selectedWorker == null || _selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all steps')),
      );
      return;
    }

    setState(() => _booking = true);
    try {
      final appointmentDateTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        int.parse(_selectedTime!.split(':')[0]),
        int.parse(_selectedTime!.split(':')[1]),
      );

      // Prepare services array for backend
      final services = _selectedServices.map((service) {
        return {
          'serviceId': service['_id'] ?? service['id'],
          'name': service['name'],
          'price': service['price'],
          'duration': service['duration'],
        };
      }).toList();

      final result = await _appointmentService.createAppointment({
        'workerId': _selectedWorker!['_id'] ?? _selectedWorker!['id'],
        'serviceId': _selectedServices[0]['_id'] ?? _selectedServices[0]['id'], // Keep for backward compatibility
        'services': services, // Array of services
        'dateTime': appointmentDateTime.toIso8601String(),
        'notes': '',
      });

      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Appointment booked successfully for ${_selectedServices.length} service${_selectedServices.length > 1 ? 's' : ''}!',
            ),
          ),
        );
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) context.go('/appointments');
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error booking: ${e.toString()}')),
      );
    } finally {
      setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _salonDetails == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Book Appointment')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final salon = _salonDetails!;
    final services = salon['services'] as List<dynamic>? ?? [];
    final workers = salon['workers'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress Steps
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStep(1, 'Service', _step >= 1),
                Container(width: 40, height: 2, color: _step > 1 ? AppTheme.primaryColor : Colors.grey),
                _buildStep(2, 'Worker', _step >= 2),
                Container(width: 40, height: 2, color: _step > 2 ? AppTheme.primaryColor : Colors.grey),
                _buildStep(3, 'Time', _step >= 3),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Step 1: Select Service
            if (_step == 1) ...[
              Text(
                'Choose Service(s)',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You can select one or multiple services for the same booking',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ...services.map((service) {
                final serviceId = service['_id'] ?? service['id'];
                final isSelected = _selectedServices.any(
                  (s) => (s['_id'] ?? s['id']) == serviceId,
                );
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: isSelected ? AppTheme.primaryColor.withOpacity(0.1) : null,
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedServices.removeWhere(
                            (s) => (s['_id'] ?? s['id']) == serviceId,
                          );
                        } else {
                          _selectedServices.add(service);
                        }
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(Icons.content_cut, color: AppTheme.primaryColor, size: 32),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  service['name'] ?? 'Service',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${service['duration'] ?? 0} min • \$${service['price'] ?? 0.0}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(Icons.check_circle, color: AppTheme.primaryColor),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              if (_selectedServices.isNotEmpty) ...[
                const SizedBox(height: 16),
                Card(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Selected: ${_selectedServices.length} service${_selectedServices.length > 1 ? 's' : ''}',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ..._selectedServices.map((service) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    service['name'] ?? 'Service',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ),
                                Text(
                                  '\$${service['price'] ?? 0.0}',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green.shade700,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total Duration:',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${_selectedServices.fold<int>(0, (sum, s) => sum + (s['duration'] as int? ?? 0))} min',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total Price:',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '\$${_selectedServices.fold<double>(0.0, (sum, s) => sum + ((s['price'] as num?)?.toDouble() ?? 0.0)).toStringAsFixed(2)}',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _step = 2;
                              });
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryColor,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: Text(
                              'Continue with ${_selectedServices.length} Service${_selectedServices.length > 1 ? 's' : ''}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
            
            // Step 2: Select Worker
            if (_step == 2 && _selectedServices.isNotEmpty) ...[
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => setState(() => _step = 1),
                  ),
                  Expanded(
                    child: Text(
                      'Choose a Worker',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Show selected services summary
              Card(
                color: Colors.grey.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Selected Service${_selectedServices.length > 1 ? 's' : ''}:',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ..._selectedServices.map((service) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  service['name'] ?? 'Service',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                              ),
                              Text(
                                '${service['duration'] ?? 0} min • \$${service['price'] ?? 0.0}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        );
                      }),
                      if (_selectedServices.length > 1) ...[
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total:',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${_selectedServices.fold<int>(0, (sum, s) => sum + (s['duration'] as int? ?? 0))} min • \$${_selectedServices.fold<double>(0.0, (sum, s) => sum + ((s['price'] as num?)?.toDouble() ?? 0.0)).toStringAsFixed(2)}',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ...workers.map((worker) {
                final isSelected = _selectedWorker?['_id'] == worker['_id'] || 
                                  _selectedWorker?['id'] == worker['id'];
                final avatar = worker['avatar'];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: isSelected ? AppTheme.primaryColor.withOpacity(0.1) : null,
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _selectedWorker = worker;
                        _step = 3;
                        _selectedDate = DateTime.now().add(const Duration(days: 1));
                      });
                      _loadAvailableSlots();
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundImage: avatar != null
                                ? NetworkImage(ImageUtils.getImageUrl(avatar) ?? '')
                                : null,
                            child: avatar == null
                                ? Text((worker['name'] ?? 'W')[0].toUpperCase())
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  worker['name'] ?? 'Worker',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                if (worker['currentStatus'] != null)
                                  Text(
                                    worker['currentStatus'],
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(Icons.check_circle, color: AppTheme.primaryColor),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
            
            // Step 3: Select Date & Time
            if (_step == 3 && _selectedWorker != null && _selectedServices.isNotEmpty) ...[
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => setState(() => _step = 2),
                  ),
                  Expanded(
                    child: Text(
                      'Select Date & Time',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Date Picker
              Card(
                child: ListTile(
                  leading: const Icon(Icons.calendar_today),
                  title: const Text('Select Date'),
                  subtitle: Text(
                    _selectedDate != null
                        ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                        : 'Choose a date',
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate ?? DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setState(() {
                        _selectedDate = date;
                        _selectedTime = null;
                      });
                      _loadAvailableSlots();
                    }
                  },
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Time Slots
              if (_selectedDate != null) ...[
                Text(
                  'Available Times',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                _loadingSlots
                    ? const Center(child: CircularProgressIndicator())
                    : _availableSlots.isEmpty
                        ? const Card(
                            child: Padding(
                              padding: EdgeInsets.all(24),
                              child: Center(child: Text('No available slots')),
                            ),
                          )
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 8,
                              childAspectRatio: 2.5,
                            ),
                            itemCount: _availableSlots.length,
                            itemBuilder: (context, index) {
                              final slot = _availableSlots[index];
                              final time = slot['time'] ?? slot['startTime'];
                              final isSelected = _selectedTime == time;
                              return InkWell(
                                onTap: () {
                                  setState(() => _selectedTime = time);
                                },
                                child: Card(
                                  color: isSelected
                                      ? AppTheme.primaryColor
                                      : null,
                                  child: Center(
                                    child: Text(
                                      time,
                                      style: TextStyle(
                                        color: isSelected ? Colors.white : null,
                                        fontWeight: isSelected ? FontWeight.bold : null,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                
                const SizedBox(height: 24),
                
                CustomButton(
                  text: 'Book Appointment',
                  onPressed: _selectedTime != null && !_booking ? _bookAppointment : null,
                  isLoading: _booking,
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStep(int stepNum, String label, bool isActive) {
    return Column(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: isActive ? AppTheme.primaryColor : Colors.grey,
          child: Text(
            '$stepNum',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isActive ? AppTheme.primaryColor : Colors.grey,
          ),
        ),
      ],
    );
  }
}

