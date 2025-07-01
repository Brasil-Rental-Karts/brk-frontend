import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageLoader } from "@/components/ui/loading";
import { ScoringSystem, ScoringSystemData } from "@/lib/services/scoring-system.service";
import { ScoringSystemService } from "@/lib/services/scoring-system.service";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScoringSystemFormStandalone } from "@/components/championship/settings/ScoringSystemFormStandalone";

export const CreateScoringSystem = () => {
  const { championshipId, scoringSystemId } = useParams<{ championshipId: string; scoringSystemId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const isEditing = !!scoringSystemId;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem | null>(null);

  // Carregar dados do sistema de pontuação se estiver editando
  useEffect(() => {
    const loadScoringSystem = async () => {
      if (!scoringSystemId || !championshipId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await ScoringSystemService.getById(scoringSystemId, championshipId);
        setScoringSystem(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar sistema de pontuação');
        toast.error('Erro ao carregar sistema de pontuação');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      loadScoringSystem();
    }
  }, [scoringSystemId, championshipId, isEditing]);

  const handleSave = async (formData: ScoringSystemData) => {
    if (!championshipId) return;

    try {
      setSaving(true);
      setError(null);

      if (isEditing && scoringSystem) {
        await ScoringSystemService.update(scoringSystem.id, championshipId, formData);
        toast.success('Sistema de pontuação atualizado com sucesso!');
      } else {
        await ScoringSystemService.create(championshipId, formData);
        toast.success('Sistema de pontuação criado com sucesso!');
      }

      // Voltar para a aba de sistemas de pontuação
      navigate(`/championship/${championshipId}?tab=scoring-systems`);
    } catch (err: any) {
      const message = err.message || 'Erro ao salvar sistema de pontuação';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (championshipId) {
      navigate(`/championship/${championshipId}?tab=scoring-systems`);
    }
  };

  if (loading) {
    return (
      <PageLoader message="Carregando sistema de pontuação..." />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Criar Sistema de Pontuação</h1>
          <p className="text-muted-foreground">
            Configure como os pontos serão distribuídos nas etapas do campeonato
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-6">
            <ScoringSystemFormStandalone
              initialData={scoringSystem}
              onSubmit={handleSave}
              onCancel={handleCancel}
              loading={saving}
              championshipId={championshipId || ''}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 