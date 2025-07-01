import { useCallback } from 'react';

interface UseExternalNavigationOptions {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  showUnsavedChangesDialog: boolean;
  setShowUnsavedChangesDialog: (show: boolean) => void;
}

export const useExternalNavigation = ({
  hasUnsavedChanges,
  isSaving,
  showUnsavedChangesDialog,
  setShowUnsavedChangesDialog,
}: UseExternalNavigationOptions) => {
  const navigateToExternal = useCallback((url: string) => {
    if (hasUnsavedChanges && !isSaving) {
      setShowUnsavedChangesDialog(true);
      // Armazenar a URL para navegar depois da confirmação
      sessionStorage.setItem('pendingExternalNavigation', url);
    } else {
      window.location.href = url;
    }
  }, [hasUnsavedChanges, isSaving, setShowUnsavedChangesDialog]);

  const confirmAndNavigate = useCallback(() => {
    const pendingUrl = sessionStorage.getItem('pendingExternalNavigation');
    if (pendingUrl) {
      sessionStorage.removeItem('pendingExternalNavigation');
      window.location.href = pendingUrl;
    }
  }, []);

  return {
    navigateToExternal,
    confirmAndNavigate,
  };
};
