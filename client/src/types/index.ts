export type UserRole = 'TENANT' | 'OWNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image_id?: string;
  bio?: string;
  mobile?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type PropertyStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE' | 'UNAVAILABLE';

export interface Property {
  id: string;
  name: string;
  location: string;
  price: string;
  priceValue: number;
  rating: number;
  imageUrl: string;
  status: PropertyStatus;
  details: string;
  amenities: string[];
  images?: string[];
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string | number;
  name: string;
  details: string;
  imageUrl: string;
  location: string;
  status: ListingStatus;
  rating?: number;
  price?: string;
  priceValue?: number;
  amenities?: string[];
  propertyType?: PropertyType;
}

export type PropertyType = 'PG' | 'HOSTEL' | 'APARTMENT' | 'HOUSE' | 'SHARED_ROOM';

// Booking types
export interface Booking {
  id: string;
  tenant_id: string;
  owner_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  properties?: {
    id: string;
    title: string;
    location: string;
    images?: string[];
    price?: number;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'FAILED' | 'AWAITING_VERIFICATION';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'AWAITING_PAYMENT' | 'AWAITING_OWNER_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'PAID';

// Page types
export type Page = 'landing' | 'searchResults' | 'propertyDetails' | 'confirmAndPay' | 'ownerDashboard' | 'tenantDashboard' | 'adminDashboard' | 'login' | 'signup' | 'paymentVerification' | 'myListings' | 'bookings' | 'payments' | 'messages' | 'settings' | 'ownerSettings' | 'adminSettings' | 'ownerBookings' | 'ownerPayments' | 'ownerMessages';

// Enum types
export enum ListingStatus {
  Listed = 'Listed',
  Unlisted = 'Unlisted',
}

export enum StatChangeDirection {
  Increase = 'increase',
  Decrease = 'decrease',
  Neutral = 'neutral',
}

// UI Component types
export interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeDirection?: StatChangeDirection;
  changeColorClass?: string;
  icon?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupForm {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  confirmPassword?: string;
}

export interface PropertyForm {
  name: string;
  location: string;
  price: number;
  description: string;
  amenities: string[];
  propertyType: PropertyType;
  images?: File[];
}

export interface BookingForm {
  property_id: string;
  check_in: string;
  check_out: string;
  guest_count: number;
}

// Search types
export interface SearchFilters {
  query?: string;
  stayType?: PropertyType;
  priceRange?: [number, number];
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  sortBy?: 'price' | 'rating' | 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Error types
export interface ApiError {
  response?: {
    data?: {
      message: string;
      code?: string;
      details?: any;
    };
    status: number;
    statusText?: string;
  };
  message: string;
  code?: string;
  stack?: string;
  isAxiosError?: boolean;
  config?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Dark mode context
export interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavigationItem[];
  requiredRoles?: UserRole[];
}

// Theme types
export interface ThemeConfig {
  primary: string;
  secondary: string;
  background: {
    light: string;
    dark: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  border: {
    light: string;
    dark: string;
  };
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// File upload types
export interface FileUpload {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
}

// Chart types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// Filter types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API types
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

// Modal types
export interface ModalConfig {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Toast types
export interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

// Local storage types
export interface StorageConfig {
  prefix: string;
  expire?: number;
}

// Cache types
export interface CacheConfig {
  ttl: number;
  maxSize: number;
  expires?: number;
}

// Performance types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// Feature flags
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  conditions?: Record<string, any>;
}

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_BASE_URL: string;
}

// Config types
export interface AppConfig {
  app: {
    name: string;
    version: string;
    description: string;
  };
  api: ApiConfig;
  theme: ThemeConfig;
  features: Record<string, FeatureFlag>;
  environment: Environment;
}