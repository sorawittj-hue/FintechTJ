/**
 * Form Validation Hooks
 * 
 * Provides React Hook Form integration with Zod validation
 * for type-safe form handling.
 */

import type React from 'react';
import { useForm, type UseFormProps, type UseFormReturn, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';

// ============================================================================
// Types
// ============================================================================

interface UseValidatedFormProps<T extends Record<string, unknown>> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Create a form with Zod validation
 * 
 * @example
 * ```tsx
 * const { form, errors, handleSubmit } = useValidatedForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' },
 * });
 * ```
 */
export function useValidatedForm<T extends Record<string, unknown>>(
  props: UseValidatedFormProps<T>
): UseFormReturn<T> & {
  errors: Record<keyof T, string | undefined>;
  hasErrors: boolean;
} {
  const { schema, validateOnChange = true, validateOnBlur = true, ...formProps } = props;

  const form = useForm<T>({
    ...formProps,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    mode: validateOnChange ? 'onChange' : validateOnBlur ? 'onBlur' : 'onSubmit',
    criteriaMode: 'all',
  });

  // Create a map of field errors
  const rawErrors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const errors = Object.keys(rawErrors).reduce(
    (acc, key) => {
      acc[key as keyof T] = rawErrors[key]?.message;
      return acc;
    },
    {} as Record<keyof T, string | undefined>
  );

  return {
    ...form,
    errors,
    hasErrors: Object.keys(form.formState.errors).length > 0,
  } as UseFormReturn<T> & { errors: Record<keyof T, string | undefined>; hasErrors: boolean };
}

// ============================================================================
// Form State Helpers
// ============================================================================

/**
 * Get form field props for easier integration
 */
export function getFieldProps<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  fieldName: keyof T
) {
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  return {
    ...form.register(fieldName as Path<T>),
    error: errors[fieldName as string]?.message,
    isInvalid: !!errors[fieldName as string],
  };
}

/**
 * Reset form with new default values
 */
export function resetFormWithDefaults<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  defaults: Partial<T>
) {
  form.reset(defaults as T);
}

// ============================================================================
// Validation Status Helpers
// ============================================================================

/**
 * Get validation status for a field
 */
export function getFieldStatus<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  fieldName: keyof T
): 'idle' | 'validating' | 'valid' | 'invalid' {
  const { isSubmitting } = form.formState;
  const errors = form.formState.errors as Record<string, unknown>;
  const dirtyFields = form.formState.dirtyFields as Record<string, unknown>;
  const key = fieldName as string;

  if (isSubmitting) return 'validating';
  if (errors[key]) return 'invalid';
  if (dirtyFields[key]) return 'valid';
  return 'idle';
}

/**
 * Check if field has been touched and is valid
 */
export function isFieldValid<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  fieldName: keyof T
): boolean {
  const errors = form.formState.errors as Record<string, unknown>;
  const dirtyFields = form.formState.dirtyFields as Record<string, unknown>;
  const key = fieldName as string;
  return !errors[key] && !!dirtyFields[key];
}

/**
 * Get all touched field names
 */
export function getTouchedFields<T extends Record<string, unknown>>(
  form: UseFormReturn<T>
): (keyof T)[] {
  return Object.keys(form.formState.dirtyFields) as (keyof T)[];
}

/**
 * Check if form is ready to submit
 */
export function isFormReady<T extends Record<string, unknown>>(
  form: UseFormReturn<T>
): boolean {
  const { isValid, isDirty, isSubmitting } = form.formState;
  return isValid && isDirty && !isSubmitting;
}

// ============================================================================
// Debounced Validation
// ============================================================================

import { useCallback, useRef } from 'react';

/**
 * Create a debounced validation function
 */
export function useDebouncedValidation<T>(
  schema: ZodSchema<T>,
  delay: number = 300
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = useCallback(
    async (data: unknown): Promise<{ success: boolean; data?: T; errors?: string[] }> => {
      return new Promise((resolve) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          const result = schema.safeParse(data);
          if (result.success) {
            resolve({ success: true, data: result.data });
          } else {
            resolve({
              success: false,
              errors: result.error.issues.map((issue) => issue.message),
            });
          }
        }, delay);
      });
    },
    [schema, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { validate, cancel };
}

// ============================================================================
// Field-Level Validation
// ============================================================================

/**
 * Create a field validator for real-time validation
 */
export function createFieldValidator<T>(
  schema: ZodSchema<T>,
  fieldName: keyof T
) {
  return async (value: unknown): Promise<string | true> => {
    // Create a test object with just this field
    const testData = { [fieldName]: value } as unknown as T;
    const result = schema.safeParse(testData);
    
    if (result.success) {
      return true;
    }
    
    const fieldError = result.error.issues.find(
      (issue) => issue.path[0] === fieldName
    );
    
    return fieldError?.message || 'Invalid value';
  };
}

// ============================================================================
// Form Submission Helpers
// ============================================================================

/**
 * Safe form submission with error handling
 */
export async function safeSubmit<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  onSubmit: (data: T) => Promise<void> | void,
  onError?: (errors: Record<string, string>) => void
): Promise<void> {
  try {
    const submit = form.handleSubmit(async (data) => {
      await onSubmit(data);
    });
    // handleSubmit returns a function that takes an event; pass undefined for programmatic invocation
    await submit(undefined as unknown as React.BaseSyntheticEvent);
  } catch (error) {
    console.error('Form submission error:', error);
    if (onError && error instanceof Error) {
      onError({ _form: error.message });
    }
  }
}

/**
 * Submit form with confirmation
 */
export async function submitWithConfirmation<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  onSubmit: (data: T) => Promise<void> | void,
  message: string = 'Are you sure?'
): Promise<void> {
  const confirmed = window.confirm(message);
  if (!confirmed) return;
  
  await safeSubmit(form, onSubmit);
}
