import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { useFormScreen } from '@/hooks/use-form-screen';
import { ChampionshipService, Championship } from "@/lib/services/championship.service";
import { Button } from "brk-design-system";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface SponsorsTabProps {
  championshipId: string;
}

export const SponsorsTab = ({ championshipId }: SponsorsTabProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const saveSponsors = useCallback(async (sponsors: any[]) => {
    setIsSaving(true);
    setError(null);
    
    try {
      await ChampionshipService.update(championshipId, { sponsors });
      toast.success("Patrocinador salvo com sucesso!");
    } catch (err: any) {
      const message = err.message || "Erro ao salvar patrocinador";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [championshipId]);

  const transformInitialData = useCallback((data: Championship) => ({
    sponsors: data.sponsors || []
  }), []);

  const {
    isLoading,
    initialData,
    onFormReady,
  } = useFormScreen<Championship, { sponsors: any[] }>({
    id: championshipId,
    fetchData: fetchData,
    transformInitialData: transformInitialData,
    onSuccess: () => {},
    onCancel: () => {},
  });

  // Função que será passada para o SponsorListField para salvar automaticamente
  const handleSponsorsChange = useCallback((sponsors: any[]) => {
    // Verificar se os dados realmente mudaram para evitar salvamento desnecessário
    const currentSponsors = initialData?.sponsors || [];
    const hasChanged = JSON.stringify(currentSponsors) !== JSON.stringify(sponsors);
    
    if (hasChanged) {
      saveSponsors(sponsors);
    }
  }, [saveSponsors, initialData?.sponsors]);

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
        {isSaving && (
          <div className="text-sm text-muted-foreground">
            Salvando...
          </div>
        )}
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
          onSubmit={() => {}}
          onFormReady={onFormReady}
          showButtons={false}
          className="space-y-6"
          formId="sponsors-form"
          initialValues={initialData}
          onFieldChange={(fieldId, value) => {
            if (fieldId === 'sponsors') {
              handleSponsorsChange(value);
            }
          }}
        />
      )}
    </div>
  );
}; 