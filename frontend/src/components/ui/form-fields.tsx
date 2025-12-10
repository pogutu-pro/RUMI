import * as React from 'react';
import {
  useFormContext,
  type FieldValues,
  type FieldPath,
} from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils/cn';

interface FieldWrapperProps {
  name: string;
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component for labels, descriptions, errors, with accessibility and layout.
 */
function FieldWrapper({
  name,
  label,
  description,
  error,
  children,
  className,
}: FieldWrapperProps) {
  const fieldId = name;
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-gray-700 flex items-center gap-1"
        >
          {label}
          {/* Required asterisk could be added here if needed */}
        </label>
      )}
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': error
          ? errorId
          : description
            ? descriptionId
            : undefined,
      })}
      {!error && description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

interface InputFieldProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'name' | 'id'> {
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
}

/**
 * Text input component connected to RHF that forwards refs and integrates accessibility.
 */
const InputField = React.forwardRef(
  <TFieldValues extends FieldValues>(
    { name, label, description, ...props }: InputFieldProps<TFieldValues>,
    ref: React.Ref<HTMLInputElement>,
  ) => {
    const {
      register,
      formState: { errors },
    } = useFormContext<TFieldValues>();

    const errorMessage = errors[name]?.message as string | undefined;

    return (
      <FieldWrapper
        name={name as string}
        label={label}
        description={description}
        error={errorMessage}
      >
        <Input
          {...register(name)}
          ref={ref}
          {...props}
          className={cn(
            'h-11 transition-colors',
            errorMessage
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'border-gray-300 focus:border-gray-500',
            props.className,
          )}
        />
      </FieldWrapper>
    );
  },
);

InputField.displayName = 'InputField';

interface FormFieldProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label?: string;
  error?: string;
  description?: string;
  hint?: string; // Alias for description
}

/**
 * Simple form field component with label and error display.
 * Used with react-hook-form's register function.
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, description, hint, className, id, ...props }, ref) => {
    const fieldId = id || React.useId();
    const errorId = error ? `${fieldId}-error` : undefined;
    const fieldDescription = description || hint;
    const descriptionId = fieldDescription
      ? `${fieldId}-description`
      : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-foreground flex items-center gap-1"
          >
            {label}
            {props.required && <span className="text-destructive">*</span>}
          </label>
        )}
        <Input
          ref={ref}
          id={fieldId}
          error={!!error}
          className={className}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : fieldDescription ? descriptionId : undefined
          }
          {...props}
        />
        {!error && fieldDescription && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {fieldDescription}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = 'FormField';

interface PasswordFieldProps extends Omit<FormFieldProps, 'type'> {
  showStrength?: boolean;
  minLength?: number;
}

/**
 * Password input field component with optional strength indicator.
 */
const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label,
      error,
      description,
      showStrength = false,
      minLength,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const fieldId = id || React.useId();
    const errorId = error ? `${fieldId}-error` : undefined;
    const descriptionId = description ? `${fieldId}-description` : undefined;

    const passwordInput = (
      <PasswordInput
        ref={ref}
        id={fieldId}
        showStrength={showStrength}
        minLength={minLength}
        error={!!error}
        className={className}
        aria-invalid={!!error}
        aria-describedby={
          error ? errorId : description ? descriptionId : undefined
        }
        {...props}
      />
    );

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-foreground flex items-center gap-1"
          >
            {label}
            {props.required && <span className="text-destructive">*</span>}
          </label>
        )}
        {passwordInput}
        {!error && description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordField.displayName = 'PasswordField';

export { FieldWrapper, InputField, FormField, PasswordField };
