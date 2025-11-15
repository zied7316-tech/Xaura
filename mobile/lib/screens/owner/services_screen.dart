import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/service_service.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  final _serviceService = ServiceService();
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _durationController = TextEditingController();
  final _priceController = TextEditingController();
  
  List<dynamic> _services = [];
  bool _loading = true;
  bool _showAddModal = false;
  String _selectedCategory = 'Other';

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _durationController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    setState(() => _loading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      // Note: You'll need to get salonId from authProvider or salon provider
      final services = await _serviceService.getAllServices();
      setState(() {
        _services = services;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading services: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addService() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      // Note: You'll need salonId from authProvider
      final result = await _serviceService.createService({
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'duration': int.tryParse(_durationController.text) ?? 30,
        'price': double.tryParse(_priceController.text) ?? 0.0,
        'category': _selectedCategory,
      });

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Service created successfully!')),
        );
        setState(() => _showAddModal = false);
        _nameController.clear();
        _descriptionController.clear();
        _durationController.clear();
        _priceController.clear();
        _loadServices();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to create service')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  Future<void> _deleteService(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Service'),
        content: const Text('Are you sure you want to delete this service?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final success = await _serviceService.deleteService(id);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Service deleted')),
          );
          _loadServices();
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
        title: const Text('Services'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => setState(() => _showAddModal = true),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadServices,
              child: _services.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.content_cut, size: 64, color: AppTheme.textSecondary),
                          const SizedBox(height: 16),
                          Text(
                            'No services yet',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Add your first service to get started',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _services.length,
                      itemBuilder: (context, index) {
                        final service = _services[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                              child: Icon(Icons.content_cut, color: AppTheme.primaryColor),
                            ),
                            title: Text(service['name'] ?? 'Unnamed Service'),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (service['description'] != null)
                                  Text(service['description']),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(Icons.access_time, size: 16, color: AppTheme.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('${service['duration'] ?? 0} min'),
                                    const SizedBox(width: 16),
                                    Icon(Icons.attach_money, size: 16, color: AppTheme.textSecondary),
                                    Text('${service['price'] ?? 0.0}'),
                                  ],
                                ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteService(service['_id'] ?? service['id']),
                            ),
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _showAddModal = true),
        child: const Icon(Icons.add),
      ),
      // Add Service Modal
      bottomSheet: _showAddModal
          ? Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Add Service',
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
                        label: 'Service Name',
                        hint: 'e.g., Haircut',
                        controller: _nameController,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Name is required' : null,
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        label: 'Description',
                        hint: 'Service description',
                        controller: _descriptionController,
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: CustomTextField(
                              label: 'Duration (min)',
                              hint: '30',
                              controller: _durationController,
                              keyboardType: TextInputType.number,
                              validator: (value) =>
                                  value?.isEmpty ?? true ? 'Duration is required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: CustomTextField(
                              label: 'Price',
                              hint: '0.00',
                              controller: _priceController,
                              keyboardType: TextInputType.number,
                              validator: (value) =>
                                  value?.isEmpty ?? true ? 'Price is required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        decoration: const InputDecoration(labelText: 'Category'),
                        items: AppConstants.serviceCategories.map((category) {
                          return DropdownMenuItem(
                            value: category,
                            child: Text(category),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => _selectedCategory = value ?? 'Other');
                        },
                      ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'Create Service',
                        onPressed: _addService,
                      ),
                    ],
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

