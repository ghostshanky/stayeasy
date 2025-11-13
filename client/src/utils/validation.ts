import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  phone: z.string().regex(/^[+]?[1-9]\d{1,14}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  positiveNumber: z.number().positive('Number must be positive'),
  nonNegativeNumber: z.number().min(0, 'Number must be non-negative'),
  integer: z.number().int('Number must be an integer'),
  price: z.number().min(0, 'Price must be non-negative'),
  percentage: z.number().min(0, 'Percentage must be non-negative').max(100, 'Percentage must be less than or equal to 100'),
  fileSize: z.number().min(0, 'File size must be non-negative'),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
};

// Property validation schemas
export const propertySchemas = {
  name: z.string().min(3, 'Property name must be at least 3 characters').max(100, 'Property name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address must be less than 200 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(50, 'City must be less than 50 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(50, 'State must be less than 50 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters').max(50, 'Country must be less than 50 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters').max(20, 'Postal code must be less than 20 characters'),
  price: commonSchemas.price,
  currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be 3 characters'),
  bedrooms: commonSchemas.positiveNumber.int(),
  bathrooms: commonSchemas.positiveNumber.int(),
  maxGuests: commonSchemas.positiveNumber.int(),
  amenities: z.array(z.string()).optional(),
  houseRules: z.array(z.string()).optional(),
  availability: z.array(z.object({
    date: commonSchemas.date,
    available: z.boolean(),
    price: commonSchemas.price.optional(),
  })).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  location: z.object({
    latitude: commonSchemas.latitude,
    longitude: commonSchemas.longitude,
  }),
};

// User validation schemas
export const userSchemas = {
  signup: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    name: commonSchemas.name,
    phone: commonSchemas.phone.optional(),
    role: z.enum(['TENANT', 'OWNER', 'ADMIN']).optional(),
  }),
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
  profile: z.object({
    name: commonSchemas.name,
    phone: commonSchemas.phone.optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    preferences: z.object({
      language: z.string().optional(),
      currency: z.string().optional(),
      notifications: z.object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
        sms: z.boolean().default(false),
      }).optional(),
    }).optional(),
  }),
  passwordReset: z.object({
    email: commonSchemas.email,
    newPassword: commonSchemas.password,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

// Booking validation schemas
export const bookingSchemas = {
  create: z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    checkInDate: commonSchemas.date,
    checkOutDate: commonSchemas.date,
    guests: commonSchemas.positiveNumber.int(),
    totalPrice: commonSchemas.price,
    paymentMethod: z.string().min(1, 'Payment method is required'),
    specialRequests: z.string().max(500, 'Special requests must be less than 500 characters').optional(),
  }).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"],
  }),
  update: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
    checkInDate: commonSchemas.date.optional(),
    checkOutDate: commonSchemas.date.optional(),
    guests: commonSchemas.positiveNumber.int().optional(),
    totalPrice: commonSchemas.price.optional(),
    specialRequests: z.string().max(500, 'Special requests must be less than 500 characters').optional(),
  }),
  review: z.object({
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be less than 1000 characters'),
    cleanliness: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    communication: z.number().min(1).max(5).optional(),
  }),
};

