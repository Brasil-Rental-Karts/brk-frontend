import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageLoader } from "@/components/ui/loading";
import { GridType, GridTypeEnum } from "@/lib/types/grid-type";
import { GridTypeService } from "@/lib/services/grid-type.service";
import { GridTypeForm } from "@/components/championship/settings/GridTypeForm";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { GridTypeFormStandalone } from "@/components/championship/settings/GridTypeFormStandalone";

export const CreateGridType = () => {
  const { championshipId, gridTypeId } = useParams<{ championshipId: string; gridTypeId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const isEditing = !!gridTypeId;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridType, setGridType] = useState<GridType | null>(null);

  // Carregar dados do tipo de grid se estiver editando
  useEffect(() => {
    const loadGridType = async () => {
      if (!gridTypeId || !championshipId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await GridTypeService.getById(championshipId, gridTypeId);
        setGridType(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar tipo de grid');
        toast.error('Erro ao carregar tipo de grid');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      loadGridType();
    }
  }, [gridTypeId, championshipId, isEditing]);

  const handleSave = async (formData: any) => {
    if (!championshipId) return;

    try {
      setSaving(true);
      setError(null);

      if (isEditing && gridType) {
        await GridTypeService.update(championshipId, gridType.id, formData);
        toast.success('Tipo de grid atualizado com sucesso!');
      } else {
        await GridTypeService.create(championshipId, formData);
        toast.success('Tipo de grid criado com sucesso!');
      }

      // Voltar para a aba de tipos de grid
      navigate(`/championship/${championshipId}?tab=config-grid`);
    } catch (err: any) {
      const message = err.message || 'Erro ao salvar tipo de grid';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (championshipId) {
      navigate(`/championship/${championshipId}?tab=config-grid`);
    }
  };

  if (loading) {
    return (
      <PageLoader message="Carregando tipo de grid..." />
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
            Voltar para Tipos de Grid
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Tipo de Grid' : 'Novo Tipo de Grid'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing 
                ? 'Modifique as configurações do tipo de grid'
                : 'Configure um novo tipo de grid para o campeonato'
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
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editar Tipo de Grid' : 'Criar Tipo de Grid'}
            </CardTitle>
            <CardDescription>
              Configure as propriedades do tipo de grid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GridTypeFormStandalone
              initialData={gridType}
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