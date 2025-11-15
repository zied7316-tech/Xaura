import 'package:flutter/material.dart';
import '../../services/customer_service.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _customerService = CustomerService();
  final _searchController = TextEditingController();
  
  List<dynamic> _customers = [];
  Map<String, dynamic>? _summary;
  bool _loading = true;
  String _searchTerm = '';

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomers() async {
    setState(() => _loading = true);
    try {
      final result = await _customerService.getCustomers();
      setState(() {
        _customers = result['data'] ?? [];
        _summary = result['summary'];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading customers: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  List<dynamic> get _filteredCustomers {
    if (_searchTerm.isEmpty) return _customers;
    return _customers.where((customer) {
      final name = (customer['name'] ?? '').toLowerCase();
      final email = (customer['email'] ?? '').toLowerCase();
      final phone = (customer['phone'] ?? '').toLowerCase();
      final search = _searchTerm.toLowerCase();
      return name.contains(search) || email.contains(search) || phone.contains(search);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customers'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search customers...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchTerm.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchTerm = '');
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onChanged: (value) {
                      setState(() => _searchTerm = value);
                    },
                  ),
                ),
                
                // Summary Cards
                if (_summary != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  Text(
                                    '${_summary!['totalCustomers'] ?? 0}',
                                    style: Theme.of(context).textTheme.headlineMedium,
                                  ),
                                  const Text('Total Customers'),
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
                                    '${_summary!['totalAppointments'] ?? 0}',
                                    style: Theme.of(context).textTheme.headlineMedium,
                                  ),
                                  const Text('Appointments'),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                
                const SizedBox(height: 16),
                
                // Customers List
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadCustomers,
                    child: _filteredCustomers.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.people, size: 64, color: AppTheme.textSecondary),
                                const SizedBox(height: 16),
                                Text(
                                  _searchTerm.isEmpty ? 'No customers yet' : 'No customers found',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredCustomers.length,
                            itemBuilder: (context, index) {
                              final customer = _filteredCustomers[index];
                              final avatar = customer['avatar'];
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
                                            (customer['name'] ?? 'C')[0].toUpperCase(),
                                            style: const TextStyle(fontSize: 20),
                                          )
                                        : null,
                                  ),
                                  title: Text(customer['name'] ?? 'Unknown'),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (customer['email'] != null)
                                        Text('✉️ ${customer['email']}'),
                                      if (customer['phone'] != null)
                                        Text('📞 ${customer['phone']}'),
                                      if (customer['totalAppointments'] != null)
                                        Text(
                                          '${customer['totalAppointments']} appointments',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                    ],
                                  ),
                                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                  onTap: () {
                                    // TODO: Navigate to customer details
                                  },
                                ),
                              );
                            },
                          ),
                  ),
                ),
              ],
            ),
    );
  }
}

