import { useEffect, useState } from 'react';

// Accessibility utilities and ARIA helpers

export const generateAriaLabel = (context: string, action?: string, state?: string): string => {
  let label = context;
  if (action) label += `, ${action}`;
  if (state) label += `, ${state}`;
  return label;
};

export const generateAriaDescribedBy = (elementId: string, suffixes: string[]): string => {
  return suffixes.map(suffix => `${elementId}-${suffix}`).join(' ');
};

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  const focusableElements = Array.from(
    element.querySelectorAll(focusableSelectors)
  ) as HTMLElement[];

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

export const useKeyboardNavigation = (
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) => {
  const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
    const { key } = event;
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      items[nextIndex]?.focus();
    }
  };

  return handleKeyDown;
};

export const createSkipLink = (targetId: string, text: string): HTMLAnchorElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-2';
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return skipLink;
};

export const useRole = (role: string) => {
  return {
    role,
    'aria-label': generateAriaLabel(role),
  };
};

export const useLiveRegion = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  useEffect(() => {
    if (message) {
      announceToScreenReader(message, priority);
    }
  }, [message, priority]);
};

// High contrast mode detection
export const useHighContrastMode = (): boolean => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
