import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useState } from 'react'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64 pt-16 pb-20 lg:pb-6">
        {/* pt-16: top padding for navbar (64px) */}
        {/* pb-20: bottom padding for mobile nav (80px) on mobile */}
        {/* lg:pb-6: normal bottom padding on desktop */}
        <main className="py-4 px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation - Only shows on mobile */}
      <MobileBottomNav />
    </div>
  )
}

export default MainLayout

