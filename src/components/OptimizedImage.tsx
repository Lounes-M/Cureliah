import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
}

interface ImageFormat {
  src: string;
  type: string;
}

// Image optimization utility
export const generateOptimizedSources = (src: string, width?: number, quality = 80): ImageFormat[] => {
  const baseUrl = src.split('.')[0];
  const formats: ImageFormat[] = [];

  // WebP format (modern browsers)
  formats.push({
    src: `${baseUrl}${width ? `_${width}w` : ''}.webp`,
    type: 'image/webp'
  });

  // AVIF format (cutting edge browsers)
  formats.push({
    src: `${baseUrl}${width ? `_${width}w` : ''}.avif`,
    type: 'image/avif'
  });

  // Fallback to original format
  formats.push({
    src: src,
    type: `image/${src.split('.').pop()}`
  });

  return formats;
};

// Check if WebP is supported
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Check if AVIF is supported
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isIntersecting] as const;
};

// Progressive image component with WebP/AVIF support
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  priority = false,
  placeholder = 'empty',
  onLoad,
  onError,
}) => {
  const [imageRef, isVisible] = useIntersectionObserver();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<{ webp: boolean; avif: boolean }>({
    webp: false,
    avif: false,
  });

  // Check format support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const [webpSupported, avifSupported] = await Promise.all([
        supportsWebP(),
        supportsAVIF(),
      ]);
      
      setSupportedFormats({
        webp: webpSupported,
        avif: avifSupported,
      });
    };

    checkSupport();
  }, []);

  // Generate optimized sources
  const sources = generateOptimizedSources(src, width, quality);
  
  // Filter sources based on browser support
  const filteredSources = sources.filter(source => {
    if (source.type === 'image/webp') return supportedFormats.webp;
    if (source.type === 'image/avif') return supportedFormats.avif;
    return true;
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const shouldLoad = priority || isVisible;

  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* Optimized image with multiple sources */}
      {shouldLoad && !hasError && (
        <picture>
          {filteredSources.slice(0, -1).map((source, index) => (
            <source
              key={index}
              srcSet={source.src}
              type={source.type}
            />
          ))}
          <img
            src={filteredSources[filteredSources.length - 1].src}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-400"
          style={{ width, height }}
        >
          <span className="text-sm">Image failed to load</span>
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && shouldLoad && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-50"
          style={{ width, height }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

// Hook for responsive images
export const useResponsiveImage = (baseSrc: string, breakpoints = [640, 768, 1024, 1280]) => {
  const [currentSrc, setCurrentSrc] = useState(baseSrc);

  useEffect(() => {
    const updateImage = () => {
      const width = window.innerWidth;
      let selectedBreakpoint = breakpoints[0];

      for (const breakpoint of breakpoints) {
        if (width >= breakpoint) {
          selectedBreakpoint = breakpoint;
        }
      }

      const optimizedSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/, `_${selectedBreakpoint}w.$1`);
      setCurrentSrc(optimizedSrc);
    };

    updateImage();
    window.addEventListener('resize', updateImage);

    return () => window.removeEventListener('resize', updateImage);
  }, [baseSrc, breakpoints]);

  return currentSrc;
};

// Image preloader utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch image preloader
export const preloadImages = async (sources: string[]): Promise<void> => {
  try {
    await Promise.all(sources.map(preloadImage));
    console.log('All images preloaded successfully');
  } catch (error) {
    console.error('Some images failed to preload:', error);
  }
};

// Image compression utility (client-side)
export const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve!, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

export default OptimizedImage;
