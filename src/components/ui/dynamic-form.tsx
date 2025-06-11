import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "brk-design-system";
import { Input } from "brk-design-system";
import { Button } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "brk-design-system";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "brk-design-system";
import { InputMask } from "@/components/ui/input-mask";
import { MaskType } from "@/utils/masks";
import { SponsorListField } from "@/components/ui/sponsor-list-field";
import { FileUpload } from "@/components/ui/file-upload";

// Types for form configuration
export interface FormFieldOption {
  value: string | number;
  description: string;
}

export interface FormFieldConfig {
  name: string;
  id: string;
  type: "input" | "textarea" | "select" | "checkbox" | "inputMask" | "checkbox-group" | "sponsor-list" | "file";
  max_char?: number;
  mandatory?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  options?: FormFieldOption[];
  mask?: MaskType;
  placeholder?: string;
  conditionalField?: {
    dependsOn: string;
    showWhen: any;
  };
  inline?: boolean;
  inlineGroup?: string;
  customValidation?: {
    validate: (value: string, formData: any) => boolean;
    errorMessage: string;
  };
  // File upload specific options
  accept?: string;
  maxSize?: number;
  showPreview?: boolean;
}

export interface FormSectionConfig {
  section: string;
  detail: string;
  fields: FormFieldConfig[];
}

export interface DynamicFormProps {
  config: FormSectionConfig[];
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  onChange?: (data: any) => void;
  onFieldChange?: (fieldId: string, value: any, formData: any) => void;
  onFormReady?: (formRef: any) => void;
  submitLabel?: string;
  cancelLabel?: string;
  showButtons?: boolean;
  initialValues?: Record<string, any>;
  className?: string;
  formId?: string;
}

// Helper function to create Zod schema from config
const createZodSchema = (config: FormSectionConfig[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  config.forEach((section) => {
    section.fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case "input":
        case "textarea":
        case "inputMask":
          fieldSchema = z.string();
          if (field.max_char) {
            fieldSchema = (fieldSchema as z.ZodString).max(field.max_char, `Máximo ${field.max_char} caracteres`);
          }
          break;
        case "select":
          if (field.options) {
            const values = field.options.map(opt => opt.value);
            fieldSchema = z.union([z.string(), z.number()]).refine(
              (val) => values.includes(val),
              "Selecione uma opção válida"
            );
          } else {
            fieldSchema = z.string();
          }
          break;
        case "checkbox":
          fieldSchema = z.boolean();
          break;
        case "checkbox-group":
          fieldSchema = z.array(z.union([z.string(), z.number()]));
          break;
        case "sponsor-list":
          fieldSchema = z.array(z.object({
            id: z.string().optional(),
            name: z.string(),
            logoImage: z.string(),
            website: z.string().optional()
          }));
          break;
        case "file":
          fieldSchema = z.string();
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.mandatory && field.type !== "checkbox" && field.type !== "checkbox-group") {
        if (fieldSchema instanceof z.ZodString) {
          fieldSchema = fieldSchema.min(1, `${field.name} é obrigatório`);
        } else {
          fieldSchema = z.string().min(1, `${field.name} é obrigatório`);
        }
      }

      // Make all fields optional initially, we'll handle validation in the submit
      if (field.type === "checkbox") {
        schemaFields[field.id] = z.boolean().optional();
      } else if (field.type === "checkbox-group") {
        schemaFields[field.id] = z.array(z.union([z.string(), z.number()])).optional();
      } else if (field.type === "sponsor-list") {
        schemaFields[field.id] = z.array(z.object({
          id: z.string().optional(),
          name: z.string(),
          logoImage: z.string(),
          website: z.string().optional()
        })).optional();
      } else {
        schemaFields[field.id] = z.string().optional();
      }
    });
  });

  return z.object(schemaFields);
};

