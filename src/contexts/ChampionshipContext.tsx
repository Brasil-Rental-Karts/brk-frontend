import React, { createContext, useContext, useState, useCallback } from 'react';
import { Championship } from '@/lib/services/championship.service';

interface ChampionshipContextType {
  championshipsOrganized: Championship[];
  setChampionshipsOrganized: (championships: Championship[]) => void;
  addChampionship: (championship: Championship) => void;
  updateChampionship: (id: string, championship: Partial<Championship>) => void;
  removeChampionship: (id: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ChampionshipContext = createContext<ChampionshipContextType | undefined>(undefined);

export const useChampionshipContext = () => {
  const context = useContext(ChampionshipContext);
  if (!context) {
    throw new Error('useChampionshipContext must be used within a ChampionshipProvider');
  }
  return context;
};

interface ChampionshipProviderProps {
  children: React.ReactNode;
}

export const ChampionshipProvider: React.FC<ChampionshipProviderProps> = ({ children }) => {
  const [championshipsOrganized, setChampionshipsOrganized] = useState<Championship[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const addChampionship = useCallback((championship: Championship) => {
    setChampionshipsOrganized(prev => [championship, ...prev]);
  }, []);

  const updateChampionship = useCallback((id: string, updatedChampionship: Partial<Championship>) => {
    setChampionshipsOrganized(prev => 
      prev.map(championship => 
        championship.id === id 
          ? { ...championship, ...updatedChampionship }
          : championship
      )
    );
  }, []);

  const removeChampionship = useCallback((id: string) => {
    setChampionshipsOrganized(prev => 
      prev.filter(championship => championship.id !== id)
    );
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value: ChampionshipContextType = {
    championshipsOrganized,
    setChampionshipsOrganized,
    addChampionship,
    updateChampionship,
    removeChampionship,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <ChampionshipContext.Provider value={value}>
      {children}
    </ChampionshipContext.Provider>
  );
}; 