import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll vers le haut à chaque changement de route
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Animation fluide
    });
  }, [pathname]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default ScrollToTop;