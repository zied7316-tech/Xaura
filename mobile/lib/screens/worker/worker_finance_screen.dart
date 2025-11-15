import 'package:flutter/material.dart';
import '../../services/worker_finance_service.dart';
import '../../config/theme.dart';

class WorkerFinanceScreen extends StatefulWidget {
  const WorkerFinanceScreen({super.key});

  @override
  State<WorkerFinanceScreen> createState() => _WorkerFinanceScreenState();
}

class _WorkerFinanceScreenState extends State<WorkerFinanceScreen> {
  final _workerFinanceService = WorkerFinanceService();
  
  Map<String, dynamic>? _wallet;
  List<dynamic> _paidEarnings = [];
  List<dynamic> _unpaidEarnings = [];
  Map<String, dynamic>? _estimatedEarnings;
  List<dynamic> _paymentHistory = [];
  bool _loading = true;
  String _activeTab = 'paid';

  @override
  void initState() {
    super.initState();
    _loadFinancialData();
  }

  Future<void> _loadFinancialData() async {
    setState(() => _loading = true);
    try {
      final [wallet, paid, unpaid, estimated, history] = await Future.wait([
        _workerFinanceService.getWallet(),
        _workerFinanceService.getPaidEarnings(),
        _workerFinanceService.getUnpaidEarnings(),
        _workerFinanceService.getEstimatedEarnings(),
        _workerFinanceService.getPaymentHistory(),
      ]);
      
      setState(() {
        _wallet = wallet;
        _paidEarnings = paid;
        _unpaidEarnings = unpaid;
        _estimatedEarnings = estimated;
        _paymentHistory = history;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading financial data: ${e.toString()}')),
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
        title: const Text('My Finances'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadFinancialData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Wallet Summary
                    if (_wallet != null) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Wallet Balance',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatCurrency(_wallet!['balance']?.toDouble()),
                                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    
                    // Estimated Earnings
                    if (_estimatedEarnings != null) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Estimated Earnings',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatCurrency(_estimatedEarnings!['total']?.toDouble()),
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: AppTheme.successColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    
                    // Tabs
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _activeTab = 'paid'),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: _activeTab == 'paid'
                                    ? AppTheme.primaryColor
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(
                                child: Text(
                                  'Paid',
                                  style: TextStyle(
                                    color: _activeTab == 'paid' ? Colors.white : Colors.black,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _activeTab = 'unpaid'),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: _activeTab == 'unpaid'
                                    ? AppTheme.primaryColor
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(
                                child: Text(
                                  'Unpaid',
                                  style: TextStyle(
                                    color: _activeTab == 'unpaid' ? Colors.white : Colors.black,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Earnings List
                    ...(_activeTab == 'paid' ? _paidEarnings : _unpaidEarnings).map((earning) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppTheme.successColor.withOpacity(0.1),
                            child: Icon(
                              Icons.attach_money,
                              color: AppTheme.successColor,
                            ),
                          ),
                          title: Text(earning['serviceId']?['name'] ?? 'Service'),
                          subtitle: Text(
                            earning['appointmentId']?['date'] ?? 'Date not available',
                          ),
                          trailing: Text(
                            _formatCurrency(earning['amount']?.toDouble()),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      );
                    }),
                    
                    if ((_activeTab == 'paid' ? _paidEarnings : _unpaidEarnings).isEmpty)
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(child: Text('No earnings yet')),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}

