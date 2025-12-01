import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // For now, using pulse as wave animation needs more complex CSS
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Property Card Skeleton
export const PropertyCardSkeleton: React.FC = () => (
  <div className="flex h-full flex-1 flex-col gap-3 rounded-lg min-w-64">
    {/* Image skeleton */}
    <SkeletonLoader className="w-full aspect-[4/3] rounded-lg" />

    {/* Content skeleton */}
    <div className="space-y-2">
      {/* Title and rating skeleton */}
      <div className="flex justify-between items-center">
        <SkeletonLoader className="h-5 w-3/4" />
        <div className="flex items-center gap-1">
          <SkeletonLoader variant="circular" width={16} height={16} />
          <SkeletonLoader className="h-4 w-8" />
        </div>
      </div>

      {/* Location and price skeleton */}
      <SkeletonLoader className="h-4 w-2/3" />
    </div>
  </div>
);

// User Profile Skeleton
export const UserProfileSkeleton: React.FC = () => (
  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm">
    <div className="flex items-center gap-4 mb-4">
      <SkeletonLoader variant="circular" width={56} height={56} />
      <div className="space-y-2">
        <SkeletonLoader className="h-5 w-32" />
        <SkeletonLoader className="h-4 w-24" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-3/4" />
    </div>
  </div>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <SkeletonLoader className="h-6 w-24" />
      <SkeletonLoader variant="circular" width={24} height={24} />
    </div>
    <SkeletonLoader className="h-8 w-16 mb-2" />
    <SkeletonLoader className="h-4 w-32" />
  </div>
);

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
    <SkeletonLoader variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-3 w-1/2" />
    </div>
    <SkeletonLoader className="h-8 w-20" />
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-4 py-3">
        <SkeletonLoader className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Form Skeleton
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-20" />
      <SkeletonLoader className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-24" />
      <SkeletonLoader className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-16" />
      <SkeletonLoader className="h-24 w-full" />
    </div>
    <SkeletonLoader className="h-10 w-32" />
  </div>
);

export default SkeletonLoader;
