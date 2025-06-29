import { useState, useEffect } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardHeader, CardTitle } from "brk-design-system";
import { Input } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { AlertTriangle, Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { RegulationService, Regulation, CreateRegulationData, UpdateRegulationData } from "@/lib/services/regulation.service";
import { Season } from "@/lib/services/season.service";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Label } from "brk-design-system";

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
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState<CreateRegulationData>({
    title: "",
    content: "",
    seasonId: "",
    isActive: true
  });

  // Load regulations when season changes
  useEffect(() => {
    if (selectedSeason) {
      loadRegulations(selectedSeason);
    } else {
      setRegulations([]);
    }
  }, [selectedSeason]);

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
      setFormData({ title: "", content: "", seasonId: "", isActive: true });
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
        content: formData.content,
        isActive: formData.isActive
      });
      setRegulations(prev => 
        prev.map(reg => reg.id === editingRegulation.id ? updatedRegulation : reg)
      );
      setShowEditForm(false);
      setEditingRegulation(null);
      setFormData({ title: "", content: "", seasonId: "", isActive: true });
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

  const handleToggleActive = async (regulation: Regulation) => {
    try {
      setLoading(true);
      const updatedRegulation = await RegulationService.toggleActive(regulation.id);
      setRegulations(prev => 
        prev.map(reg => reg.id === regulation.id ? updatedRegulation : reg)
      );
    } catch (error) {
      console.error("Error toggling regulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(regulations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRegulations(items);

    // Update order in backend
    try {
      const regulationOrders = items.map((item, index) => ({
        id: item.id,
        order: index + 1
      }));

      await RegulationService.reorder({
        seasonId: selectedSeason,
        regulationOrders
      });
    } catch (error) {
      console.error("Error reordering regulations:", error);
      // Reload regulations to restore original order
      loadRegulations(selectedSeason);
    }
  };

  const openEditModal = (regulation: Regulation) => {
    setEditingRegulation(regulation);
    setFormData({
      title: regulation.title,
      content: regulation.content,
      seasonId: regulation.seasonId,
      isActive: regulation.isActive
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", seasonId: "", isActive: true });
    setEditingRegulation(null);
    setShowCreateForm(false);
    setShowEditForm(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
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

      {selectedSeason && (
        <>
          {/* Header with Create Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Seções do Regulamento</h3>
            <Button 
              onClick={() => {
                resetForm();
                setShowCreateForm(!showCreateForm);
              }}
              variant={showCreateForm ? "outline" : "default"}
              disabled={showEditForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showCreateForm ? "Cancelar" : "Nova Seção"}
            </Button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Seção do Regulamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <Label htmlFor="isActive">Ativo</Label>
                </div>
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
                <CardTitle>Editar Seção do Regulamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <Label htmlFor="edit-isActive">Ativo</Label>
                </div>
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
              <div className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : regulations.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma seção do regulamento encontrada para esta temporada.
              </AlertDescription>
            </Alert>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="regulations">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {regulations.map((regulation, index) => (
                      <Draggable key={regulation.id} draggableId={regulation.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <Card className={`${!regulation.isActive ? 'opacity-60' : ''}`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                    </div>
                                    <CardTitle className="text-base">
                                      {regulation.title}
                                    </CardTitle>
                                    <span className="text-xs text-gray-500">
                                      #{regulation.order}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleActive(regulation)}
                                      title={regulation.isActive ? "Desativar" : "Ativar"}
                                      disabled={showCreateForm || showEditForm}
                                    >
                                      {regulation.isActive ? (
                                        <Eye className="h-4 w-4" />
                                      ) : (
                                        <EyeOff className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(regulation)}
                                      title="Editar"
                                      disabled={showCreateForm || showEditForm}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRegulation(regulation.id)}
                                      title="Excluir"
                                      disabled={showCreateForm || showEditForm}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {regulation.content}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </>
      )}
    </div>
  );
}; 