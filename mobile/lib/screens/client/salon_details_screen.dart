import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/salon_search_service.dart';
import '../../widgets/custom_button.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class SalonDetailsScreen extends StatefulWidget {
  final String salonId;
  
  const SalonDetailsScreen({super.key, required this.salonId});

  @override
  State<SalonDetailsScreen> createState() => _SalonDetailsScreenState();
}

class _SalonDetailsScreenState extends State<SalonDetailsScreen> {
  final _salonSearchService = SalonSearchService();
  
  Map<String, dynamic>? _salonDetails;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSalonDetails();
  }

  Future<void> _loadSalonDetails() async {
    setState(() => _loading = true);
    try {
      final details = await _salonSearchService.getSalonDetails(widget.salonId);
      setState(() {
        _salonDetails = details;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading salon: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Salon Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_salonDetails == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Salon Details')),
        body: const Center(child: Text('Salon not found')),
      );
    }

    final salon = _salonDetails!;
    final logo = salon['logo'];
    final services = salon['services'] as List<dynamic>? ?? [];
    final workers = salon['workers'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(salon['name'] ?? 'Salon'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Salon Image/Logo
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
              ),
              child: logo != null
                  ? Image.network(
                      ImageUtils.getImageUrl(logo) ?? '',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(Icons.store, size: 64, color: AppTheme.primaryColor),
                    )
                  : Icon(Icons.store, size: 64, color: AppTheme.primaryColor),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Salon Name
                  Text(
                    salon['name'] ?? 'Unnamed Salon',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  
                  // Address
                  if (salon['address'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Row(
                        children: [
                          Icon(Icons.location_on, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${salon['address']['street'] ?? ''}, ${salon['address']['city'] ?? ''}',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      ),
                    ),
                  
                  // Phone
                  if (salon['phone'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Icon(Icons.phone, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            salon['phone'],
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  
                  // Description
                  if (salon['description'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(
                        salon['description'],
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  
                  const SizedBox(height: 24),
                  
                  // Book Button
                  CustomButton(
                    text: 'Book Appointment',
                    onPressed: () => context.push('/book?salon=${widget.salonId}'),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Services Section
                  Text(
                    'Services',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  services.isEmpty
                      ? const Text('No services available')
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: services.length,
                          itemBuilder: (context, index) {
                            final service = services[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: Icon(Icons.content_cut, color: AppTheme.primaryColor),
                                title: Text(service['name'] ?? 'Unnamed Service'),
                                subtitle: Text(
                                  '${service['duration'] ?? 0} min • \$${service['price'] ?? 0.0}',
                                ),
                              ),
                            );
                          },
                        ),
                  
                  const SizedBox(height: 24),
                  
                  // Workers Section
                  Text(
                    'Workers',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  workers.isEmpty
                      ? const Text('No workers available')
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: workers.length,
                          itemBuilder: (context, index) {
                            final worker = workers[index];
                            final avatar = worker['avatar'];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundImage: avatar != null
                                      ? NetworkImage(ImageUtils.getImageUrl(avatar) ?? '')
                                      : null,
                                  child: avatar == null
                                      ? Text((worker['name'] ?? 'W')[0].toUpperCase())
                                      : null,
                                ),
                                title: Text(worker['name'] ?? 'Unknown'),
                                subtitle: Text(
                                  worker['currentStatus'] ?? 'offline',
                                ),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

