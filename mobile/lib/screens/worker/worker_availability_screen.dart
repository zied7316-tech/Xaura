import 'package:flutter/material.dart';
import '../../services/availability_service.dart';
import '../../widgets/custom_button.dart';
import '../../config/constants.dart';

class WorkerAvailabilityScreen extends StatefulWidget {
  const WorkerAvailabilityScreen({super.key});

  @override
  State<WorkerAvailabilityScreen> createState() => _WorkerAvailabilityScreenState();
}

class _WorkerAvailabilityScreenState extends State<WorkerAvailabilityScreen> {
  final _availabilityService = AvailabilityService();
  
  Map<String, dynamic>? _availability;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    setState(() => _loading = true);
    try {
      final availability = await _availabilityService.getMyAvailability();
      setState(() {
        _availability = availability;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading availability: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _saveAvailability() async {
    setState(() => _saving = true);
    try {
      // Note: You'll need to build the availability data structure
      // This is a simplified version
      final result = await _availabilityService.updateMyAvailability({
        // Add your availability data here
      });
      
      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Availability updated successfully!')),
        );
        _loadAvailability();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to update availability')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Availability'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _saving ? null : _saveAvailability,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Set Your Availability',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Configure when you\'re available for appointments',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 24),
                  
                  // Days of week
                  ...AppConstants.daysOfWeek.map((day) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        title: Text(day[0].toUpperCase() + day.substring(1)),
                        trailing: Switch(
                          value: true, // You'll need to get this from availability data
                          onChanged: (value) {
                            // Update availability for this day
                          },
                        ),
                      ),
                    );
                  }),
                  
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Save Availability',
                    onPressed: _saving ? null : _saveAvailability,
                    isLoading: _saving,
                  ),
                ],
              ),
            ),
    );
  }
}

