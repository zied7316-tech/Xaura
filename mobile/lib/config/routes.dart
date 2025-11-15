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
import '../screens/owner/finances_screen.dart';
import '../screens/owner/customers_screen.dart';
import '../screens/owner/inventory_screen.dart';
import '../screens/owner/reports_screen.dart';
import '../screens/owner/my_salons_screen.dart';
import '../screens/worker/worker_dashboard.dart';
import '../screens/worker/worker_availability_screen.dart';
import '../screens/worker/worker_appointments_screen.dart';
import '../screens/worker/worker_finance_screen.dart';
import '../screens/client/client_dashboard.dart';
import '../screens/client/qr_scanner_screen.dart';
import '../screens/client/salon_search_screen.dart';
import '../screens/client/salon_details_screen.dart';
import '../screens/client/book_appointment_screen.dart';
import '../screens/client/join_salon_screen.dart';
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
      GoRoute(
        path: '/owner/finances',
        builder: (context, state) => const FinancesScreen(),
      ),
      GoRoute(
        path: '/owner/customers',
        builder: (context, state) => const CustomersScreen(),
      ),
      GoRoute(
        path: '/owner/inventory',
        builder: (context, state) => const InventoryScreen(),
      ),
      GoRoute(
        path: '/owner/reports',
        builder: (context, state) => const ReportsScreen(),
      ),
      GoRoute(
        path: '/owner/salons',
        builder: (context, state) => const MySalonsScreen(),
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
      GoRoute(
        path: '/worker/finances',
        builder: (context, state) => const WorkerFinanceScreen(),
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
        path: '/join-salon',
        builder: (context, state) => const JoinSalonScreen(),
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
      GoRoute(
        path: '/book',
        builder: (context, state) {
          final salonId = state.uri.queryParameters['salon'];
          final serviceId = state.uri.queryParameters['service'];
          return BookAppointmentScreen(salonId: salonId, serviceId: serviceId);
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

