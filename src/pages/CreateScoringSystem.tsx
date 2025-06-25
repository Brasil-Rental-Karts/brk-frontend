import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <div className="text-sm text-muted-foreground">Carregando sistema de pontuação...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Sistemas de Pontuação
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Sistema de Pontuação' : 'Novo Sistema de Pontuação'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing 
                ? 'Modifique as configurações do sistema de pontuação'
                : 'Configure um novo sistema de pontuação para o campeonato'
              }
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editar Sistema de Pontuação' : 'Criar Sistema de Pontuação'}
            </CardTitle>
            <CardDescription>
              Configure como os pontos serão distribuídos nas corridas
            </CardDescription>
          </CardHeader>
          <CardContent>
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