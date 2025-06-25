import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SeasonRegistrationForm } from '@/components/season/SeasonRegistrationForm';

export const SeasonRegistration: React.FC = () => {
  const { seasonId, seasonSlug } = useParams<{ 
    seasonId?: string; 
    seasonSlug?: string; 
  }>();
  const navigate = useNavigate();

  // Determina o identificador da temporada (slug ou ID)
  const seasonIdentifier = seasonSlug || seasonId;

  if (!seasonIdentifier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">ID da temporada não fornecido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SeasonRegistrationForm
        seasonId={seasonIdentifier}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}; 