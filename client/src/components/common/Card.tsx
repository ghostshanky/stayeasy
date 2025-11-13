import React, { forwardRef } from 'react';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

interface BaseCardProps {
  variant?: CardVariant;
  size?: CardSize;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  className?: string;
}

interface CardProps extends BaseCardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg transition-all duration-200';

const variantClasses: Record<CardVariant, string> = {
  default: 'border border-gray-200 dark:border-gray-700',
  outlined: 'border-2 border-gray-200 dark:border-gray-700',
  elevated: 'shadow-lg hover:shadow-xl',
  filled: 'bg-gray-50 dark:bg-gray-900/50',
};

const sizeClasses: Record<CardSize, string> = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
  xl: 'w-full',
};

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  size = 'md',
  padding = 'md',
  hoverable = false,
  clickable = false,
  loading = false,
  className = '',
  children,
  header,
  footer,
  ...props
}, ref) => {
  const handleClick = () => {
    if (clickable && !loading) {
      const event = new Event('click', { bubbles: true });
      (props as any).onClick?.(event);
    }
  };

  return (
    <div
      ref={ref}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:scale-105 cursor-pointer' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${loading ? 'opacity-75' : ''}
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {header && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {header}
        </div>
      )}

      <div className={loading ? 'opacity-50' : ''}>
        {children}
      </div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

// Card grid component
interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}) => {
  const columnsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div className={`grid ${columnsClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Card list component
interface CardListProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const CardList: React.FC<CardListProps> = ({
  children,
  className = '',
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

// Interactive card component
interface InteractiveCardProps extends CardProps {
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  onClick,
  selected = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <Card
      clickable
      hoverable
      className={`
        ${selected ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={onClick}
      {...(props as any)}
      {...props}
    />
  );
};

// Card with image
interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'aspect-auto',
  };

  return (
    <div className={`overflow-hidden rounded-t-lg ${aspectRatioClasses[aspectRatio]} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
    </div>
  );
};

// Card with stats
interface CardStatsProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const CardStats: React.FC<CardStatsProps> = ({
  title,
  value,
  change,
  icon,
  className = '',
}) => {
  const changeColor = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  const changeIcon = {
    positive: 'arrow_upward',
    negative: 'arrow_downward',
    neutral: 'remove',
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </span>
          {change && (
            <span className={`flex items-center text-sm ${changeColor[change.type]}`}>
              <span className="material-symbols-outlined text-xs mr-1">
                {changeIcon[change.type]}
              </span>
              {Math.abs(change.value)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Card with action
interface CardActionProps extends CardProps {
  action: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
}

export const CardAction: React.FC<CardActionProps> = ({
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <Card className={className} {...props}>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter>
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`
            px-4 py-2 text-sm font-medium rounded-md
            ${
              action.variant === 'primary'
                ? 'bg-primary text-white hover:bg-primary/90'
                : action.variant === 'secondary'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'text-primary hover:bg-gray-100 dark:hover:bg-gray-700'
            }
            ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {action.label}
        </button>
      </CardFooter>
    </Card>
  );
};