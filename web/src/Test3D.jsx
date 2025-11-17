import ThreeDImageRing from './components/ui/ThreeDImageRing'

export default function Test3D() {
  const images = [
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461212/flower.png",
    "https://res.cloudinary.com/demo/image/upload/v1312461217/woman.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461219/mountain.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461223/desert.jpg"
  ]

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div style={{ width: '600px', height: '600px', position: 'relative' }}>
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

