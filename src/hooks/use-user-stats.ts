import { useState, useEffect } from 'react';
import { UserStatsService, type UserBasicStats } from '@/lib/services/user-stats.service';
import { useAuth } from '@/contexts/AuthContext';

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserBasicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userStats = await UserStatsService.getUserBasicStats();
      setStats(userStats);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  return {
    stats,
    loading,
    error,
    refresh: fetchUserStats
  };
}; 