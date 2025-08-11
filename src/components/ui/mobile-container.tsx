import React from 'react';
import { cn } from '@/lib/utils';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className,
  size = 'lg'
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl'
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8 w-full',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

export default MobileContainer;
