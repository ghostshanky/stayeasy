import toast, { ToastOptions } from 'react-hot-toast';

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 4000,
      style: {
        background: '#10b981',
        color: '#fff',
      },
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 5000,
      style: {
        background: '#ef4444',
        color: '#fff',
      },
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 4000,
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
      ...options,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#6b7280',
        color: '#fff',
      },
    });
  },

  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },
};

export default showToast;