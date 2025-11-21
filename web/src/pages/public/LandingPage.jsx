import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calendar, Users, TrendingUp, QrCode } from 'lucide-react'
import Button from '../../components/ui/Button'
import ParticlesBackground from '../../components/background/ParticlesBackground'
import Logo from '../../components/ui/Logo'

const LandingPage = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Clients can book appointments with just a few clicks'
    },
    {
      icon: QrCode,
      title: 'QR Code Check-in',
      description: 'Scan QR codes for instant salon access and booking'
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Manage your team and their schedules effortlessly'
    },
    {
      icon: TrendingUp,
      title: 'Business Insights',
      description: 'Track performance and grow your beauty business'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground
        colors={['#667eea', '#764ba2', '#f093fb', '#c471ed', '#f5576c']}
        size={4}
        countDesktop={80}
        countTablet={65}
        countMobile={50}
        zIndex={0}
        height="100%"
      />
      
      {/* Content */}
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="lg" showText={true} linkTo="/" />
            <div className="flex items-center gap-4">
              {user ? (
                <Link to={`/${user.role.toLowerCase()}/dashboard`}>
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="btn-confirm-booking">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Beauty Business
            <span className="block text-primary-600">All in One Place</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete salon management and booking system for barbershops, hair salons, 
            nail studios, and beauty centers. Easy for owners, workers, and clients.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register-salon">
              <Button size="lg" className="btn-confirm-booking">Create Salon Account</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-primary-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Salon?</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of beauty professionals who are already using Xaura 
            to manage their business and delight their clients.
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Xaura. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </div>
  )
}

export default LandingPage

