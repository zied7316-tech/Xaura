import { useState, useEffect } from 'react'
import ThreeDImageRing from './components/ui/ThreeDImageRing'

export default function Test3D() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    console.log('✅ Test3D component mounted')
  }, [])

  const images = [
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461212/flower.png",
    "https://res.cloudinary.com/demo/image/upload/v1312461217/woman.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461219/mountain.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461223/desert.jpg"
  ]

  console.log('🎯 Test3D rendering:', { images, imagesCount: images.length, mounted })

  if (!mounted) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div style={{ width: '600px', height: '600px', position: 'relative', border: '2px solid red' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, color: 'white', zIndex: 9999 }}>
          Test Container (600x600)
        </div>
        <ThreeDImageRing
          images={images}
          width={340}
          imageDistance={600}
          perspective={2000}
          draggable={true}
          containerClassName="w-full h-full"
        />
      </div>
    </div>
  )
}

