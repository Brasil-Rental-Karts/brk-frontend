import { useState, useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";
import { toast } from "sonner";

const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (obj1 && typeof obj1 === 'object' && obj2 && typeof obj2 === 'object') {
    if (obj1.constructor !== obj2.constructor) return false;

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  // Primitives
  return obj1 === obj2;
};

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
    formActions: { setValue: (name: string, value: any) => void }
  ) => void;
  onInitialDataLoaded?: (data: TData) => void;
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
  onInitialDataLoaded,
  initialValues: defaultInitialValues,
  successMessage,
  errorMessage,
}: UseFormScreenOptions<TData, TSubmit>) => {
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
      if (onInitialDataLoaded) {
        onInitialDataLoaded(data);
      }
      const transformedData = transformInitialData ? transformInitialData(data) : (data as Record<string, any>);
      setInitialData(transformedData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setFormInitialized(true), 100);
    }
  }, [id, isEditMode, fetchData, transformInitialData, onInitialDataLoaded, defaultInitialValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkForChanges = useCallback(
    (currentData: any) => {
      if (!initialData || !currentData || !formInitialized) {
        setHasUnsavedChanges(false);
        return;
      }

      const hasChanges = !deepEqual(initialData, currentData);

      setHasUnsavedChanges(hasChanges);
    },
    [initialData, formInitialized]
  );

  const handleFormChange = (data: any) => {
    checkForChanges(data);
  };

  const handleFieldChange = (fieldId: string, value: any, formData: any) => {
    onFieldChange?.(fieldId, value, formData, { setValue: formRef?.setValue });
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