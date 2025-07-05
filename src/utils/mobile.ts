import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  xl: 1536,
};

export const useBreakpoint = () => {
  const { width } = useScreenSize();
  
  return {
    isMobile: width < breakpoints.mobile,
    isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
    isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
    isXl: width >= breakpoints.desktop,
    width,
  };
};

export class MobileUtils {
  static isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  static isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isTablet() {
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
  }

  static getDeviceType() {
    if (this.isTablet()) return 'tablet';
    if (this.isMobile()) return 'mobile';
    return 'desktop';
  }

  static supportsTouchscreen() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static getViewportHeight() {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  }

  static getViewportWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  }

  static preventDefaultTouchEvents() {
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  static enableScrollLock() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  static disableScrollLock() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
}
