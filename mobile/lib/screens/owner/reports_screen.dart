import 'package:flutter/material.dart';
import '../../services/reports_service.dart';
import '../../config/theme.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _reportsService = ReportsService();
  
  Map<String, dynamic>? _reports;
  bool _loading = true;
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _loading = true);
    try {
      final reports = await _reportsService.getBusinessReports(
        _startDate.toIso8601String().split('T')[0],
        _endDate.toIso8601String().split('T')[0],
      );
      setState(() {
        _reports = reports;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading reports: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  String _formatCurrency(double? amount) {
    if (amount == null) return '\$0.00';
    return '\$${amount.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Business Reports'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadReports,
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
                  // Date Range Selector
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: ListTile(
                                  leading: const Icon(Icons.calendar_today),
                                  title: const Text('Start Date'),
                                  subtitle: Text(
                                    '${_startDate.day}/${_startDate.month}/${_startDate.year}',
                                  ),
                                  onTap: () async {
                                    final date = await showDatePicker(
                                      context: context,
                                      initialDate: _startDate,
                                      firstDate: DateTime(2020),
                                      lastDate: DateTime.now(),
                                    );
                                    if (date != null) {
                                      setState(() => _startDate = date);
                                      _loadReports();
                                    }
                                  },
                                ),
                              ),
                              Expanded(
                                child: ListTile(
                                  leading: const Icon(Icons.calendar_today),
                                  title: const Text('End Date'),
                                  subtitle: Text(
                                    '${_endDate.day}/${_endDate.month}/${_endDate.year}',
                                  ),
                                  onTap: () async {
                                    final date = await showDatePicker(
                                      context: context,
                                      initialDate: _endDate,
                                      firstDate: _startDate,
                                      lastDate: DateTime.now(),
                                    );
                                    if (date != null) {
                                      setState(() => _endDate = date);
                                      _loadReports();
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  if (_reports == null)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text('No data available'),
                      ),
                    )
                  else ...[
                    // Summary Cards
                    if (_reports!['summary'] != null) ...[
                      Text(
                        'Summary',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.5,
                        children: [
                          _buildStatCard(
                            'Total Revenue',
                            _formatCurrency(_reports!['summary']?['totalRevenue']?.toDouble()),
                            Icons.attach_money,
                            AppTheme.successColor,
                          ),
                          _buildStatCard(
                            'Appointments',
                            '${_reports!['summary']?['totalAppointments'] ?? 0}',
                            Icons.calendar_today,
                            AppTheme.primaryColor,
                          ),
                          _buildStatCard(
                            'Completed',
                            '${_reports!['summary']?['completedAppointments'] ?? 0}',
                            Icons.check_circle,
                            AppTheme.successColor,
                          ),
                          _buildStatCard(
                            'Cancelled',
                            '${_reports!['summary']?['cancelledAppointments'] ?? 0}',
                            Icons.cancel,
                            AppTheme.errorColor,
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                    ],
                    
                    // Charts Section
                    if (_reports!['charts'] != null) ...[
                      Text(
                        'Analytics',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Appointment Status Distribution',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 16),
                              if (_reports!['charts']?['appointmentStats'] != null)
                                ...(_reports!['charts']?['appointmentStats'] as List<dynamic>).map((stat) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(stat['_id'] ?? 'Unknown'),
                                        ),
                                        Text('${stat['count'] ?? 0}'),
                                      ],
                                    ),
                                  );
                                }),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: color, size: 32),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

