# Beauty Platform - Web Dashboard

Modern React web application for Beauty Platform salon management system.

## ✨ Features

### For Salon Owners
- 📊 Dashboard with business analytics
- 🏢 Salon profile management
- ✂️ Service creation and management
- 👥 Worker/staff management
- 📅 Appointment overview
- 🔲 QR code generation for client bookings
- 📱 Mobile-responsive design

### For Workers
- 📅 Personal appointment schedule
- ✅ Appointment status management
- 📊 Performance tracking

### For Clients
- 🔍 Browse salons and services
- 📸 Scan QR codes for quick booking
- 📅 Book appointments
- 📝 View booking history
- ⭐ Rate services

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query + Context API
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **QR Codes**: qrcode.react
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📁 Project Structure

```
web/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/              # Auth-related components
│   │   │   └── ProtectedRoute.jsx
│   │   ├── layout/            # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── salon/             # Salon-specific components
│   │   │   └── QRCodeDisplay.jsx
│   │   └── ui/                # Reusable UI components
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Card.jsx
│   │       ├── Modal.jsx
│   │       ├── Badge.jsx
│   │       ├── Select.jsx
│   │       └── Textarea.jsx
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication context
│   ├── pages/
│   │   ├── auth/              # Auth pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── client/            # Client pages
│   │   │   ├── ClientDashboard.jsx
│   │   │   └── BookingPage.jsx
│   │   ├── owner/             # Owner pages
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── SalonSettings.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   └── WorkersPage.jsx
│   │   ├── public/            # Public pages
│   │   │   ├── LandingPage.jsx
│   │   │   └── ScanQRPage.jsx
│   │   ├── shared/            # Shared pages
│   │   │   ├── AppointmentsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   └── worker/            # Worker pages
│   │       └── WorkerDashboard.jsx
│   ├── services/              # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── salonService.js
│   │   ├── serviceService.js
│   │   ├── appointmentService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .eslintrc.cjs
├── .gitignore
├── env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running (see backend/README.md)

### Installation

1. **Navigate to web directory**
   ```bash
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Visit http://localhost:3000

## 🔧 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎨 UI Components

All UI components are built with Tailwind CSS and follow a consistent design system:

### Button
```jsx
import Button from './components/ui/Button'

<Button variant="primary" size="lg" fullWidth>
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `outline`, `danger`, `ghost`
Sizes: `sm`, `md`, `lg`

### Input
```jsx
import Input from './components/ui/Input'

<Input 
  label="Email" 
  type="email" 
  error={errors.email?.message}
  {...register('email')}
/>
```

### Card
```jsx
import Card, { CardHeader, CardTitle, CardContent } from './components/ui/Card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## 🔐 Authentication

The app uses JWT-based authentication with role-based access control:

```jsx
import { useAuth } from './context/AuthContext'

const Component = () => {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  // Use auth state and methods
}
```

### Protected Routes

```jsx
import ProtectedRoute from './components/auth/ProtectedRoute'

<Route 
  path="/owner/dashboard" 
  element={
    <ProtectedRoute roles={['Owner']}>
      <OwnerDashboard />
    </ProtectedRoute>
  } 
/>
```

## 📡 API Integration

All API calls are centralized in service files:

```jsx
import { salonService } from './services/salonService'

// Get salon by ID
const salon = await salonService.getSalonById(id)

// Create salon
const newSalon = await salonService.createSalon(data)
```

### Available Services

- **authService**: Authentication and user management
- **salonService**: Salon CRUD operations
- **serviceService**: Service management
- **appointmentService**: Appointment bookings
- **notificationService**: SMS/WhatsApp notifications

## 🎯 User Flows

### Owner Flow
1. Register as Owner
2. Create salon profile
3. Add services
4. Add workers
5. Generate QR code
6. Manage appointments

### Worker Flow
1. Register as Worker
2. Get added to salon by owner
3. View assigned appointments
4. Update appointment status

### Client Flow
1. Register as Client
2. Scan salon QR code or browse
3. Select service
4. Choose time slot
5. Book appointment
6. Receive confirmation

## 🌈 Theming

The app uses a purple-based color scheme defined in Tailwind config:

```js
colors: {
  primary: {
    50: '#fef5ff',
    // ... up to 950
  }
}
```

Customize colors in `tailwind.config.js`

## 📱 Responsive Design

The app is fully responsive with breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔔 Notifications

Toast notifications are used throughout the app:

```jsx
import toast from 'react-hot-toast'

toast.success('Success message')
toast.error('Error message')
toast.loading('Loading...')
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` directory.

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Netlify

1. Build the app: `npm run build`
2. Drag and drop `dist` folder to Netlify
3. Configure environment variables

### Custom Server

1. Build: `npm run build`
2. Serve `dist` folder with any static server:
   ```bash
   npm install -g serve
   serve -s dist
   ```

## 🔒 Security Best Practices

- JWT tokens are stored in localStorage
- Axios interceptors handle auth automatically
- Protected routes prevent unauthorized access
- Role-based access control (RBAC)
- Input validation on all forms
- XSS protection through React

## 🐛 Troubleshooting

### API Connection Issues

If you can't connect to the backend:

1. Check backend is running on port 5000
2. Verify VITE_API_URL in `.env`
3. Check CORS settings in backend
4. Inspect network tab in browser DevTools

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

### Hot Reload Not Working

```bash
# Restart dev server
npm run dev
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [React Query](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC

## 👨‍💻 Development Notes

### Phase 2 Status: ✅ Complete

**Completed Features:**
- ✅ Project setup with Vite + React
- ✅ Tailwind CSS configuration
- ✅ Authentication system
- ✅ Protected routes
- ✅ API service layer
- ✅ Reusable UI components
- ✅ Landing and auth pages
- ✅ Owner dashboard (basic)
- ✅ Client dashboard (basic)
- ✅ Worker dashboard (basic)
- ✅ QR code system
- ✅ Responsive layout

**Next Steps (Phase 3 Enhancements):**
- Full booking flow implementation
- Complete service management
- Full appointment management
- Real-time notifications
- Advanced analytics
- Mobile app integration

---

**Built with ❤️ for the beauty industry**

