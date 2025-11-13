import React, { useState, useCallback, FormEvent } from 'react';
import { useFormValidation, FormField, FormValidationResult } from '../../utils/validation';
import { ErrorDisplay, SuccessDisplay } from './ErrorBoundary';

interface FormProps<T> {
  fields: FormField[];
  onSubmit: (data: T) => Promise<void> | void;
  initialValues?: Partial<T>;
  className?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function Form<T extends Record<string, any>>({
  fields,
  onSubmit,
  initialValues,
  className = '',
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  showCancelButton = false,
  onSuccess,
  onError,
  loading = false,
  disabled = false,
}: FormProps<T>) {
  const {
    data,
    errors,
    touched,
    isValid,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    resetForm,
    setFieldValue,
  } = useFormValidation(fields);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Initialize form with default values
  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.name] = initialValues?.[field.name] || '';
    });
    Object.keys(initialData).forEach(key => {
      setFieldValue(key, initialData[key]);
    });
  }, [fields, initialValues, setFieldValue]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate form
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      onError?.('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(data as T);
      setSubmitSuccess('Form submitted successfully!');
      onSuccess?.(data as T);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validateForm, onSubmit, onSuccess, onError, resetForm]);

  const handleCancel = useCallback(() => {
    resetForm();
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [resetForm]);

  const getFieldError = (fieldName: string) => {
    return touched[fieldName] ? errors[fieldName] : '';
  };

  const isFieldTouched = (fieldName: string) => {
    return touched[fieldName] || false;
  };

  const renderField = (field: FormField) => {
    const value = data[field.name] || '';
    const error = getFieldError(field.name);
    const isTouched = isFieldTouched(field.name);

    const commonProps = {
      id: field.name,
      name: field.name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        handleFieldChange(field.name, newValue);
      },
      onBlur: () => handleFieldBlur(field.name),
      className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
      } dark:bg-gray-800 dark:text-white`,
      disabled: disabled || loading,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              checked={value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              disabled={disabled || loading}
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.name}-${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  disabled={disabled || loading}
                />
                <label htmlFor={`${field.name}-${option.value}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            {...commonProps}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {submitError && <ErrorDisplay error={submitError} className="mb-4" />}
      {submitSuccess && <SuccessDisplay message={submitSuccess} className="mb-4" />}

      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {getFieldError(field.name) && (
              <ErrorDisplay error={getFieldError(field.name)} className="mt-1" />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          type="submit"
          disabled={disabled || loading || isSubmitting || !isValid}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Submitting...
            </>
          ) : (
            submitButtonText
          )}
        </button>

        {showCancelButton && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={disabled || loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelButtonText}
          </button>
        )}
      </div>
    </form>
  );
}

// Hook for form state management
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setTouchedField = useCallback((name: keyof T, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setIsSubmitting(isSubmitting);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setError,
    clearError,
    clearErrors,
    setTouchedField,
    reset,
    setSubmitting,
  };
}

// Auto-save hook for forms
export function useAutoSave<T extends Record<string, any>>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 3000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveFunction(data);
      setLastSaved(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [data, saveFunction, isSaving]);

  // Auto-save when data changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      save();
    }, delay);

    return () => clearTimeout(timer);
  }, [data, delay, save]);

  return {
    isSaving,
    lastSaved,
    saveError,
    save,
  };
}