import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { AlertTriangle } from "lucide-react";
import { DynamicForm, FormSectionConfig } from "@/components/ui/dynamic-form";
import { useFormScreen } from '@/hooks/use-form-screen';
import { Championship } from "@/lib/services/championship.service";
import { Button } from "brk-design-system";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Loading } from '@/components/ui/loading';
import { useChampionshipData } from '@/contexts/ChampionshipContext';
import { ChampionshipService } from '@/lib/services/championship.service';

interface SponsorsTabProps {
  championshipId: string;
}

export const SponsorsTab = ({ championshipId }: SponsorsTabProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar o contexto de dados do campeonato
  const { getChampionshipInfo, updateSponsors } = useChampionshipData();

  const formConfig: FormSectionConfig[] = [
    {
      section: "Patrocinadores e Apoiadores",
      detail: "Gerenciar patrocinadores e apoiadores do campeonato",
      fields: [
        {
          id: "sponsors",
          name: "Lista de patrocinadores e apoiadores",
          type: "sponsor-list" as const,
          mandatory: false,
          placeholder: "Adicione patrocinadores e apoiadores ao seu campeonato"
        }
      ]
    }
  ];

  const fetchData = useCallback(() => {
    // Usar dados do contexto em vez de buscar do backend
    const championshipInfo = getChampionshipInfo();
    if (!championshipInfo) {
      throw new Error('Dados do campeonato não encontrados');
    }
    return Promise.resolve(championshipInfo);
  }, [getChampionshipInfo]);

  const saveSponsors = useCallback(async (sponsors: any[]) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Buscar dados atualizados do backend
      const updatedChampionship = await ChampionshipService.update(championshipId, { sponsors });
      
      // Atualizar o contexto com os novos dados
      updateSponsors(sponsors);
      
      toast.success("Patrocinadores e apoiadores salvos com sucesso!");
    } catch (err: any) {
      const message = err.message || "Erro ao salvar patrocinadores e apoiadores";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [championshipId, updateSponsors]);

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
        <Loading type="spinner" size="sm" message="Carregando patrocinadores e apoiadores..." />
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
          <h2 className="text-2xl font-bold">Patrocinadores e Apoiadores</h2>
          <p className="text-muted-foreground">
            Gerencie os patrocinadores e apoiadores do seu campeonato
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