# Image Upload Feature Documentation 📸

## Overview
The Beauty Platform now supports image uploads for Salons, Services, and Workers, allowing visual representation throughout the application.

## Backend Implementation

### 1. File Upload Middleware (`uploadMiddleware.js`)
- Uses **multer** for handling multipart/form-data
- Organizes uploads into subdirectories:
  - `/uploads/salons/` - Salon logos
  - `/uploads/services/` - Service images
  - `/uploads/workers/` - Worker profile pictures
- **File validation**:
  - Allowed formats: JPG, JPEG, PNG, GIF, WebP
  - Max file size: 5MB
  - Automatic unique filename generation

### 2. Upload Controller (`uploadController.js`)
**Three main endpoints:**

#### Upload Salon Logo
- **Route**: `POST /api/upload/salon/:id`
- **Access**: Owner only
- **Validation**: Checks ownership before upload
- **Updates**: `Salon.logo` field

#### Upload Service Image
- **Route**: `POST /api/upload/service/:id`
- **Access**: Owner only
- **Validation**: Checks salon ownership
- **Updates**: `Service.image` field

#### Upload Worker Profile Picture
- **Route**: `POST /api/upload/worker/:id`
- **Access**: Owner or Worker themselves
- **Validation**: Owner of salon OR the worker themselves
- **Updates**: `User.avatar` field

### 3. Static File Serving
- Express configured to serve `/uploads` directory as static files
- Images accessible via: `http://localhost:5000/uploads/{subdir}/{filename}`

### 4. Database Fields
All models already support image fields:
- **Salon**: `logo` (String)
- **Service**: `image` (String)
- **User**: `avatar` (String)

## Frontend Implementation

### 1. Upload Service (`uploadService.js`)
Provides three upload methods:
```javascript
uploadService.uploadSalonImage(salonId, file)
uploadService.uploadServiceImage(serviceId, file)
uploadService.uploadWorkerImage(workerId, file)
uploadService.getImageUrl(imagePath) // Helper for display
```

### 2. ImageUpload Component (`ImageUpload.jsx`)
Reusable component features:
- **Image preview** before upload
- **Drag & drop** support (file input)
- **File validation** (type and size)
- **Remove/change** image functionality
- **Current image** display with option to replace

Props:
- `currentImage`: Existing image URL (optional)
- `onImageSelect`: Callback with selected file
- `label`: Input label text
- `accept`: File types (default: "image/*")
- `maxSize`: Max size in MB (default: 5)

### 3. Integration in Pages

#### Services Page (`ServicesPage.jsx`)
- **Add Service Modal**: Image upload field at the top
- **Edit Service Modal**: Shows current image, allows replacement
- **Service Cards**: Display service image or default gradient
- Uploads image after service creation/update

#### Salon Settings (`SalonSettings.jsx`)
- **Salon Logo Upload**: Prominent at top of settings form
- Shows current logo with option to change
- Uploads on form submission

#### Workers Page (`WorkersPage.jsx`)
- **Edit Worker Modal**: Profile picture upload
- **Worker Cards**: Display avatar or default user icon
- Circular avatar display with border styling
- Uploads when updating worker details

## Usage Instructions

### For Salon Owners:

#### 1. Upload Salon Logo:
1. Navigate to **Settings** → **Salon Settings**
2. Click **"Select Image"** in the Salon Logo section
3. Choose an image (max 5MB)
4. Preview appears instantly
5. Click **"Update Contact Information"** to save
6. Logo will appear in salon profile and QR display

#### 2. Upload Service Images:
1. Navigate to **Services**
2. Click **"Add Service"** or **Edit** existing service
3. Upload image at the top of the form
4. Fill in service details
5. Click **"Create Service"** or **"Update Service"**
6. Image displays on service card

#### 3. Upload Worker Profile Pictures:
1. Navigate to **Workers**
2. Click **Edit** on a worker card
3. Upload profile picture at the top
4. Update other worker details
5. Click **"Save Changes"**
6. Avatar displays on worker card

## Technical Details

### File Storage Structure
```
backend/
  uploads/
    salons/
      image-1699999999999-123456789.jpg
    services/
      image-1699999999999-987654321.jpg
    workers/
      image-1699999999999-456789123.jpg
```

### Security Features
- ✅ File type validation (images only)
- ✅ File size limits (5MB max)
- ✅ Ownership verification before upload
- ✅ Unique filename generation prevents conflicts
- ✅ Authorization middleware on all routes

### Image Display
- **Full URL Construction**: 
  - Backend: `/uploads/salons/filename.jpg`
  - Frontend: `http://localhost:5000/uploads/salons/filename.jpg`
- **Fallback Display**:
  - Salon: No default icon
  - Service: Gradient with scissors icon
  - Worker: User icon on colored circle

## API Examples

### Upload Salon Logo
```bash
curl -X POST http://localhost:5000/api/upload/salon/{salonId} \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/logo.jpg"
```

### Upload Service Image
```bash
curl -X POST http://localhost:5000/api/upload/service/{serviceId} \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/service.jpg"
```

### Upload Worker Avatar
```bash
curl -X POST http://localhost:5000/api/upload/worker/{workerId} \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/avatar.jpg"
```

## Future Enhancements
- [ ] Image compression before upload
- [ ] Multiple images per service (gallery)
- [ ] Image cropping/editing in-browser
- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Automatic thumbnail generation
- [ ] Drag & drop upload zones
- [ ] Progress indicators for uploads
- [ ] Image optimization for faster loading

## Testing Checklist
- ✅ Upload images for salon, services, workers
- ✅ View uploaded images in cards/profiles
- ✅ Replace existing images
- ✅ Remove images (by removing and saving)
- ✅ File size validation works (> 5MB rejected)
- ✅ File type validation works (non-images rejected)
- ✅ Authorization (only owners can upload salon/service images)
- ✅ Images persist after page reload
- ✅ Images served correctly as static files

## Notes
- Images are stored in the backend filesystem (`/uploads`)
- **Production Consideration**: For production, consider using cloud storage (S3, Cloudinary, etc.) instead of filesystem storage
- The uploads directory is created automatically on first upload
- Images are NOT deleted when entity is deleted (manual cleanup may be needed)

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Version**: 1.0.0
**Date**: November 10, 2025

