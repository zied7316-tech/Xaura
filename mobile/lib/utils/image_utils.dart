import '../config/constants.dart';

class ImageUtils {
  /// Get full image URL from relative path
  /// 
  /// If imagePath is already a full URL (starts with http), returns it as is.
  /// Otherwise, constructs the full URL by combining the base API URL with the image path.
  static String? getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return null;
    }
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Extract base URL from API_URL (remove /api)
    // Handle cases like: https://api.xaura.pro/api -> https://api.xaura.pro
    // or http://localhost:5000/api -> http://localhost:5000
    String baseUrl = AppConstants.apiUrl;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 4); // Remove '/api'
    } else if (baseUrl.contains('/api')) {
      baseUrl = baseUrl.replaceAll('/api', '');
    }
    
    // Ensure imagePath starts with /
    final path = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    
    return '$baseUrl$path';
  }
}

