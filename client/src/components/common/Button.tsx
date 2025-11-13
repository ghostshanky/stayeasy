import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

interface ButtonProps extends BaseButtonProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface IconButtonProps extends BaseButtonProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  shape?: 'circle' | 'square';
}

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
  secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
  ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
  link: 'bg-transparent text-primary hover:text-primary/80 hover:underline focus:ring-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const shapeClasses = {
  circle: 'rounded-full',
  square: 'rounded',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="animate-spin mr-2">⏳</span>
      )}
      
      {leftIcon && !loading && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      {children}
      
      {rightIcon && !loading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  shape = 'circle',
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  return (
    <button
      ref={ref}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${shapeClasses[shape]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : children ? (
        children
      ) : (
        <>
          {leftIcon && <span className="mr-1">{leftIcon}</span>}
          {rightIcon && <span className="ml-1">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

// Group component for button groups
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  spacing = 'md',
  orientation = 'horizontal',
}) => {
  const spacingClasses = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3',
  };

  const orientationClasses = {
    horizontal: 'flex',
    vertical: 'flex-col',
  };

  return (
    <div className={`
      ${orientationClasses[orientation]}
      ${spacingClasses[spacing]}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Split button component
interface SplitButtonProps extends BaseButtonProps {
  children: React.ReactNode;
  dropdownItems: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
  }>;
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  dropdownItems,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-flex">
      <Button
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        fullWidth={fullWidth}
        leftIcon={leftIcon}
        rightIcon={
          <span className="material-symbols-outlined text-sm">
            expand_more
          </span>
        }
        className={className}
        {...props}
      >
        {children}
      </Button>
      
      <div className="relative">
        <IconButton
          variant="ghost"
          size={size}
          disabled={disabled || loading}
          onClick={() => setIsOpen(!isOpen)}
          className="ml-1"
        >
          <span className="material-symbols-outlined text-sm">
            expand_more
          </span>
        </IconButton>
        
        {isOpen && (
          <div className="absolute right-0 z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {dropdownItems.map((item, index) => (
              <button
                key={index}
                className={`w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${item.className || ''}`}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Floating action button
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  className = '',
  size = 'md',
  position = 'bottom-right',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]}
        ${sizeClasses[size]}
        bg-primary text-white rounded-full shadow-lg hover:bg-primary/90
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        transition-all duration-200 hover:scale-105
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

// Toolbar component
interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const Toolbar: React.FC<ToolbarProps> = ({
  children,
  className = '',
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3',
  };

  return (
    <div className={`flex items-center ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

// Pagination button
interface PaginationButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

export const PaginationButton: React.FC<PaginationButtonProps> = ({
  children,
  onClick,
  disabled = false,
  active = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-2 text-sm font-medium rounded-md
        ${active
          ? 'bg-primary text-white'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};