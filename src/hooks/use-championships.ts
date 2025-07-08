import { useState, useEffect } from 'react';
import { ChampionshipService, Championship } from '../lib/services/championship.service';

export const useChampionships = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChampionships = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ChampionshipService.getAll();
      setChampionships(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar campeonatos');
      console.error('Erro ao buscar campeonatos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChampionships();
  }, []);

  return {
    championships,
    loading,
    error,
    fetchChampionships,
  };
}; 