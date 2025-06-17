import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { useFormScreen } from '@/hooks/use-form-screen';
import { ChampionshipService, Championship } from "@/lib/services/championship.service";

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

  const {
    isLoading,
    isSaving,
    error,
    initialData,
    onFormReady,
    handleSubmit,
  } = useFormScreen<Championship, { sponsors: any[] }>({
    id: championshipId,
    fetchData: () => ChampionshipService.getById(championshipId),
    updateData: (_id, data) => ChampionshipService.update(championshipId, data),
    transformInitialData: (data) => ({ sponsors: data.sponsors || [] }),
    transformSubmitData: (formData) => ({ sponsors: formData.sponsors || [] }),
    onSuccess: () => {
      // Data is re-fetched automatically by the hook on success, no need to do anything here
    },
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
          submitLabel={isSaving ? "Salvando..." : "Salvar Alterações"}
          showButtons={true}
          className="space-y-6"
          formId="sponsors-form"
          initialValues={initialData}
        />
      )}
    </div>
  );
}; 