import { useState, useEffect } from 'react';
import { AdminStatsService, AdminStats, PreloadUsersResult } from '@/lib/services/admin-stats.service';

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
      setError(err.message || 'Erro ao carregar estatísticas');
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
      setError(err.message || 'Erro ao fazer preload dos usuários');
    } finally {
      setLoading(false);
    }
  };

  return { preloadUsers, loading, error, result };
}; 