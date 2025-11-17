import { useState } from 'react';
import { Image as ImageIcon, User, Store, Scissors } from 'lucide-react';

/**
 * SafeImage component that handles broken/missing images gracefully
 * Shows a placeholder when image fails to load
 */
const SafeImage = ({ 
  src, 
  alt = 'Image', 
  className = '', 
  fallbackType = 'default', // 'default', 'user', 'salon', 'service'
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleLoad = () => {
    setImageLoading(false);
  };

  // Get appropriate placeholder based on type
  const getPlaceholder = () => {
    const baseClasses = 'w-full h-full object-cover flex items-center justify-center';
    
    switch (fallbackType) {
      case 'user':
      case 'worker':
        return (
          <div className={`${baseClasses} bg-primary-100`}>
            <User className="text-primary-400" size={32} />
          </div>
        );
      case 'salon':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-primary-100 to-purple-100`}>
            <Store className="text-primary-300" size={32} />
          </div>
        );
      case 'service':
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-primary-100 to-purple-100`}>
            <Scissors className="text-primary-300" size={32} />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            <ImageIcon className="text-gray-400" size={32} />
          </div>
        );
    }
  };

  // If no src or error occurred, show placeholder
  if (!src || imageError) {
    return (
      <div className={className}>
        {getPlaceholder()}
      </div>
    );
  }

  return (
    <>
      {imageLoading && (
        <div className={`${className} bg-gray-100 animate-pulse`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
};

export default SafeImage;

