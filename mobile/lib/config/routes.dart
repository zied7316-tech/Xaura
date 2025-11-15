import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/verify_email_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/owner/owner_dashboard.dart';
import '../screens/owner/salon_settings_screen.dart';
import '../screens/owner/services_screen.dart';
import '../screens/owner/workers_screen.dart';
import '../screens/worker/worker_dashboard.dart';
import '../screens/worker/worker_availability_screen.dart';
import '../screens/worker/worker_appointments_screen.dart';
import '../screens/client/client_dashboard.dart';
import '../screens/client/qr_scanner_screen.dart';
import '../screens/client/salon_search_screen.dart';
import '../screens/client/salon_details_screen.dart';
import '../screens/shared/appointments_screen.dart';
import '../screens/shared/profile_screen.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/splash',
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Auth
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          return VerifyEmailScreen(token: token);
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          return ResetPasswordScreen(token: token);
        },
      ),
      
      // Owner Routes
      GoRoute(
        path: '/owner',
        builder: (context, state) => const OwnerDashboard(),
      ),
      GoRoute(
        path: '/owner/salon',
        builder: (context, state) => const SalonSettingsScreen(),
      ),
      GoRoute(
        path: '/owner/services',
        builder: (context, state) => const ServicesScreen(),
      ),
      GoRoute(
        path: '/owner/workers',
        builder: (context, state) => const WorkersScreen(),
      ),
      
      // Worker Routes
      GoRoute(
        path: '/worker',
        builder: (context, state) => const WorkerDashboard(),
      ),
      GoRoute(
        path: '/worker/availability',
        builder: (context, state) => const WorkerAvailabilityScreen(),
      ),
      GoRoute(
        path: '/worker/appointments',
        builder: (context, state) => const WorkerAppointmentsScreen(),
      ),
      
      // Client Routes
      GoRoute(
        path: '/client',
        builder: (context, state) => const ClientDashboard(),
      ),
      GoRoute(
        path: '/client/scan',
        builder: (context, state) => const QRScannerScreen(),
      ),
      GoRoute(
        path: '/search-salons',
        builder: (context, state) => const SalonSearchScreen(),
      ),
      GoRoute(
        path: '/salon/:salonId',
        builder: (context, state) {
          final salonId = state.pathParameters['salonId']!;
          return SalonDetailsScreen(salonId: salonId);
        },
      ),
      
      // Shared Routes
      GoRoute(
        path: '/appointments',
        builder: (context, state) => const AppointmentsScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
}

