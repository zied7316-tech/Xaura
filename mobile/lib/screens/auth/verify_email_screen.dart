import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../config/theme.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String? token;
  
  const VerifyEmailScreen({super.key, this.token});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _authService = AuthService();
  final _emailController = TextEditingController();
  bool _isVerifying = true;
  bool _isResending = false;
  String _status = 'verifying'; // verifying, success, error
  String _message = '';

  @override
  void initState() {
    super.initState();
    if (widget.token != null) {
      _verifyEmail(widget.token!);
    } else {
      setState(() {
        _status = 'error';
        _message = 'Verification token is missing';
        _isVerifying = false;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _verifyEmail(String token) async {
    setState(() {
      _isVerifying = true;
      _status = 'verifying';
    });

    final result = await _authService.verifyEmail(token);

    if (!mounted) return;

    setState(() {
      _isVerifying = false;
      if (result['success'] == true) {
        _status = 'success';
        _message = result['message'] ?? 'Email verified successfully!';
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) context.go('/login');
        });
      } else {
        _status = 'error';
        _message = result['error'] ?? 'Failed to verify email';
      }
    });
  }

  Future<void> _resendVerification() async {
    if (_emailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email address')),
      );
      return;
    }

    setState(() {
      _isResending = true;
    });

    final result = await _authService.resendVerification(_emailController.text.trim());

    if (!mounted) return;

    setState(() {
      _isResending = false;
    });

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification email sent! Please check your inbox.')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['error'] ?? 'Failed to resend verification email')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Icon(
                Icons.spa,
                size: 80,
                color: AppTheme.primaryColor,
              ),
              const SizedBox(height: 24),
              Text(
                'Email Verification',
                style: Theme.of(context).textTheme.displayMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: _buildContent(),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Back to Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_status == 'verifying') {
      return Column(
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          const Text('Verifying your email...'),
          const SizedBox(height: 8),
          Text(
            'Please wait while we verify your email address.',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      );
    }

    if (_status == 'success') {
      return Column(
        children: [
          Icon(
            Icons.check_circle,
            size: 64,
            color: AppTheme.successColor,
          ),
          const SizedBox(height: 24),
          Text(
            'Email Verified!',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            _message,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          const Text(
            'Redirecting to login page...',
            style: TextStyle(fontSize: 12),
          ),
          const SizedBox(height: 24),
          CustomButton(
            text: 'Go to Login',
            onPressed: () => context.go('/login'),
          ),
        ],
      );
    }

    // Error state
    return Column(
      children: [
        Icon(
          Icons.error,
          size: 64,
          color: AppTheme.errorColor,
        ),
        const SizedBox(height: 24),
        Text(
          'Verification Failed',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          _message,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        CustomTextField(
          label: 'Email Address',
          hint: 'Enter your email',
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 16),
        CustomButton(
          text: 'Resend Verification Email',
          onPressed: _resendVerification,
          isLoading: _isResending,
        ),
      ],
    );
  }
}

