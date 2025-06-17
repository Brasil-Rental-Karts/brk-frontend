import React from "react";
import {
  DynamicForm,
  FormSectionConfig,
} from "@/components/ui/dynamic-form";
import { Button } from "brk-design-system";
import { Alert, AlertTitle, AlertDescription } from "brk-design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { PageHeader } from "@/components/ui/page-header";
import {
  useFormScreen,
  UseFormScreenOptions,
} from "@/hooks/use-form-screen";

interface FormScreenProps<TData, TSubmit>
  extends UseFormScreenOptions<TData, TSubmit> {
  title: string;
  formConfig: FormSectionConfig[];
  formId: string;
}

export const FormScreen = <TData, TSubmit>({
  title,
  formConfig,
  formId,
  ...options
}: FormScreenProps<TData, TSubmit>) => {
  const {
    isLoading,
    isSaving,
    error,
    initialData,
    showUnsavedChangesDialog,
    onFormReady,
    handleFormChange,
    handleFieldChange,
    handleSubmit,
    handleCancel,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    isEditMode,
  } = useFormScreen(options);

  const submitLabel = isEditMode
    ? options.submitLabel || "Salvar Alterações"
    : options.submitLabel || "Salvar";
  const savingLabel = isSaving
    ? isEditMode
      ? "Salvando..."
      : "Salvando..."
    : submitLabel;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={title}
        actions={[
          {
            label: "Cancelar",
            onClick: handleCancel,
            variant: "outline",
            disabled: isSaving,
          },
          {
            label: isSaving ? savingLabel : submitLabel,
            onClick: () => {
              const form = document.getElementById(formId) as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            },
            variant: "default",
            disabled: isSaving,
          },
        ]}
      />

      <div className="w-full px-6 mb-4">
        {error && (
          <Alert variant="destructive" dismissible onClose={() => {}}>
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="w-full px-6" id={`${formId}-container`}>
        {initialData && (
          <DynamicForm
            config={formConfig}
            onSubmit={handleSubmit}
            onChange={handleFormChange}
            onFieldChange={handleFieldChange}
            onFormReady={onFormReady}
            submitLabel={isSaving ? savingLabel : submitLabel}
            cancelLabel="Cancelar"
            showButtons={false}
            className="space-y-6"
            formId={formId}
            initialValues={initialData}
          />
        )}
      </div>

      <Dialog
        open={showUnsavedChangesDialog}
        onOpenChange={handleCancelUnsavedChanges}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações não salvas</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair sem
              salvar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelUnsavedChanges}>
              Continuar editando
            </Button>
            <Button variant="destructive" onClick={handleConfirmUnsavedChanges}>
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 