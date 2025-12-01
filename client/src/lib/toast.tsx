import toast, { ToastOptions } from 'react-hot-toast';

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 4000,
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      position: 'top-right',
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 5000,
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      position: 'top-right',
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 4000,
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      position: 'top-right',
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 4000,
      style: {
        background: '#f59e0b',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      position: 'top-right',
      ...options,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#6b7280',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      position: 'top-right',
    });
  },

  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },

  // Custom toast with action button
  action: (message: string, action: { label: string; onClick: () => void }, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <div className={`p-4 rounded-lg shadow-lg ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <div className="flex items-center justify-between">
            <span className="text-white">{message}</span>
            <button
              onClick={() => {
                action.onClick();
                toast.dismiss(t.id);
              }}
              className="ml-4 px-3 py-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors"
            >
              {action.label}
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: '#6b7280',
          borderRadius: '8px',
          padding: '16px',
        },
        position: 'top-right',
        ...options,
      }
    );
  },
};

export default showToast;
