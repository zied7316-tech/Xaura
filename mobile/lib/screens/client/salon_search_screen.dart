import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/salon_search_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class SalonSearchScreen extends StatefulWidget {
  const SalonSearchScreen({super.key});

  @override
  State<SalonSearchScreen> createState() => _SalonSearchScreenState();
}

class _SalonSearchScreenState extends State<SalonSearchScreen> {
  final _salonSearchService = SalonSearchService();
  final _searchController = TextEditingController();
  
  List<dynamic> _salons = [];
  List<String> _cities = [];
  bool _loading = true;
  bool _searching = false;
  String _selectedCity = '';
  String _sortBy = 'name';

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _loading = true);
    try {
      final salons = await _salonSearchService.searchSalons();
      final cities = await _salonSearchService.getCities();
      setState(() {
        _salons = salons;
        _cities = cities;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading salons: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _search() async {
    setState(() => _searching = true);
    try {
      final filters = <String, dynamic>{};
      if (_searchController.text.isNotEmpty) {
        filters['query'] = _searchController.text;
      }
      if (_selectedCity.isNotEmpty) {
        filters['city'] = _selectedCity;
      }
      filters['sortBy'] = _sortBy;
      
      final results = await _salonSearchService.searchSalons(filters: filters);
      setState(() {
        _salons = results;
      });
      
      if (results.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No salons found')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Search failed: ${e.toString()}')),
      );
    } finally {
      setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Salons'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Column(
                    children: [
                      CustomTextField(
                        label: 'Search',
                        hint: 'Search by salon name...',
                        controller: _searchController,
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.search),
                          onPressed: _search,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _selectedCity.isEmpty ? null : _selectedCity,
                              decoration: const InputDecoration(
                                labelText: 'City',
                                border: OutlineInputBorder(),
                              ),
                              items: [
                                const DropdownMenuItem(value: '', child: Text('All Cities')),
                                ..._cities.map((city) => DropdownMenuItem(
                                      value: city,
                                      child: Text(city),
                                    )),
                              ],
                              onChanged: (value) {
                                setState(() => _selectedCity = value ?? '');
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _sortBy,
                              decoration: const InputDecoration(
                                labelText: 'Sort By',
                                border: OutlineInputBorder(),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'name', child: Text('Name')),
                                DropdownMenuItem(value: 'rating', child: Text('Rating')),
                              ],
                              onChanged: (value) {
                                setState(() => _sortBy = value ?? 'name');
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      CustomButton(
                        text: 'Search',
                        onPressed: _searching ? null : _search,
                        isLoading: _searching,
                      ),
                    ],
                  ),
                ),
                // Results
                Expanded(
                  child: _salons.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.store, size: 64, color: AppTheme.textSecondary),
                              const SizedBox(height: 16),
                              Text(
                                'No salons found',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _salons.length,
                          itemBuilder: (context, index) {
                            final salon = _salons[index];
                            final logo = salon['logo'];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: InkWell(
                                onTap: () => context.push('/salon/${salon['_id'] ?? salon['id']}'),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: logo != null
                                            ? Image.network(
                                                ImageUtils.getImageUrl(logo) ?? '',
                                                width: 80,
                                                height: 80,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) => Container(
                                                  width: 80,
                                                  height: 80,
                                                  color: AppTheme.primaryColor.withOpacity(0.1),
                                                  child: Icon(Icons.store, color: AppTheme.primaryColor),
                                                ),
                                              )
                                            : Container(
                                                width: 80,
                                                height: 80,
                                                color: AppTheme.primaryColor.withOpacity(0.1),
                                                child: Icon(Icons.store, color: AppTheme.primaryColor),
                                              ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              salon['name'] ?? 'Unnamed Salon',
                                              style: Theme.of(context).textTheme.titleMedium,
                                            ),
                                            if (salon['address'] != null)
                                              Text(
                                                '${salon['address']['city'] ?? ''}, ${salon['address']['state'] ?? ''}',
                                                style: Theme.of(context).textTheme.bodySmall,
                                              ),
                                            if (salon['phone'] != null)
                                              Text(
                                                '📞 ${salon['phone']}',
                                                style: Theme.of(context).textTheme.bodySmall,
                                              ),
                                          ],
                                        ),
                                      ),
                                      Icon(Icons.arrow_forward_ios, size: 16),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}

