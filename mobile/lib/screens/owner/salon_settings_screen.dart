import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../config/theme.dart';

class SalonSettingsScreen extends StatelessWidget {
  const SalonSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Salon Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Salon Profile',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text('Create your salon profile to get started'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        // TODO: Implement salon creation
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Salon creation coming soon')),
                        );
                      },
                      child: const Text('Create Salon'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'QR Code',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    QrImageView(
                      data: 'https://beautyplatform.com/salon/demo',
                      version: QrVersions.auto,
                      size: 200,
                    ),
                    const SizedBox(height: 16),
                    const Text('Share this QR code with clients'),
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

