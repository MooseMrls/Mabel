import React, { createContext, useContext, useState, useCallback } from 'react';
import { IconCheck, IconX, IconAlertTriangle, IconInfo } from './Icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300); // matches animation exit time
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      if (!message) return;
      const id = Date.now() + Math.random().toString(36).substring(2, 7);
      setToasts((prev) => [...prev, { id, message, type, removing: false }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const showError = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const showWarning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const showInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <div className="toast-container top-right" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.removing ? 'toast-exit' : 'toast-enter'}`}
            role="alert"
          >
            <div className="toast-icon">
              {t.type === 'success' && <IconCheck />}
              {t.type === 'error' && <IconX />}
              {t.type === 'warning' && <IconAlertTriangle />}
              {t.type === 'info' && <IconInfo />}
            </div>
            <div className="toast-message">{t.message}</div>
            <button
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
