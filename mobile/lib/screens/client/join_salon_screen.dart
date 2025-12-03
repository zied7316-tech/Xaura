import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/salon_client_service.dart';
import '../../services/salon_search_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../config/theme.dart';
import '../../utils/image_utils.dart';

class JoinSalonScreen extends StatefulWidget {
  const JoinSalonScreen({super.key});

  @override
  State<JoinSalonScreen> createState() => _JoinSalonScreenState();
}

class _JoinSalonScreenState extends State<JoinSalonScreen> {
  final _salonClientService = SalonClientService();
  final _salonSearchService = SalonSearchService();
  final _qrCodeController = TextEditingController();
  
  String _entryMethod = 'manual'; // 'manual' or 'camera'
  Map<String, dynamic>? _salonInfo;
  bool _loading = false;
  bool _joined = false;

  @override
  void dispose() {
    _qrCodeController.dispose();
    super.dispose();
  }

  Future<void> _checkQR() async {
    if (_qrCodeController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a QR code')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final result = await _salonClientService.getSalonInfoByQR(_qrCodeController.text.trim());
      if (result != null) {
        setState(() {
          _salonInfo = result['salon'];
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid QR code. Salon not found.')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _joinSalon() async {
    if (_qrCodeController.text.isEmpty) return;

    setState(() => _loading = true);
    try {
      final result = await _salonClientService.joinSalonViaQR(_qrCodeController.text.trim());
      
      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Successfully joined salon!')),
        );
        setState(() => _joined = true);
        
        // Navigate to salon details after 2 seconds
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && result['data'] != null) {
            final salonId = result['data']['salon']?['id'] ?? result['data']['salonId'];
            if (salonId != null) {
              context.go('/salon/$salonId');
            }
          }
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? 'Failed to join salon')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  void _handleQRScanned(String qrCode) {
    setState(() {
      _qrCodeController.text = qrCode;
      _entryMethod = 'manual';
    });
    _checkQR();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Join Salon'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              Icons.qr_code,
              size: 64,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 16),
            Text(
              'Join a Salon',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Enter the salon\'s QR code to join their client list',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            
            if (_salonInfo == null && !_joined) ...[
              // Entry Method Selection
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _entryMethod = 'manual'),
                      child: Card(
                        color: _entryMethod == 'manual'
                            ? AppTheme.primaryColor.withOpacity(0.1)
                            : null,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Icon(
                                Icons.keyboard,
                                size: 40,
                                color: _entryMethod == 'manual'
                                    ? AppTheme.primaryColor
                                    : AppTheme.textSecondary,
                              ),
                              const SizedBox(height: 8),
                              const Text('Manual Entry'),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        setState(() => _entryMethod = 'camera');
                        context.push('/client/scan');
                      },
                      child: Card(
                        color: _entryMethod == 'camera'
                            ? AppTheme.primaryColor.withOpacity(0.1)
                            : null,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Icon(
                                Icons.camera_alt,
                                size: 40,
                                color: _entryMethod == 'camera'
                                    ? AppTheme.primaryColor
                                    : AppTheme.textSecondary,
                              ),
                              const SizedBox(height: 8),
                              const Text('Scan QR'),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // QR Code Input
              CustomTextField(
                label: 'QR Code',
                hint: 'Enter salon QR code',
                controller: _qrCodeController,
              ),
              const SizedBox(height: 16),
              CustomButton(
                text: 'Check QR Code',
                onPressed: _loading ? null : _checkQR,
                isLoading: _loading,
              ),
            ],
            
            // Salon Info Card
            if (_salonInfo != null && !_joined) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (_salonInfo!['logo'] != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                ImageUtils.getImageUrl(_salonInfo!['logo']) ?? '',
                                width: 60,
                                height: 60,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Icon(Icons.store, size: 40),
                              ),
                            )
                          else
                            Icon(Icons.store, size: 40, color: AppTheme.primaryColor),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _salonInfo!['name'] ?? 'Salon',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                if (_salonInfo!['address'] != null)
                                  Text(
                                    '${_salonInfo!['address']['city'] ?? ''}, ${_salonInfo!['address']['state'] ?? ''}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      CustomButton(
                        text: 'Join Salon',
                        onPressed: _loading ? null : _joinSalon,
                        isLoading: _loading,
                      ),
                    ],
                  ),
                ),
              ),
            ],
            
            // Success Message
            if (_joined)
              Card(
                color: AppTheme.successColor.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(Icons.check_circle, size: 64, color: AppTheme.successColor),
                      const SizedBox(height: 16),
                      Text(
                        'Successfully Joined!',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      const Text('Redirecting to salon...'),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

