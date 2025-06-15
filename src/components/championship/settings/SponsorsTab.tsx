import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { Button } from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { Championship, ChampionshipService } from "@/lib/services/championship.service";

interface SponsorsTabProps {
  championshipId: string;
}

export const SponsorsTab = ({ championshipId }: SponsorsTabProps) => {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Carregar dados do campeonato
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const championshipData = await ChampionshipService.getById(championshipId);
      setChampionship(championshipData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [championshipId]);

  const handleSubmit = async (data: any) => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        sponsors: data.sponsors || []
      };

      await ChampionshipService.update(championshipId, updateData);
      
      setSuccess('Patrocinadores atualizados com sucesso!');
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
      
      // Recarregar dados
      await loadData();
    } catch (err) {
      console.error('Erro ao atualizar patrocinadores:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações');
    } finally {
      setIsUpdating(false);
    }
  };

  // Configuração do formulário
  const formConfig: FormSectionConfig[] = [
    {
      section: "Patrocinadores",
      detail: "Gerenciar patrocinadores do campeonato",
      fields: [
        {
          id: "sponsors",
          name: "Lista de patrocinadores",
          type: "sponsor-list" as const,
          mandatory: false,
          placeholder: "Adicione patrocinadores ao seu campeonato"
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Carregando patrocinadores...</div>
      </div>
    );
  }

  if (error && !championship) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!championship) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Campeonato não encontrado</AlertTitle>
          <AlertDescription>Não foi possível carregar os dados do campeonato.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Preparar valores iniciais do formulário
  const initialValues = {
    sponsors: championship.sponsors || []
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patrocinadores</h2>
          <p className="text-muted-foreground">
            Gerencie os patrocinadores do seu campeonato
          </p>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <Alert>
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <DynamicForm
        config={formConfig}
        onSubmit={handleSubmit}
        submitLabel={isUpdating ? "Salvando..." : "Salvar Alterações"}
        showButtons={true}
        className="space-y-6"
        formId="sponsors-form"
        initialValues={initialValues}
      />
    </div>
  );
}; 