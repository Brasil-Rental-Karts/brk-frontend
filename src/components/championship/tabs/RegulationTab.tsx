import { useState, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardHeader, CardTitle } from "brk-design-system";
import { Input } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { AlertTriangle, Plus, Edit, Trash2, GripVertical, HelpCircle, Power, PowerOff, FileText } from "lucide-react";
import { RegulationService, Regulation, CreateRegulationData, UpdateRegulationData } from "@/lib/services/regulation.service";
import { Season, SeasonService } from "@/lib/services/season.service";
import { ChampionshipService, Championship } from "@/lib/services/championship.service";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Label } from "brk-design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "brk-design-system";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Switch } from "@radix-ui/react-switch";
import { PDFGenerator, RegulationPDFData } from "@/utils/pdf-generator";
import { InlineLoader } from '@/components/ui/loading';

interface RegulationTabProps {
  championshipId: string;
  seasons: Season[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const RegulationTab = ({ 
  championshipId, 
  seasons, 
  isLoading = false, 
  error = null, 
  onRefresh 
}: RegulationTabProps) => {
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [championshipData, setChampionshipData] = useState<Championship | null>(null);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState<CreateRegulationData>({
    title: "",
    content: "",
    seasonId: ""
  });
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  // Carregar dados da temporada selecionada
  useEffect(() => {
    if (selectedSeason) {
      SeasonService.getById(selectedSeason).then(setSeasonData).catch(() => setSeasonData(null));
      loadRegulations(selectedSeason);
    } else {
      setRegulations([]);
      setSeasonData(null);
    }
  }, [selectedSeason]);

  // Carregar dados do campeonato
  useEffect(() => {
    if (championshipId) {
      ChampionshipService.getById(championshipId)
        .then(setChampionshipData)
        .catch(() => setChampionshipData(null));
    }
  }, [championshipId]);

  const loadRegulations = async (seasonId: string) => {
    try {
      setLoading(true);
      const data = await RegulationService.getBySeasonIdOrdered(seasonId);
      setRegulations(data);
    } catch (error) {
      console.error("Error loading regulations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegulation = async () => {
    try {
      setLoading(true);
      const newRegulation = await RegulationService.create({
        ...formData,
        seasonId: selectedSeason
      });
      setRegulations(prev => [...prev, newRegulation]);
      setShowCreateForm(false);
      setFormData({ title: "", content: "", seasonId: "" });
    } catch (error) {
      console.error("Error creating regulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRegulation = async () => {
    if (!editingRegulation) return;
    
    try {
      setLoading(true);
      const updatedRegulation = await RegulationService.update(editingRegulation.id, {
        title: formData.title,
        content: formData.content
      });
      setRegulations(prev => 
        prev.map(reg => reg.id === editingRegulation.id ? updatedRegulation : reg)
      );
      setShowEditForm(false);
      setEditingRegulation(null);
      setFormData({ title: "", content: "", seasonId: "" });
    } catch (error) {
      console.error("Error updating regulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegulation = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta seção do regulamento?")) return;
    
    try {
      setLoading(true);
      await RegulationService.delete(id);
      setRegulations(prev => prev.filter(reg => reg.id !== id));
    } catch (error) {
      console.error("Error deleting regulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = regulations.findIndex(item => item.id === active.id);
      const newIndex = regulations.findIndex(item => item.id === over.id);
      const items = arrayMove(regulations, oldIndex, newIndex);
      setRegulations(items);
      // Update order in backend
      RegulationService.reorder({
        seasonId: selectedSeason,
        regulationIds: items.map(item => item.id)
      }).catch(() => loadRegulations(selectedSeason));
    }
  }

  const openEditModal = (regulation: Regulation) => {
    setEditingRegulation(regulation);
    setFormData({
      title: regulation.title,
      content: regulation.content,
      seasonId: regulation.seasonId
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", seasonId: "" });
    setEditingRegulation(null);
    setShowCreateForm(false);
    setShowEditForm(false);
    setShowMarkdownHelp(false);
  };

  const handleGeneratePDF = async () => {
    if (!championshipData || !seasonData || regulations.length === 0) {
      alert('Não é possível gerar o PDF. Verifique se há regulamentos cadastrados.');
      return;
    }

    try {
      setGeneratingPDF(true);
      
      const pdfData: RegulationPDFData = {
        championshipName: championshipData.name,
        seasonName: seasonData.name,
        championshipLogo: championshipData.championshipImage || undefined,
        regulations: regulations.map((regulation, index) => ({
          title: regulation.title,
          content: regulation.content,
          order: regulation.order || index + 1
        })),
        generatedAt: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      await PDFGenerator.generateRegulationPDF(pdfData);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <InlineLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da aba */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Regulamento</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie o regulamento e as regras do campeonato
        </p>
      </div>

      {/* Season Selector */}
      <div className="space-y-2">
        <Label htmlFor="season-select">Selecionar Temporada</Label>
        <select
          id="season-select"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecione uma temporada</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason && seasonData && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            {seasonData.regulationsEnabled ? (
              <Power className="h-5 w-5 text-primary" />
            ) : (
              <PowerOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <Label htmlFor="regulations-enabled-switch" className="text-sm font-medium">
                Regulamento da Temporada
              </Label>
              <p className="text-xs text-gray-500">
                {seasonData.regulationsEnabled 
                  ? "Ativo - Os pilotos podem visualizar o regulamento" 
                  : "Inativo - Os pilotos não podem visualizar o regulamento"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="regulations-enabled-switch"
              checked={!!seasonData.regulationsEnabled}
              onCheckedChange={async (checked) => {
                if (!seasonData) return;
                setSeasonData({ ...seasonData, regulationsEnabled: checked });
                try {
                  await SeasonService.update(seasonData.id, { regulationsEnabled: checked });
                } catch (e) {
                  // rollback visual se erro
                  setSeasonData({ ...seasonData, regulationsEnabled: !checked });
                  alert('Erro ao atualizar status do regulamento.');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                seasonData.regulationsEnabled ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  seasonData.regulationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </Switch>
            <span className={`text-sm font-medium ${
              seasonData.regulationsEnabled ? 'text-primary' : 'text-gray-500'
            }`}>
              {seasonData.regulationsEnabled ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>
        </div>
      )}

      {selectedSeason && (
        <>
          {/* Header with Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-lg font-semibold">Seções do Regulamento</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              {regulations.length > 0 && (
                <Button 
                  onClick={handleGeneratePDF}
                  variant="outline"
                  disabled={generatingPDF || showCreateForm || showEditForm}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {generatingPDF ? "Gerando PDF..." : "Gerar PDF"}
                </Button>
              )}
              <Button 
                onClick={() => {
                  resetForm();
                  setShowCreateForm(!showCreateForm);
                }}
                variant={showCreateForm ? "outline" : "default"}
                disabled={showEditForm}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {showCreateForm ? "Cancelar" : "Nova Seção"}
              </Button>
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Criar Nova Seção do Regulamento</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                    className="h-8 px-2"
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Dicas Edição
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showMarkdownHelp && (
                  <Alert>
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <p><strong>Dicas de Edição:</strong></p>
                        <p>• <code>**texto**</code> para <strong>negrito</strong></p>
                        <p>• <code>*texto*</code> para <em>itálico</em></p>
                        <p>• <code># Título</code> para títulos</p>
                        <p>• <code>- item</code> para listas</p>
                        <p>• <code>[link](url)</code> para links</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">Editar</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="edit" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Digite o título da seção"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Digite o conteúdo da seção"
                        rows={6}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4">
                    <div className="p-4 border rounded-md bg-gray-50 min-h-[200px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none">
                      {formData.title && (
                        <div className="mb-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {formData.title}
                          </ReactMarkdown>
                        </div>
                      )}
                      {formData.content && (
                        <div>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {formData.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {!formData.title && !formData.content && (
                        <div className="text-gray-500 italic">
                          Digite um título e conteúdo para ver o preview
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRegulation} disabled={loading || !formData.title || !formData.content}>
                    Criar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          {showEditForm && editingRegulation && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Editar Seção do Regulamento</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                    className="h-8 px-2"
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Dicas Edição
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showMarkdownHelp && (
                  <Alert>
                    <AlertDescription>
                      <div className="text-sm space-y-1">
                        <p><strong>Dicas de Edição:</strong></p>
                        <p>• <code>**texto**</code> para <strong>negrito</strong></p>
                        <p>• <code>*texto*</code> para <em>itálico</em></p>
                        <p>• <code># Título</code> para títulos</p>
                        <p>• <code>- item</code> para listas</p>
                        <p>• <code>[link](url)</code> para links</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">Editar</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="edit" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="edit-title">Título</Label>
                      <Input
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Digite o título da seção"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-content">Conteúdo</Label>
                      <Textarea
                        id="edit-content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Digite o conteúdo da seção"
                        rows={6}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4">
                    <div className="p-4 border rounded-md bg-gray-50 min-h-[200px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none">
                      {formData.title && (
                        <div className="mb-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {formData.title}
                          </ReactMarkdown>
                        </div>
                      )}
                      {formData.content && (
                        <div>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {formData.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {!formData.title && !formData.content && (
                        <div className="text-gray-500 italic">
                          Digite um título e conteúdo para ver o preview
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditForm(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateRegulation} disabled={loading || !formData.title || !formData.content}>
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regulations List */}
          {loading ? (
            <div className="space-y-4">
              <InlineLoader size="md" />
            </div>
          ) : regulations.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma seção do regulamento encontrada para esta temporada.
              </AlertDescription>
            </Alert>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={regulations.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {regulations.map((regulation, index) => (
                  <SortableRegulationCard
                    key={regulation.id}
                    regulation={regulation}
                    index={index}
                    onEdit={openEditModal}
                    onDelete={handleDeleteRegulation}
                    canEdit={!(showCreateForm || showEditForm)}
                    isEditing={showEditForm}
                    isCreating={showCreateForm}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </>
      )}
    </div>
  );
};

function SortableRegulationCard({ regulation, index, onEdit, onDelete, canEdit, isEditing, isCreating }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: regulation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#f3f4f6' : undefined,
    marginBottom: '0.75rem',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="cursor-grab text-gray-400 hover:text-gray-600"
                {...attributes}
                {...listeners}
                tabIndex={-1}
                aria-label="Arrastar para reordenar"
                disabled={isEditing || isCreating}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <CardTitle className="text-base prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {regulation.title}
                </ReactMarkdown>
              </CardTitle>
              <span className="text-xs text-gray-500">#{regulation.order}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(regulation)}
                title="Editar"
                disabled={isEditing || isCreating}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(regulation.id)}
                title="Excluir"
                disabled={isEditing || isCreating}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {regulation.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 