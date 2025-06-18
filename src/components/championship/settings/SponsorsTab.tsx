import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { useFormScreen } from '@/hooks/use-form-screen';
import { ChampionshipService, Championship } from "@/lib/services/championship.service";
import { Button } from "brk-design-system";
import { useCallback } from "react";

interface SponsorsTabProps {
  championshipId: string;
}

export const SponsorsTab = ({ championshipId }: SponsorsTabProps) => {
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

  const fetchData = useCallback(() => {
    return ChampionshipService.getById(championshipId);
  }, [championshipId]);

  const updateData = useCallback((_id: string, data: { sponsors: any[] }) => {
    return ChampionshipService.update(championshipId, data);
  }, [championshipId]);

  const transformInitialData = useCallback((data: Championship) => ({
    sponsors: data.sponsors || []
  }), []);

  const transformSubmitData = useCallback((formData: Record<string, any>) => ({
    sponsors: formData.sponsors || []
  }), []);

  const onSuccess = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const {
    isLoading,
    isSaving,
    error,
    initialData,
    onFormReady,
    handleSubmit,
  } = useFormScreen<Championship, { sponsors: any[] }>({
    id: championshipId,
    fetchData: fetchData,
    updateData: updateData,
    transformInitialData: transformInitialData,
    transformSubmitData: transformSubmitData,
    onSuccess: onSuccess,
    onCancel: () => {}, // Not used in this tab-based form
    successMessage: "Patrocinadores atualizados com sucesso!",
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Carregando patrocinadores...</div>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patrocinadores</h2>
          <p className="text-muted-foreground">
            Gerencie os patrocinadores do seu campeonato
          </p>
        </div>
        <Button
          type="submit"
          form="sponsors-form"
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {initialData && (
        <DynamicForm
          config={formConfig}
          onSubmit={handleSubmit}
          onFormReady={onFormReady}
          showButtons={false}
          className="space-y-6"
          formId="sponsors-form"
          initialValues={initialData}
        />
      )}

      <div className="flex justify-end pt-4 mt-4 border-t">
        <Button
          type="submit"
          form="sponsors-form"
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}; 