import { useEffect, useState } from "react";

import {
  AdminStats,
  AdminStatsService,
  PreloadCategoriesResult,
  PreloadUsersResult,
} from "@/lib/services/admin-stats.service";

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminStatsService.getAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refresh = () => {
    fetchStats();
  };

  return { stats, loading, error, refresh };
};

export const usePreloadUsersCache = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreloadUsersResult | null>(null);

  const preloadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminStatsService.preloadUsersCache();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer preload dos usuários");
    } finally {
      setLoading(false);
    }
  };

  return { preloadUsers, loading, error, result };
};

export const useUpdateCategoriesCache = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreloadCategoriesResult | null>(null);

  const updateCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminStatsService.updateCategoriesCache();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar cache das categorias");
    } finally {
      setLoading(false);
    }
  };

  return { updateCategories, loading, error, result };
};
