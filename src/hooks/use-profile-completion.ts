import { useEffect, useState } from "react";

import { ProfileService } from "@/lib/services";

export const useProfileCompletion = () => {
  const [isProfileCompleted, setIsProfileCompleted] = useState<boolean | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkProfileCompletion = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await ProfileService.getMemberProfile();
      setIsProfileCompleted(profile?.profileCompleted || false);
    } catch (err: any) {
      setError(err.message || "Erro ao verificar perfil");
      setIsProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowModal = () => {
    // Se o perfil está completo, não mostrar modal
    if (isProfileCompleted === true) {
      return false;
    }

    // Se o perfil não está completo, verificar se o usuário já escolheu pular nesta sessão
    const hasSkippedThisSession = sessionStorage.getItem("profileModalSkipped");
    return !hasSkippedThisSession;
  };

  const markAsSkipped = () => {
    sessionStorage.setItem("profileModalSkipped", "true");
  };

  const clearSkipStatus = () => {
    sessionStorage.removeItem("profileModalSkipped");
  };

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  return {
    isProfileCompleted,
    loading,
    error,
    shouldShowModal: shouldShowModal(),
    markAsSkipped,
    clearSkipStatus,
    refresh: checkProfileCompletion,
  };
};
