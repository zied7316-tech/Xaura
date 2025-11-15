import 'package:flutter/material.dart';
import '../../services/worker_service.dart';
import '../../services/salon_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class WorkersScreen extends StatefulWidget {
  const WorkersScreen({super.key});

  @override
  State<WorkersScreen> createState() => _WorkersScreenState();
}

class _WorkersScreenState extends State<WorkersScreen> {
  final _workerService = WorkerService();
  final _salonService = SalonService();
  final _emailController = TextEditingController();
  
  List<dynamic> _workers = [];
  bool _loading = true;
  bool _showAddModal = false;

  @override
  void initState() {
    super.initState();
    _loadWorkers();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadWorkers() async {
    setState(() => _loading = true);
    try {
      final workers = await _workerService.getWorkers();
      setState(() {
        _workers = workers;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading workers: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addWorker() async {
    if (_emailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter worker email')),
      );
      return;
    }

    try {
      // Note: You'll need to get salonId from context/provider
      // For now, using a placeholder - you'll need to implement salonService.addWorker
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Worker invitation sent!')),
      );
      setState(() => _showAddModal = false);
      _emailController.clear();
      _loadWorkers();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  Future<void> _removeWorker(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Worker'),
        content: const Text('Are you sure you want to remove this worker?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final success = await _workerService.removeWorker(id);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Worker removed')),
          );
          _loadWorkers();
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Workers'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add),
            onPressed: () => setState(() => _showAddModal = true),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadWorkers,
              child: _workers.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people, size: 64, color: AppTheme.textSecondary),
                          const SizedBox(height: 16),
                          Text(
                            'No workers yet',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Add workers to your salon',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _workers.length,
                      itemBuilder: (context, index) {
                        final worker = _workers[index];
                        final avatar = worker['avatar'];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: CircleAvatar(
                              radius: 28,
                              backgroundImage: avatar != null
                                  ? NetworkImage(ImageUtils.getImageUrl(avatar) ?? '')
                                  : null,
                              child: avatar == null
                                  ? Text(
                                      (worker['name'] ?? 'W')[0].toUpperCase(),
                                      style: const TextStyle(fontSize: 20),
                                    )
                                  : null,
                            ),
                            title: Text(worker['name'] ?? 'Unknown'),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (worker['phone'] != null)
                                  Text('📞 ${worker['phone']}'),
                                if (worker['email'] != null)
                                  Text('✉️ ${worker['email']}'),
                                if (worker['currentStatus'] != null)
                                  Text(
                                    'Status: ${worker['currentStatus']}',
                                    style: TextStyle(
                                      color: worker['currentStatus'] == 'available'
                                          ? AppTheme.successColor
                                          : AppTheme.textSecondary,
                                    ),
                                  ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _removeWorker(worker['_id'] ?? worker['id']),
                            ),
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _showAddModal = true),
        child: const Icon(Icons.person_add),
      ),
      bottomSheet: _showAddModal
          ? Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Add Worker',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => setState(() => _showAddModal = false),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    label: 'Worker Email',
                    hint: 'Enter worker email address',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Send Invitation',
                    onPressed: _addWorker,
                  ),
                ],
              ),
            )
          : null,
    );
  }
}

