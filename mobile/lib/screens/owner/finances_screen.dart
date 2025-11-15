import 'package:flutter/material.dart';
import '../../services/financial_service.dart';
import '../../config/theme.dart';

class FinancesScreen extends StatefulWidget {
  const FinancesScreen({super.key});

  @override
  State<FinancesScreen> createState() => _FinancesScreenState();
}

class _FinancesScreenState extends State<FinancesScreen> {
  final _financialService = FinancialService();
  
  Map<String, dynamic>? _revenue;
  Map<String, dynamic>? _profitLoss;
  List<dynamic> _payments = [];
  List<dynamic> _expenses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final [revenue, profitLoss, payments, expenses] = await Future.wait([
        _financialService.getRevenueSummary(),
        _financialService.getProfitLoss(),
        _financialService.getPayments(),
        _financialService.getExpenses(),
      ]);
      
      setState(() {
        _revenue = revenue;
        _profitLoss = profitLoss;
        _payments = payments;
        _expenses = expenses;
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
        title: const Text('Finances'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Financial Overview',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 24),
                    
                    // Summary Cards
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
                          _formatCurrency(_revenue?['totalRevenue']?.toDouble()),
                          Icons.attach_money,
                          AppTheme.successColor,
                        ),
                        _buildStatCard(
                          'Net Revenue',
                          _formatCurrency(_revenue?['netRevenue']?.toDouble()),
                          Icons.trending_up,
                          AppTheme.primaryColor,
                        ),
                        _buildStatCard(
                          'Profit',
                          _formatCurrency(_profitLoss?['profit']?.toDouble()),
                          Icons.account_balance,
                          AppTheme.infoColor,
                        ),
                        _buildStatCard(
                          'Expenses',
                          _formatCurrency(_profitLoss?['totalExpenses']?.toDouble()),
                          Icons.trending_down,
                          AppTheme.errorColor,
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Recent Payments
                    Text(
                      'Recent Payments',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    _payments.isEmpty
                        ? const Card(
                            child: Padding(
                              padding: EdgeInsets.all(24),
                              child: Center(child: Text('No payments yet')),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _payments.length > 5 ? 5 : _payments.length,
                            itemBuilder: (context, index) {
                              final payment = _payments[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: AppTheme.successColor.withOpacity(0.1),
                                    child: Icon(Icons.payment, color: AppTheme.successColor),
                                  ),
                                  title: Text(payment['clientId']?['name'] ?? 'Client'),
                                  subtitle: Text(payment['serviceId']?['name'] ?? 'Service'),
                                  trailing: Text(
                                    _formatCurrency(payment['amount']?.toDouble()),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                              );
                            },
                          ),
                    
                    const SizedBox(height: 24),
                    
                    // Recent Expenses
                    Text(
                      'Recent Expenses',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    _expenses.isEmpty
                        ? const Card(
                            child: Padding(
                              padding: EdgeInsets.all(24),
                              child: Center(child: Text('No expenses yet')),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _expenses.length > 5 ? 5 : _expenses.length,
                            itemBuilder: (context, index) {
                              final expense = _expenses[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: AppTheme.errorColor.withOpacity(0.1),
                                    child: Icon(Icons.receipt, color: AppTheme.errorColor),
                                  ),
                                  title: Text(expense['description'] ?? 'Expense'),
                                  subtitle: Text(expense['category'] ?? ''),
                                  trailing: Text(
                                    _formatCurrency(expense['amount']?.toDouble()),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                              );
                            },
                          ),
                  ],
                ),
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

