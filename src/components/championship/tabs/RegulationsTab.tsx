import { useState, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card, CardHeader, CardContent } from "brk-design-system";
import { Badge } from "brk-design-system";
import { 
  Edit2, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  Globe,
  Save,
  GripVertical,
  Loader2
} from "lucide-react";
import { EmptyState } from "brk-design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "brk-design-system";
import { Input } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { Skeleton } from "brk-design-system";
import { RegulationService, Regulation, RegulationSection } from "@/lib/services/regulation.service";
import { Season } from "@/lib/services/season.service";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ReactMarkdown from 'react-markdown';

interface RegulationsTabProps {
  championshipId: string;
  seasons: Season[];
  selectedSeasonId: string | null;
  onSeasonChange: (seasonId: string) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface RegulationSectionForm {
  id?: string;
  title: string;
  markdownContent: string;
  order: number;
}

/**
 * Tab de regulamentos do campeonato
 * Permite criar e gerenciar regulamentos vinculados a temporadas
 */
export const RegulationsTab = ({
  championshipId,
  seasons,
  selectedSeasonId,
  onSeasonChange,
  isLoading,
  error: externalError,
  onRefresh
}: RegulationsTabProps) => {
  const isMobile = useIsMobile();
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<RegulationSectionForm | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSection, setPreviewSection] = useState<RegulationSection | null>(null);

  // Section form state
  const [sectionForm, setSectionForm] = useState<RegulationSectionForm>({
    title: '',
    markdownContent: '',
    order: 1
  });

  // Season selection state
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(
    selectedSeasonId || (seasons.length > 0 ? seasons[0].id : null)
  );

  // Load regulation when season changes
  useEffect(() => {
    if (currentSeasonId) {
      loadRegulation();
    }
  }, [currentSeasonId]);

  // Update season when seasons change
  useEffect(() => {
    if (!currentSeasonId && seasons.length > 0) {
      setCurrentSeasonId(seasons[0].id);
    }
  }, [seasons]);

  const loadRegulation = async () => {
    if (!currentSeasonId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await RegulationService.getBySeasonId(currentSeasonId);
      setRegulation(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar regulamento');
    } finally {
      setLoading(false);
    }
  };

  const createRegulation = async () => {
    if (!currentSeasonId) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const newRegulation = await RegulationService.create({
        seasonId: currentSeasonId,
        sections: [
          {
            title: 'Introdução',
            markdownContent: '# Introdução\n\nBem-vindo ao regulamento desta temporada.',
            order: 1
          }
        ]
      });
      
      setRegulation(newRegulation);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar regulamento');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSectionModal = (section?: RegulationSection) => {
    if (section) {
      setSectionForm({
        id: section.id,
        title: section.title,
        markdownContent: section.markdownContent,
        order: section.order
      });
      setEditingSection(section);
    } else {
      const nextOrder = regulation ? Math.max(...regulation.sections.map(s => s.order)) + 1 : 1;
      setSectionForm({
        title: '',
        markdownContent: '',
        order: nextOrder
      });
      setEditingSection(null);
    }
    setShowSectionModal(true);
  };

  const handleCloseSectionModal = () => {
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({
      title: '',
      markdownContent: '',
      order: 1
    });
  };

  const handleSaveSection = async () => {
    if (!regulation || !sectionForm.title.trim() || !sectionForm.markdownContent.trim()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedSections = editingSection
        ? regulation.sections.map(s => 
            s.id === editingSection.id 
              ? { ...s, ...sectionForm }
              : s
          )
        : [...regulation.sections, { ...sectionForm, id: Date.now().toString() }];
      
      const updatedRegulation = await RegulationService.update(regulation.id, {
        sections: updatedSections
      });
      
      setRegulation(updatedRegulation);
      handleCloseSectionModal();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar seção');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!regulation || !sectionToDelete) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedSections = regulation.sections.filter(s => s.id !== sectionToDelete);
      
      const updatedRegulation = await RegulationService.update(regulation.id, {
        sections: updatedSections
      });
      
      setRegulation(updatedRegulation);
      setShowDeleteDialog(false);
      setSectionToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir seção');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!regulation) return;
    
    setPublishing(true);
    setError(null);
    
    try {
      const publishedRegulation = await RegulationService.publish(regulation.id);
      setRegulation(publishedRegulation);
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar regulamento');
    } finally {
      setPublishing(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!regulation || !result.destination) return;
    
    const sections = Array.from(regulation.sections);
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);
    
    // Update orders
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index + 1
    }));
    
    // Optimistic update
    setRegulation({
      ...regulation,
      sections: updatedSections
    });
    
    try {
      await RegulationService.reorderSections(
        regulation.id,
        updatedSections.map(s => ({ id: s.id, order: s.order }))
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao reordenar seções');
      // Revert on error
      setRegulation(regulation);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Publicado</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (externalError || error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {externalError || error}
        </AlertDescription>
      </Alert>
    );
  }

  // No seasons available
  if (seasons.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma temporada encontrada"
        description="Crie uma temporada primeiro para poder gerenciar regulamentos."
      />
    );
  }

  // No regulation exists
  if (!regulation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Regulamentos</h2>
        </div>
        
        <EmptyState
          icon={FileText}
          title="Nenhum regulamento encontrado"
          description="Crie o primeiro regulamento para esta temporada."
          action={{
            label: saving ? "Criando..." : "Criar Regulamento",
            onClick: createRegulation
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Regulamentos</h2>
          {regulation && getStatusBadge(regulation.status)}
        </div>
        
        {/* Season Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Temporada:</label>
            <Select value={currentSeasonId || ''} onValueChange={setCurrentSeasonId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status badge moved here if regulation exists */}
        </div>
        
        <div className="flex items-center gap-2">
          {regulation.status === 'draft' && (
            <Button 
              onClick={handlePublish} 
              disabled={publishing}
              variant="default"
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Globe className="mr-2 h-4 w-4" />
              Publicar
            </Button>
          )}
          
          <Button 
            onClick={() => handleOpenSectionModal()} 
            disabled={saving}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Seção
          </Button>
        </div>
      </div>

      {/* Sections */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided: any) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {regulation.sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided: any) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="group"
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold">{section.title}</h3>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPreviewSection(section);
                                setShowPreviewModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSectionModal(section)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSectionToDelete(section.id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {section.markdownContent.substring(0, 150)}...
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Section Modal */}
      <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Editar Seção' : 'Nova Seção'}
            </DialogTitle>
            <DialogDescription>
              {editingSection 
                ? 'Edite o título e conteúdo da seção do regulamento.'
                : 'Crie uma nova seção para o regulamento.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Introdução, Regras Gerais, etc."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Conteúdo (Markdown)</label>
              <Textarea
                value={sectionForm.markdownContent}
                onChange={(e) => setSectionForm(prev => ({ ...prev, markdownContent: e.target.value }))}
                placeholder="Escreva o conteúdo usando Markdown..."
                rows={15}
                className="font-mono"
              />
            </div>

            {/* Markdown Preview */}
            {sectionForm.markdownContent && (
              <div>
                <label className="text-sm font-medium">Visualização</label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto prose prose-sm max-w-none">
                  <ReactMarkdown>{sectionForm.markdownContent}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSectionModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSection} 
              disabled={!sectionForm.title.trim() || !sectionForm.markdownContent.trim() || saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta seção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSection} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewSection?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {previewSection && (
              <ReactMarkdown>{previewSection.markdownContent}</ReactMarkdown>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 