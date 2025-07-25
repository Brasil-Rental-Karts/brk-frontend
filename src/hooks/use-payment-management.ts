import { useState } from "react";
import { toast } from "sonner";

import {
  OverduePayment,
  PaymentManagementService,
  ReactivatePaymentResponse,
} from "@/lib/services/payment-management.service";

export const usePaymentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllOverduePayments = async (): Promise<OverduePayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const payments = await PaymentManagementService.getAllOverduePayments();
      return payments;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar pagamentos vencidos";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOverduePayments = async (
    registrationId: string,
  ): Promise<OverduePayment[]> => {
    setLoading(true);
    setError(null);

    try {
      const payments =
        await PaymentManagementService.getOverduePayments(registrationId);
      return payments;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar pagamentos vencidos";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactivateOverduePayment = async (
    paymentId: string,
    newDueDate: string,
  ): Promise<ReactivatePaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await PaymentManagementService.reactivateOverduePayment(
        paymentId,
        newDueDate,
      );
      toast.success("Fatura reativada com sucesso!");
      return result;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao reativar fatura";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAllOverduePayments,
    getOverduePayments,
    reactivateOverduePayment,
  };
};
