
import { UserStatus } from '@/types/database';

interface OnlineStatusIndicatorProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const OnlineStatusIndicator = ({ 
  status, 
  size = 'md', 
  showText = false 
}: OnlineStatusIndicatorProps) => {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-medical-green-light';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'En ligne';
      case 'away':
        return 'Absent';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Hors ligne';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'md':
        return 'w-3 h-3';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <div
        className={`${getSizeClasses(size)} ${getStatusColor(status)} rounded-full border border-white`}
        title={getStatusText(status)}
      />
      {showText && (
        <span className="text-xs text-gray-600">
          {getStatusText(status)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusIndicator;
