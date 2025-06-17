import { useState, useEffect, useCallback } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface UseFormScreenOptions<TData, TSubmit> {
  id?: string;
  fetchData?: (id: string) => Promise<TData>;
  createData?: (data: TSubmit) => Promise<any>;
  updateData?: (id: string, data: TSubmit) => Promise<any>;
  transformInitialData?: (data: TData) => Record<string, any>;
  transformSubmitData?: (formData: Record<string, any>) => TSubmit;
  onSuccess: (result: any) => void;
  onCancel: () => void;
  onFieldChange?: (
    fieldId: string,
    value: any,
    formData: any,
    formRef: any
  ) => void;
  initialValues?: Record<string, any>;
  successMessage?: string;
  errorMessage?: string;
  submitLabel?: string;
}

export const useFormScreen = <TData, TSubmit>({
  id,
  fetchData,
  createData,
  updateData,
  transformInitialData,
  transformSubmitData,
  onSuccess,
  onCancel,
  onFieldChange,
  initialValues: defaultInitialValues,
  successMessage,
  errorMessage,
}: UseFormScreenOptions<TData, TSubmit>) => {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<Record<string, any> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formRef, setFormRef] = useState<any>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);

  const isEditMode = !!id;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      !isSaving &&
      !isProceeding &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedChangesDialog(true);
    }
  }, [blocker]);
  
  useEffect(() => {
    if (isProceeding) {
      if (blocker.state === 'blocked') {
        blocker.proceed();
      } else {
        onCancel();
      }
    }
  }, [isProceeding, blocker, onCancel]);


  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
      setFormInitialized(false);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue =
          "Você tem alterações não salvas. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    };

    if (hasUnsavedChanges && !isSaving) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isSaving]);

  const loadData = useCallback(async () => {
    if (!isEditMode || !fetchData) {
      setInitialData(defaultInitialValues || {});
      setIsLoading(false);
      setTimeout(() => setFormInitialized(true), 100);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchData(id);
      const transformedData = transformInitialData ? transformInitialData(data) : (data as Record<string, any>);
      setInitialData(transformedData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setFormInitialized(true), 100);
    }
  }, [id, isEditMode, fetchData, transformInitialData, defaultInitialValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkForChanges = useCallback(
    (currentData: any) => {
      if (!initialData || !currentData || !formInitialized) {
        setHasUnsavedChanges(false);
        return;
      }

      const hasChanges = Object.keys(initialData).some((key) => {
        const initialValue = initialData[key];
        const currentValue = currentData[key];

        if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
          return (
            JSON.stringify(initialValue.sort()) !==
            JSON.stringify(currentValue.sort())
          );
        }

        const normalizeValue = (val: any) => {
          if (val === null || val === undefined || val === "") return "";
          return val.toString();
        };

        return normalizeValue(initialValue) !== normalizeValue(currentValue);
      });

      setHasUnsavedChanges(hasChanges);
    },
    [initialData, formInitialized]
  );

  const handleFormChange = (data: any) => {
    checkForChanges(data);
  };

  const handleFieldChange = (fieldId: string, value: any, formData: any) => {
    onFieldChange?.(fieldId, value, formData, formRef);
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      const firstErrorElement = document.querySelector(
        '[data-invalid="true"], .text-destructive, [aria-invalid="true"]'
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  const handleSubmit = async (formData: any) => {
    if (formRef) {
      const formState = formRef.formState;
      if (formState.errors && Object.keys(formState.errors).length > 0) {
        scrollToFirstError();
        return;
      }
    }

    setError(null);
    setIsSaving(true);
    setHasUnsavedChanges(false);

    try {
      const processedData = transformSubmitData
        ? transformSubmitData(formData)
        : formData;
      let result;
      if (isEditMode && updateData) {
        result = await updateData(id, processedData);
      } else if (!isEditMode && createData) {
        result = await createData(processedData);
      }

      toast.success(
        successMessage || "Dados salvos com sucesso!"
      );
      onSuccess(result);
    } catch (err: any) {
      const message =
        err.message || errorMessage || "Erro ao salvar. Tente novamente.";
      setError(message);
      toast.error(message);
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAttemptCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmUnsavedChanges = () => {
    setShowUnsavedChangesDialog(false);
    setIsProceeding(true);
  };

  const handleCancelUnsavedChanges = () => {
    setShowUnsavedChangesDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setIsProceeding(false);
  };

  const onFormReady = (ref: any) => {
    setFormRef(ref);
  };

  return {
    isLoading,
    isSaving,
    error,
    initialData,
    formRef,
    hasUnsavedChanges,
    showUnsavedChangesDialog,
    onFormReady,
    handleFormChange,
    handleFieldChange,
    handleSubmit,
    handleCancel: handleAttemptCancel,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
    isEditMode,
  };
}; 