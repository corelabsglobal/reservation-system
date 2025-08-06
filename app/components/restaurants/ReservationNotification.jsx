'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ReservationNotification({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification || !isVisible) return null;

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-green-900/80',
          border: 'border-green-700',
          icon: <CheckCircleIcon className="h-8 w-8 text-green-400" />,
        };
      case 'error':
        return {
          bg: 'bg-red-900/80',
          border: 'border-red-700',
          icon: <XCircleIcon className="h-8 w-8 text-red-400" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/80',
          border: 'border-yellow-700',
          icon: <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />,
        };
      default:
        return {
          bg: 'bg-gray-900/80',
          border: 'border-gray-700',
          icon: null,
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div className={`fixed right-4 top-20 z-50 max-w-md w-full rounded-lg shadow-xl backdrop-blur-sm ${styles.bg} ${styles.border} border transition-all duration-300 ease-in-out transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-white">
            {notification.title}
          </h3>
          <p className="mt-1 text-sm text-gray-200">
            {notification.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="inline-flex text-gray-400 hover:text-gray-200 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
    </div>
  );
}