// Payment validation schemas
export const paymentSchemas = {
  create: z.object({
    amount: commonSchemas.price,
    currency: z.string().min(3, 'Currency must be at least 3 characters').max(3, 'Currency must be 3 characters'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    bookingId: z.string().min(1, 'Booking ID is required'),
    description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  }),
  update: z.object({
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
    transactionId: z.string().optional(),
    refundAmount: commonSchemas.price.optional(),
    refundReason: z.string().max(500, 'Refund reason must be less than 500 characters').optional(),
  }),
};

// Message validation schemas
export const messageSchemas = {
  create: z.object({
    recipientId: z.string().min(1, 'Recipient ID is required'),
    content: z.string().min(1, 'Message content is required').max(2000, 'Message must be less than 2000 characters'),
    type: z.enum(['TEXT', 'IMAGE', 'DOCUMENT']).optional(),
    attachments: z.array(z.object({
      type: z.enum(['IMAGE', 'DOCUMENT']),
      url: commonSchemas.url,
      name: z.string().min(1, 'Attachment name is required'),
      size: commonSchemas.fileSize,
    })).optional(),
  }),
  update: z.object({
    content: z.string().min(1, 'Message content is required').max(2000, 'Message must be less than 2000 characters'),
    isRead: z.boolean().optional(),
    isDelivered: z.boolean().optional(),
  }),
};

// File validation schemas
export const fileSchemas = {
  image: z.object({
    file: z.instanceof(File).refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      'Image size must be less than 5MB'
    ).refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
    maxWidth: z.number().optional(),
    maxHeight: z.number().optional(),
    quality: z.number().min(0.1).max(1).optional(),
  }),
  document: z.object({
    file: z.instanceof(File).refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      'Document size must be less than 10MB'
    ).refine(
      (file) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'Only PDF and Word documents are allowed'
    ),
  }),
  avatar: z.object({
    file: z.instanceof(File).refine(
      (file) => file.size <= 2 * 1024 * 1024, // 2MB
      'Avatar size must be less than 2MB'
    ).refine(
      (file) => ['image/jpeg', 'image/png'].includes(file.type),
      'Only JPEG and PNG images are allowed'
    ),
    size: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  }),
};

// Utility validation functions
export const validationUtils = {
  // Validate and parse date
  parseDate: (dateString: string): Date => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date;
  },

  // Validate date range
  validateDateRange: (startDate: string, endDate: string): { isValid: boolean; error?: string } => {
    try {
      const start = validationUtils.parseDate(startDate);
      const end = validationUtils.parseDate(endDate);
      
      if (end <= start) {
        return { isValid: false, error: 'End date must be after start date' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid date format' };
    }
  },

  // Validate phone number with country code
  validatePhoneNumber: (phone: string, countryCode?: string): { isValid: boolean; error?: string } => {
    try {
      const phoneRegex = new RegExp(`^${countryCode || '\\+?[1-9]'}\\d{1,14}$`);
      if (!phoneRegex.test(phone.replace(/[-\\s()]/g, ''))) {
        return { isValid: false, error: 'Invalid phone number format' };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Phone number validation failed' };
    }
  },

  // Validate URL
  validateUrl: (url: string): { isValid: boolean; error?: string } => {
    try {
      new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  },

  // Validate file size
  validateFileSize: (file: File, maxSize: number): { isValid: boolean; error?: string } => {
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }
    return { isValid: true };
  },

  // Validate file type
  validateFileType: (file: File, allowedTypes: string[]): { isValid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: `File type ${file.type} is not allowed` };
    }
    return { isValid: true };
  },

  // Generate validation error messages
  getValidationErrors: (error: z.ZodError): Record<string, string> => {
    const errors: Record<string, string> = {};
    error.issues.forEach((err: any) => {
      if (err.path.length > 0) {
        errors[err.path.join('.')] = err.message;
      }
    });
    return errors;
  },

  // Format validation errors for display
  formatValidationErrors: (errors: Record<string, string>): string => {
    return Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
  },

  // Debounce validation
  debounceValidation: <T>(
    validateFn: (value: T) => Promise<boolean>,
    delay: number = 300
  ): ((value: T) => Promise<boolean>) => {
    let timeoutId: NodeJS.Timeout;
    return async (value: T) => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          const isValid = await validateFn(value);
          resolve(isValid);
        }, delay);
      });
    };
  },

  // Validate form data
  validateForm: async <T>(
    schema: z.ZodType<T>,
    data: T
  ): Promise<{ isValid: boolean; errors?: Record<string, string> }> => {
    try {
      await schema.parseAsync(data);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: validationUtils.getValidationErrors(error),
        };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  },

  // Create a validation schema with custom messages
  createSchemaWithMessages: <T extends z.ZodTypeAny>(
    schema: T,
    messages: Record<string, string>
  ): T => {
    return schema.refine(
      (data) => {
        try {
          schema.parse(data);
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const customErrors = error.issues.map((err: any) => {
              const customMessage = messages[err.path.join('.')] || err.message;
              return {
                ...err,
                message: customMessage,
              };
            });
            throw new z.ZodError(customErrors);
          }
          return false;
        }
      },
      {
        message: 'Custom validation failed',
      }
    ) as T;
  },
};
