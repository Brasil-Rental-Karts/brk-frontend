import { useState } from "react";

import {
  CreateCreditCardFeesData,
  CreditCardFees,
  CreditCardFeesRate,
  CreditCardFeesService,
  UpdateCreditCardFeesData,
} from "../lib/services/credit-card-fees.service";

const creditCardFeesService = new CreditCardFeesService();

export const useCreditCardFees = () => {
  const [fees, setFees] = useState<CreditCardFees[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creditCardFeesService.findAll();
      setFees(data);
    } catch (err) {
      setError("Erro ao carregar taxas do cartão de crédito");
      console.error("Erro ao buscar taxas:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeesByChampionship = async (championshipId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data =
        await creditCardFeesService.findByChampionshipId(championshipId);
      setFees(data);
    } catch (err) {
      setError("Erro ao carregar taxas do campeonato");
      console.error("Erro ao buscar taxas do campeonato:", err);
    } finally {
      setLoading(false);
    }
  };

  const createFee = async (data: CreateCreditCardFeesData) => {
    setLoading(true);
    setError(null);
    try {
      const newFee = await creditCardFeesService.create(data);
      setFees((prev) => [...prev, newFee]);
      return newFee;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Erro ao criar taxa";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFee = async (id: string, data: UpdateCreditCardFeesData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedFee = await creditCardFeesService.update(id, data);
      setFees((prev) => prev.map((fee) => (fee.id === id ? updatedFee : fee)));
      return updatedFee;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao atualizar taxa";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteFee = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await creditCardFeesService.delete(id);
      setFees((prev) => prev.filter((fee) => fee.id !== id));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao deletar taxa";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRateForInstallments = async (
    championshipId: string,
    installments: number,
  ): Promise<CreditCardFeesRate> => {
    try {
      return await creditCardFeesService.getRateForInstallments(
        championshipId,
        installments,
      );
    } catch (err) {
      console.error("Erro ao buscar taxa para parcelas:", err);
      throw err;
    }
  };

  return {
    fees,
    loading,
    error,
    fetchFees,
    fetchFeesByChampionship,
    createFee,
    updateFee,
    deleteFee,
    getRateForInstallments,
  };
};