// Helper function to validate visible fields only
const validateVisibleFields = (data: any, config: FormSectionConfig[]) => {
  const errors: Record<string, string> = {};

  config.forEach((section) => {
    section.fields.forEach((field) => {
      // Check if field should be visible
      const shouldShow = !field.conditionalField || 
        data[field.conditionalField.dependsOn] === field.conditionalField.showWhen;

      if (shouldShow && field.mandatory) {
        const value = data[field.id];
        
        if (field.type === "checkbox-group") {
          // For checkbox-group, check if array is empty
          if (!value || !Array.isArray(value) || value.length === 0) {
            errors[field.id] = `${field.name} é obrigatório`;
          }
        } else if (field.type !== "checkbox") {
          // For other fields except checkbox, check if empty
          if (!value || (typeof value === "string" && value.trim() === "")) {
            errors[field.id] = `${field.name} é obrigatório`;
          }
        }
      }

      // Validate max_char for visible fields
      if (shouldShow && field.max_char && data[field.id]) {
        const value = data[field.id];
        if (typeof value === "string" && value.length > field.max_char) {
          errors[field.id] = `Máximo ${field.max_char} caracteres`;
        }
      }

      // Custom validation for visible fields
      if (shouldShow && field.customValidation && data[field.id]) {
        const value = data[field.id];
        if (typeof value === "string" && value.trim() !== "") {
          const isValid = field.customValidation.validate(value, data);
          if (!isValid) {
            errors[field.id] = field.customValidation.errorMessage;
          }
        }
      }
    });
  });

  return errors;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSubmit,
  onCancel,
  onChange,
  onFieldChange,
  onFormReady,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  showButtons = true,
  initialValues = {},
  className = "",
  formId,
}) => {
  // Create default values from config
  const defaultValues = React.useMemo(() => {
    const defaults: Record<string, any> = {};
    config.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === "checkbox") {
          defaults[field.id] = false;
        } else if (field.type === "checkbox-group") {
          defaults[field.id] = [];
        } else if (field.type === "sponsor-list") {
          defaults[field.id] = [];
        } else if (field.type === "file") {
          defaults[field.id] = "";
        } else {
          defaults[field.id] = "";
        }
      });
    });
    return { ...defaults, ...initialValues };
  }, [config, initialValues]);

  const schema = React.useMemo(() => createZodSchema(config), [config]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Expose form reference when ready
  useEffect(() => {
    if (onFormReady) {
      onFormReady(form);
    }
  }, [form, onFormReady]);

  // Watch all form values for conditional fields
  const watchedValues = form.watch();
  const previousValuesRef = React.useRef<Record<string, any>>({});

  // Call onChange callback when form values change
  useEffect(() => {
    if (onChange) {
      onChange(watchedValues);
    }

    // Call onFieldChange for specific field changes
    if (onFieldChange) {
      Object.keys(watchedValues).forEach(fieldId => {
        if (watchedValues[fieldId] !== previousValuesRef.current[fieldId]) {
          onFieldChange(fieldId, watchedValues[fieldId], watchedValues);
        }
      });
    }

    previousValuesRef.current = watchedValues;
  }, [watchedValues, onChange, onFieldChange]);

  // Helper function to check if field should be shown
  const shouldShowField = (field: FormFieldConfig): boolean => {
    if (!field.conditionalField) return true;
    
    const { dependsOn, showWhen } = field.conditionalField;
    const dependentValue = watchedValues[dependsOn];
    
    return dependentValue === showWhen;
  };

  const handleSubmit = (data: any) => {
    // Validate only visible fields
    const validationErrors = validateVisibleFields(data, config);
    
    if (Object.keys(validationErrors).length > 0) {
      // Set errors in the form
      Object.entries(validationErrors).forEach(([fieldId, message]) => {
        form.setError(fieldId as any, { message });
      });
      
      // Scroll to first error after a short delay to ensure DOM is updated
      setTimeout(() => {
        const firstErrorElement = document.querySelector('[data-invalid="true"], .text-destructive, [aria-invalid="true"]');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      return;
    }

    onSubmit(data);
  };

  const renderField = (field: FormFieldConfig) => {
    if (!shouldShowField(field)) return null;

    // Dynamic properties based on other field values
    let dynamicMask = field.mask;
    let dynamicPlaceholder = field.placeholder;
    let dynamicName = field.name;

    // Special handling for document field
    if (field.id === "document") {
      const personType = watchedValues.personType || "0";
      if (personType === "0") {
        dynamicMask = "cpf";
        dynamicPlaceholder = "000.000.000-00";
        dynamicName = "CPF";
      } else if (personType === "1") {
        dynamicMask = "cnpj";
        dynamicPlaceholder = "00.000.000/0000-00";
        dynamicName = "CNPJ";
      }
    }

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.id}
        render={({ field: formField, fieldState }) => (
          <FormItem className={field.inline ? "flex-1" : ""}>
            <FormLabel>
              {dynamicName}
              {field.mandatory && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                const hasError = !!fieldState.error;
                const commonProps = {
                  'aria-invalid': hasError,
                  'data-invalid': hasError,
                  readOnly: field.readonly,
                  disabled: field.disabled,
                };

                switch (field.type) {
                  case "input":
                    return (
                      <Input
                        {...formField}
                        {...commonProps}
                        value={formField.value || ""}
                        placeholder={dynamicPlaceholder}
                        maxLength={field.max_char}
                      />
                    );
                  
                  case "inputMask":
                    return (
                      <InputMask
                        {...commonProps}
                        mask={dynamicMask!}
                        value={formField.value || ""}
                        onChange={formField.onChange}
                        placeholder={dynamicPlaceholder}
                      />
                    );
                  
                  case "textarea":
                    return (
                      <textarea
                        {...formField}
                        {...commonProps}
                        value={formField.value || ""}
                        placeholder={dynamicPlaceholder}
                        maxLength={field.max_char}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    );
                  
                  case "select":
                    return (
                      <Select
                        onValueChange={formField.onChange}
                        value={formField.value || ""}
                        disabled={field.disabled}
                      >
                        <SelectTrigger {...commonProps}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value.toString()}
                            >
                              {option.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  
                  case "checkbox":
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={!!formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={field.disabled}
                          aria-invalid={hasError}
                          data-invalid={hasError}
                        />
                        <span className="text-sm">{field.name}</span>
                      </div>
                    );
                  
                  case "checkbox-group":
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-col space-y-2">
                          {field.options?.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                checked={Array.isArray(formField.value) && formField.value.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  const currentValue = Array.isArray(formField.value) ? formField.value : [];
                                  const newValue = checked
                                    ? [...currentValue, option.value]
                                    : currentValue.filter((val) => val !== option.value);
                                  formField.onChange(newValue);
                                }}
                                disabled={field.disabled}
                                aria-invalid={hasError}
                                data-invalid={hasError}
                              />
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {option.description}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  
                  case "sponsor-list":
                    return (
                      <SponsorListField
                        {...commonProps}
                        value={formField.value || []}
                        onChange={formField.onChange}
                      />
                    );
                  
                  case "file":
                    return (
                      <FileUpload
                        {...commonProps}
                        value={formField.value}
                        onChange={formField.onChange}
                        accept={field.accept}
                        maxSize={field.maxSize}
                        showPreview={field.showPreview}
                      />
                    );
                  
                  default:
                    return <Input {...formField} {...commonProps} value={formField.value || ""} />;
                }
              })()}
            </FormControl>
            {field.max_char && (field.type === "input" || field.type === "textarea") && (
              <div className="text-xs text-muted-foreground text-right">
                {(formField.value?.length || 0)}/{field.max_char}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  // Group fields by inline groups
  const groupFields = (fields: FormFieldConfig[]) => {
    const groups: { [key: string]: FormFieldConfig[] } = {};
    const standalone: FormFieldConfig[] = [];

    fields.forEach(field => {
      if (field.inline && field.inlineGroup) {
        if (!groups[field.inlineGroup]) {
          groups[field.inlineGroup] = [];
        }
        groups[field.inlineGroup].push(field);
      } else {
        standalone.push(field);
      }
    });

    return { groups, standalone };
  };

  const renderFieldsWithGroups = (fields: FormFieldConfig[]) => {
    const { groups } = groupFields(fields);
    const result: React.ReactNode[] = [];

    // Render standalone fields and inline groups in order
    fields.forEach((field) => {
      if (field.inline && field.inlineGroup) {
        // Check if this is the first field of an inline group
        const groupFields = groups[field.inlineGroup];
        const isFirstInGroup = groupFields[0].id === field.id;
        
        if (isFirstInGroup) {
          result.push(
            <div key={`group-${field.inlineGroup}`} className="flex gap-4">
              {groupFields.map(renderField)}
            </div>
          );
        }
      } else {
        result.push(renderField(field));
      }
    });

    return result;
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form 
          id={formId}
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="space-y-6"
        >
          {config.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="w-full">
              <CardHeader>
                <CardTitle>{section.section}</CardTitle>
                <CardDescription>{section.detail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderFieldsWithGroups(section.fields)}
              </CardContent>
            </Card>
          ))}
          
          {showButtons && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-4 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              )}
              <Button type="submit">{submitLabel}</Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}; 