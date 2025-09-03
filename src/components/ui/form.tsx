// src/components/ui/form.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

// Form Context
interface FormContextValue {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldError: (field: string, error: string) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  clearFieldError: (field: string) => void;
}

const FormContext = React.createContext<FormContextValue | undefined>(
  undefined
);

export function useFormContext() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error("Form components must be used within a Form");
  }
  return context;
}

// Form Provider Component
interface FormProviderProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}

export function Form({
  children,
  onSubmit,
  className,
  errors = {},
  touched = {},
}: FormProviderProps) {
  const [formErrors, setFormErrors] =
    React.useState<Record<string, string>>(errors);
  const [formTouched, setFormTouched] =
    React.useState<Record<string, boolean>>(touched);

  const setFieldError = React.useCallback((field: string, error: string) => {
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = React.useCallback(
    (field: string, touched: boolean) => {
      setFormTouched((prev) => ({ ...prev, [field]: touched }));
    },
    []
  );

  const clearFieldError = React.useCallback((field: string) => {
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const contextValue = React.useMemo(
    () => ({
      errors: formErrors,
      touched: formTouched,
      setFieldError,
      setFieldTouched,
      clearFieldError,
    }),
    [formErrors, formTouched, setFieldError, setFieldTouched, clearFieldError]
  );

  // Update errors when prop changes
  React.useEffect(() => {
    setFormErrors(errors);
  }, [errors]);

  React.useEffect(() => {
    setFormTouched(touched);
  }, [touched]);

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Form Field Component
interface FormFieldProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ name, children, className }: FormFieldProps) {
  const { errors, touched } = useFormContext();
  const hasError = errors[name] && touched[name];

  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {hasError && <FormMessage type="error">{errors[name]}</FormMessage>}
    </div>
  );
}

// Form Label Component
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FormLabel({
  children,
  required,
  className,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn("text-sm font-medium text-gray-700", className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

// Form Input Component
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
}

export function FormInput({
  name,
  className,
  onBlur,
  onChange,
  ...props
}: FormInputProps) {
  const { errors, touched, setFieldTouched, clearFieldError } =
    useFormContext();
  const hasError = errors[name] && touched[name];

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFieldTouched(name, true);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors[name]) {
      clearFieldError(name);
    }
    onChange?.(e);
  };

  return (
    <input
      name={name}
      className={cn(
        "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
        hasError && "border-red-300 focus-visible:ring-red-500",
        className
      )}
      onBlur={handleBlur}
      onChange={handleChange}
      aria-invalid={hasError ? true : undefined}
      aria-describedby={hasError ? `${name}-error` : undefined}
      {...props}
    />
  );
}

// Form Textarea Component
interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
}

export function FormTextarea({
  name,
  className,
  onBlur,
  onChange,
  ...props
}: FormTextareaProps) {
  const { errors, touched, setFieldTouched, clearFieldError } =
    useFormContext();
  const hasError = errors[name] && touched[name];

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setFieldTouched(name, true);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (errors[name]) {
      clearFieldError(name);
    }
    onChange?.(e);
  };

  return (
    <textarea
      name={name}
      className={cn(
        "flex min-h-20 w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
        hasError && "border-red-300 focus-visible:ring-red-500",
        className
      )}
      onBlur={handleBlur}
      onChange={handleChange}
      aria-invalid={hasError ? true : undefined}
      aria-describedby={hasError ? `${name}-error` : undefined}
      {...props}
    />
  );
}

// Form Select Component
interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
}

export function FormSelect({
  name,
  className,
  onBlur,
  onChange,
  children,
  ...props
}: FormSelectProps) {
  const { errors, touched, setFieldTouched, clearFieldError } =
    useFormContext();
  const hasError = errors[name] && touched[name];

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setFieldTouched(name, true);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (errors[name]) {
      clearFieldError(name);
    }
    onChange?.(e);
  };

  return (
    <select
      name={name}
      className={cn(
        "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
        hasError && "border-red-300 focus-visible:ring-red-500",
        className
      )}
      onBlur={handleBlur}
      onChange={handleChange}
      aria-invalid={hasError ? true : undefined}
      aria-describedby={hasError ? `${name}-error` : undefined}
      {...props}
    >
      {children}
    </select>
  );
}

// Form Message Component
interface FormMessageProps {
  children: React.ReactNode;
  type?: "error" | "success" | "info";
  className?: string;
}

export function FormMessage({
  children,
  type = "error",
  className,
}: FormMessageProps) {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const styles = {
    error: "text-red-600",
    success: "text-green-600",
    info: "text-blue-600",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn("flex items-center gap-2 text-sm", styles[type], className)}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// Form Description Component
export function FormDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-gray-500", className)} {...props}>
      {children}
    </p>
  );
}

// Usage example:
/*
function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    type: 'personal'
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Form onSubmit={handleSubmit} errors={errors} touched={touched}>
      <FormField name="name">
        <FormLabel htmlFor="name" required>Name</FormLabel>
        <FormInput
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter your name"
        />
        <FormDescription>This will be displayed publicly</FormDescription>
      </FormField>

      <FormField name="email">
        <FormLabel htmlFor="email" required>Email</FormLabel>
        <FormInput
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </FormField>

      <FormField name="description">
        <FormLabel htmlFor="description">Description</FormLabel>
        <FormTextarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description..."
        />
      </FormField>

      <FormField name="type">
        <FormLabel htmlFor="type">Type</FormLabel>
        <FormSelect
          id="type"
          name="type"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </FormSelect>
      </FormField>

      <Button type="submit">Submit</Button>
    </Form>
  );
}
*/
