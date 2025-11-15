import 'package:flutter/material.dart';
import '../../services/salon_ownership_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class MySalonsScreen extends StatefulWidget {
  const MySalonsScreen({super.key});

  @override
  State<MySalonsScreen> createState() => _MySalonsScreenState();
}

class _MySalonsScreenState extends State<MySalonsScreen> {
  final _salonOwnershipService = SalonOwnershipService();
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  List<dynamic> _salons = [];
  bool _loading = true;
  bool _showAddModal = false;

  @override
  void initState() {
    super.initState();
    _loadSalons();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadSalons() async {
    setState(() => _loading = true);
    try {
      final result = await _salonOwnershipService.getMySalons();
      setState(() {
        _salons = result['data'] ?? [];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading salons: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addSalon() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final result = await _salonOwnershipService.addSalon({
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'address': _addressController.text.trim(),
        'description': _descriptionController.text.trim(),
      });

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Salon added successfully!')),
        );
        setState(() => _showAddModal = false);
        _nameController.clear();
        _emailController.clear();
        _phoneController.clear();
        _addressController.clear();
        _descriptionController.clear();
        _loadSalons();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to add salon')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  Future<void> _setPrimary(String id) async {
    try {
      final success = await _salonOwnershipService.setPrimarySalon(id);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Primary salon updated!')),
        );
        _loadSalons();
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
        title: const Text('My Salons'),
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
              onRefresh: _loadSalons,
              child: Column(
                children: [
                  // Stats
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  Text(
                                    '${_salons.length}',
                                    style: Theme.of(context).textTheme.headlineMedium,
                                  ),
                                  const Text('Total Salons'),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  Text(
                                    _salons.where((s) => s['isPrimary'] == true).isNotEmpty
                                        ? '✓'
                                        : '-',
                                    style: Theme.of(context).textTheme.headlineMedium,
                                  ),
                                  const Text('Primary Set'),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Salons List
                  Expanded(
                    child: _salons.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.store, size: 64, color: AppTheme.textSecondary),
                                const SizedBox(height: 16),
                                Text(
                                  'No salons yet',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 8),
                                const Text('Add your first salon to get started'),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _salons.length,
                            itemBuilder: (context, index) {
                              final salon = _salons[index];
                              final salonData = salon['salon'] ?? salon;
                              final logo = salonData['logo'];
                              final isPrimary = salon['isPrimary'] == true;
                              final address = salonData['address'];
                              
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: isPrimary ? AppTheme.primaryColor.withOpacity(0.05) : null,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    radius: 28,
                                    backgroundImage: logo != null
                                        ? NetworkImage(ImageUtils.getImageUrl(logo) ?? '')
                                        : null,
                                    child: logo == null
                                        ? Icon(Icons.store, color: AppTheme.primaryColor)
                                        : null,
                                  ),
                                  title: Row(
                                    children: [
                                      Expanded(
                                        child: Text(salonData['name'] ?? 'Salon'),
                                      ),
                                      if (isPrimary)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: AppTheme.primaryColor,
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: const Text(
                                            'PRIMARY',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (address != null)
                                        Text(
                                          '${address['city'] ?? ''}, ${address['state'] ?? ''}',
                                        ),
                                      if (salonData['phone'] != null)
                                        Text('📞 ${salonData['phone']}'),
                                    ],
                                  ),
                                  trailing: !isPrimary
                                      ? IconButton(
                                          icon: const Icon(Icons.star_border),
                                          onPressed: () => _setPrimary(salon['_id'] ?? salon['id']),
                                          tooltip: 'Set as Primary',
                                        )
                                      : const Icon(Icons.star, color: AppTheme.primaryColor),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _showAddModal = true),
        child: const Icon(Icons.add),
      ),
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
                            'Add New Salon',
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
                        label: 'Salon Name',
                        controller: _nameController,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Name is required' : null,
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        label: 'Email',
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Email is required' : null,
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        label: 'Phone',
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Phone is required' : null,
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        label: 'Address',
                        controller: _addressController,
                        maxLines: 2,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Address is required' : null,
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        label: 'Description',
                        controller: _descriptionController,
                        maxLines: 3,
                      ),
                      const SizedBox(height: 24),
                      CustomButton(
                        text: 'Add Salon',
                        onPressed: _addSalon,
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

