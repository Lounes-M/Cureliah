import { NavigateFunction } from 'react-router-dom';

export const getDashboardRoute = (userType?: 'doctor' | 'establishment' | 'admin'): string => {
  switch (userType) {
    case 'doctor':
      return '/doctor/dashboard';
    case 'establishment':
      return '/establishment/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/dashboard';
  }
};

export const redirectToDashboard = (navigate: NavigateFunction, userType?: 'doctor' | 'establishment' | 'admin') => {
  navigate(getDashboardRoute(userType));
};

export const navigateToVacationSearch = (navigate: NavigateFunction, date?: string) => {
  const path = date ? `/vacation-search?date=${encodeURIComponent(date)}` : '/vacation-search';
  navigate(path);
};
