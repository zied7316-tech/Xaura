import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/appointment_provider.dart';
import '../../widgets/status_badge.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  @override
  void initState() {
    super.initState();
    Provider.of<AppointmentProvider>(context, listen: false).loadAppointments();
  }

  @override
  Widget build(BuildContext context) {
    final appointmentProvider = Provider.of<AppointmentProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointments'),
      ),
      body: appointmentProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : appointmentProvider.appointments.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.calendar_today, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No appointments yet'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => appointmentProvider.loadAppointments(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: appointmentProvider.appointments.length,
                    itemBuilder: (context, index) {
                      final appointment = appointmentProvider.appointments[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(appointment.serviceName),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(appointment.salonName),
                              Text(DateFormat('MMM dd, yyyy • hh:mm a')
                                  .format(appointment.dateTime)),
                            ],
                          ),
                          trailing: StatusBadge(status: appointment.status),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

