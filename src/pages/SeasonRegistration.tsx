import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/ui/page-header';
import { SeasonRegistrationForm } from '@/components/season/SeasonRegistrationForm';

export const SeasonRegistration: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();

  if (!seasonId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">ID da temporada não encontrado</p>
        </div>
      </div>
    );
  }

  const handleSuccess = (registrationId: string) => {
    navigate(`/registration/${registrationId}/payment`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Nova Inscrição"
        subtitle="Complete os dados para finalizar sua inscrição na temporada"
        actions={[
          {
            label: "Voltar",
            onClick: handleCancel,
            variant: "outline"
          }
        ]}
      />
      
      <div className="w-full max-w-4xl mx-auto px-6 py-6">
        <SeasonRegistrationForm
          seasonId={seasonId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}; 