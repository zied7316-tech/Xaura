import 'package:flutter/material.dart';
import '../../services/appointment_service.dart';
import '../../config/theme.dart';

class WorkerAppointmentsScreen extends StatefulWidget {
  const WorkerAppointmentsScreen({super.key});

  @override
  State<WorkerAppointmentsScreen> createState() => _WorkerAppointmentsScreenState();
}

class _WorkerAppointmentsScreenState extends State<WorkerAppointmentsScreen> {
  final _appointmentService = AppointmentService();
  
  List<dynamic> _appointments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _loading = true);
    try {
      final appointments = await _appointmentService.getAppointments();
      setState(() {
        _appointments = appointments;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading appointments: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String appointmentId, String status) async {
    try {
      final success = await _appointmentService.updateAppointmentStatus(appointmentId, status);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated')),
        );
        _loadAppointments();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAppointments,
              child: _appointments.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.calendar_today, size: 64, color: AppTheme.textSecondary),
                          const SizedBox(height: 16),
                          Text(
                            'No appointments',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _appointments.length,
                      itemBuilder: (context, index) {
                        final appointment = _appointments[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                              child: Icon(Icons.person, color: AppTheme.primaryColor),
                            ),
                            title: Text(appointment['clientId']?['name'] ?? 'Client'),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (appointment['serviceId'] != null)
                                  Text('Service: ${appointment['serviceId']['name']}'),
                                Text('Date: ${appointment['date'] ?? 'N/A'}'),
                                Text('Time: ${appointment['time'] ?? 'N/A'}'),
                                Text('Status: ${appointment['status'] ?? 'pending'}'),
                              ],
                            ),
                            trailing: appointment['status'] == 'pending'
                                ? PopupMenuButton(
                                    itemBuilder: (context) => [
                                      const PopupMenuItem(
                                        value: 'confirmed',
                                        child: Text('Confirm'),
                                      ),
                                      const PopupMenuItem(
                                        value: 'cancelled',
                                        child: Text('Cancel'),
                                      ),
                                    ],
                                    onSelected: (value) {
                                      _updateStatus(
                                        appointment['_id'] ?? appointment['id'],
                                        value.toString(),
                                      );
                                    },
                                  )
                                : null,
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

