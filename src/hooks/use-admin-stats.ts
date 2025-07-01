import { useState, useEffect } from 'react';
import { AdminStatsService, type AdminStats } from '@/lib/services/admin-stats.service';

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const adminStats = await AdminStatsService.getAdminStats();
      setStats(adminStats);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas administrativas');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchAdminStats
  };
}; 