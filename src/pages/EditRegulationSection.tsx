import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Input } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { Skeleton } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Edit, 
  Loader2,
  FileText,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { RegulationService, Regulation, RegulationSection } from "@/lib/services/regulation.service";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from "sonner";

interface RegulationSectionForm {
  id?: string;
  title: string;
  markdownContent: string;
  order: number;
}

/**
 * Página dedicada para criar/editar seções de regulamento
 * Otimizada para mobile com melhor experiência de usuário
 */
export const EditRegulationSection = () => {
  const { championshipId, seasonId } = useParams<{ 
    championshipId: string; 
    seasonId: string; 
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Get section ID from URL params (if editing existing section)
  const sectionId = searchParams.get('sectionId');
  const isEditing = !!sectionId;
  
  // State
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  
  // Form state
  const [sectionForm, setSectionForm] = useState<RegulationSectionForm>({
    title: '',
    markdownContent: '',
    order: 1
  });

  // Load regulation and section data
  useEffect(() => {
    if (seasonId) {
      loadRegulation();
    }
  }, [seasonId]);

  const loadRegulation = async () => {
    if (!seasonId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await RegulationService.getBySeasonId(seasonId);
      
      if (!data) {
        setError('Regulamento não encontrado para esta temporada');
        return;
      }
      
      setRegulation(data);
      
      // If editing existing section, load its data
      if (isEditing && sectionId) {
        const section = data.sections.find(s => s.id === sectionId);
        if (section) {
          setSectionForm({
            id: section.id,
            title: section.title,
            markdownContent: section.markdownContent,
            order: section.order
          });
        } else {
          setError('Seção não encontrada');
        }
      } else {
        // Creating new section - set next order
        const nextOrder = data.sections.length > 0 
          ? Math.max(...data.sections.map(s => s.order)) + 1 
          : 1;
        setSectionForm(prev => ({ ...prev, order: nextOrder }));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar regulamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!regulation || !sectionForm.title.trim() || !sectionForm.markdownContent.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedSections = isEditing && sectionId
        ? regulation.sections.map(s => 
            s.id === sectionId 
              ? {
                  // Only send the fields that can be updated
                  title: sectionForm.title,
                  markdownContent: sectionForm.markdownContent,
                  order: sectionForm.order
                }
              : {
                  // Keep existing sections with only updatable fields
                  title: s.title,
                  markdownContent: s.markdownContent,
                  order: s.order
                }
          )
        : [
            // Add existing sections (only updatable fields)
            ...regulation.sections.map(s => ({
              title: s.title,
              markdownContent: s.markdownContent,
              order: s.order
            })),
            // Add new section (without ID - let backend generate it)
            {
              title: sectionForm.title,
              markdownContent: sectionForm.markdownContent,
              order: sectionForm.order
            }
          ];
      
      const updatedRegulation = await RegulationService.update(regulation.id, {
        sections: updatedSections
      });
      
      toast.success(isEditing ? 'Seção atualizada com sucesso!' : 'Seção criada com sucesso!');
      
      // Navigate back to championship regulations tab
      navigate(`/championship/${championshipId}?tab=regulations`);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar seção');
      toast.error('Erro ao salvar seção');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/championship/${championshipId}?tab=regulations`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header */}
      <PageHeader
        title={isEditing ? "Editar Seção do Regulamento" : "Nova Seção do Regulamento"}
        subtitle={isEditing 
          ? "Edite o título e conteúdo da seção do regulamento"
          : "Crie uma nova seção para o regulamento"
        }
        actions={[
          {
            label: (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isMobile ? "Voltar" : "Voltar ao Regulamento"}
              </>
            ),
            onClick: handleBack,
            variant: "outline",
            disabled: saving
          },
          {
            label: (
              <>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </>
            ),
            onClick: handleSave,
            variant: "default",
            disabled: !sectionForm.title.trim() || !sectionForm.markdownContent.trim() || saving
          }
        ]}
      />

      {/* Main Content */}
      <div className="space-y-6">
        {/* Title Input */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h3 className="font-semibold">Título da Seção</h3>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={sectionForm.title}
              onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Introdução, Regras Gerais, Pontuação, etc."
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Content Editor/Preview */}
        <Card>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="edit" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Conteúdo em Markdown
                    </label>
                    <Textarea
                      value={sectionForm.markdownContent}
                      onChange={(e) => setSectionForm(prev => ({ ...prev, markdownContent: e.target.value }))}
                      placeholder="Escreva o conteúdo usando Markdown...

Exemplos:
# Título Principal
## Subtítulo

**Listas com marcadores:**
- Primeiro item da lista
- Segundo item da lista
- Terceiro item da lista

**Listas numeradas:**
1. Primeiro item numerado
2. Segundo item numerado
3. Terceiro item numerado

**Formatação de texto:**
**Texto em negrito**
*Texto em itálico*

**Tabelas:**
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Linha 1  | Dados 1  | Info 1   |
| Linha 2  | Dados 2  | Info 2   |"
                      rows={isMobile ? 15 : 20}
                      className="font-mono text-sm resize-none"
                    />
                  </div>
                  
                  {/* Markdown Help */}
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-2">Dicas de Markdown:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div>
                        <code># Título</code> - Título principal
                      </div>
                      <div>
                        <code>## Subtítulo</code> - Subtítulo
                      </div>
                      <div>
                        <code>**negrito**</code> - <strong>negrito</strong>
                      </div>
                      <div>
                        <code>*itálico*</code> - <em>itálico</em>
                      </div>
                      <div>
                        <code>- Item</code> - Lista com marcadores
                      </div>
                      <div>
                        <code>1. Item</code> - Lista numerada
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                      <p className="font-medium mb-1">💡 Dica para listas:</p>
                      <p>Use <code>-</code> ou <code>*</code> para listas com marcadores</p>
                      <p>Use <code>1.</code>, <code>2.</code>, etc. para listas numeradas</p>
                      <p>Deixe uma linha em branco antes e depois das listas</p>
                    </div>
                    <div className="mt-2">
                      <code className="text-xs">| Col1 | Col2 |</code> - Tabelas (use | para separar colunas)
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[400px] border rounded-md p-4">
                  {sectionForm.markdownContent ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {sectionForm.markdownContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Escreva algum conteúdo para ver a visualização</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}; 