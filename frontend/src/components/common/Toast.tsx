import React, { useEffect } from 'react';
import { clearToast, hideToast } from '../../redux/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '../../redux/store';

const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const { message, type, isVisible } = useAppSelector((state) => state.ui.toast);

  useEffect(() => {
    let timeoutId: number | null = null;

    if (isVisible && message) {
      timeoutId = window.setTimeout(() => {
        dispatch(hideToast());

        window.setTimeout(() => {
          dispatch(clearToast());
        }, 300);
      }, 5000);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isVisible, message, dispatch]);

  if (!message || !isVisible) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const handleClose = () => {
    dispatch(hideToast());
    setTimeout(() => {
      dispatch(clearToast());
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white transition-all duration-300 ${getBackgroundColor()} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-2">{getIcon()}</div>
      <div className="ml-3 mr-8 text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 text-white rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-white hover:bg-opacity-20 focus:outline-none"
        onClick={handleClose}
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
