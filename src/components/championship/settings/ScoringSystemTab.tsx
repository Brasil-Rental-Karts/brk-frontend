import { useState, useEffect, useCallback } from "react";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Plus, Trophy, Star, X, Trash2, Edit } from "lucide-react";
import { EmptyState } from "brk-design-system";
import { Alert, AlertDescription } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "brk-design-system";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "brk-design-system";
import { ScoringSystemService, ScoringSystem, ScoringSystemData } from "@/lib/services/scoring-system.service";
import { toast } from "sonner";

interface ScoringSystemTabProps {
  championshipId: string;
}

/**
 * Aba de gerenciamento de sistemas de pontuação do campeonato
 */
export const ScoringSystemTab = ({ championshipId }: ScoringSystemTabProps) => {
  const [scoringSystems, setScoringSystems] = useState<ScoringSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modal de criação/edição
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<ScoringSystem | null>(null);
  const [formData, setFormData] = useState<ScoringSystemData>({
    name: '',
    description: '',
    positions: [{ position: 1, points: 25 }],
    polePositionPoints: 0,
    fastestLapPoints: 0,
    leaderLapPoints: 0,
    isActive: true,
    isDefault: false
  });
  
  // Estados para modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSystem, setDeletingSystem] = useState<ScoringSystem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar sistemas de pontuação
  const fetchScoringSystems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ScoringSystemService.getByChampionshipId(championshipId);
      setScoringSystems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  // Alternar status ativo
  const toggleActive = async (system: ScoringSystem) => {
    // Verificar se está tentando desativar o último sistema ativo
    const activeSystems = scoringSystems.filter(s => s.isActive);
    if (system.isActive && activeSystems.length <= 1) {
      setError("Não é possível desativar o último sistema de pontuação ativo. Pelo menos um sistema deve permanecer ativo.");
      return;
    }

    try {
      setError(null);
      await ScoringSystemService.toggleActive(system.id, championshipId);
      await fetchScoringSystems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Definir como padrão
  const setDefault = async (system: ScoringSystem) => {
    try {
      setError(null);
      await ScoringSystemService.setDefault(system.id, championshipId);
      await fetchScoringSystems();
      toast.success("Sistema de pontuação definido como padrão.", {
        description: "O sistema de pontuação foi definido como padrão com sucesso.",
      });
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao definir sistema de pontuação como padrão.", {
        description: err.message,
      });
    }
  };

  // Salvar sistema de pontuação
  const saveSystem = async () => {
    try {
      if (editingSystem) {
        await ScoringSystemService.update(editingSystem.id, championshipId, formData);
        toast.success("Sistema de pontuação atualizado com sucesso!");
      } else {
        await ScoringSystemService.create(championshipId, formData);
        toast.success("Sistema de pontuação criado com sucesso!");
      }
      
      await fetchScoringSystems();
      handleFormClose();
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao salvar sistema de pontuação.", {
        description: err.message,
      });
    }
  };

  // Excluir sistema de pontuação
  const deleteSystem = async () => {
    if (!deletingSystem) return;

    try {
      setIsDeleting(true);
      setError(null);
      await ScoringSystemService.delete(deletingSystem.id, championshipId);
      await fetchScoringSystems();
      setShowDeleteDialog(false);
      setDeletingSystem(null);
      toast.success("Sistema de pontuação excluído com sucesso!");
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao excluir sistema de pontuação.", {
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers do formulário
  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      positions: [{ position: 1, points: 25 }],
      polePositionPoints: 0,
      fastestLapPoints: 0,
      leaderLapPoints: 0,
      isActive: true,
      isDefault: false
    });
    setEditingSystem(null);
    setShowForm(true);
  };

  const handleEdit = (system: ScoringSystem) => {
    setFormData({
      name: system.name,
      description: system.description || '',
      positions: system.positions,
      polePositionPoints: system.polePositionPoints,
      fastestLapPoints: system.fastestLapPoints,
      leaderLapPoints: system.leaderLapPoints,
      isActive: system.isActive,
      isDefault: system.isDefault
    });
    setEditingSystem(system);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSystem(null);
  };

  const handleDeleteClick = (system: ScoringSystem) => {
    setDeletingSystem(system);
    setShowDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingSystem(null);
  };

  // Buscar dados ao montar
  useEffect(() => {
    fetchScoringSystems();
  }, [fetchScoringSystems]);

  // Renderizar o resumo de pontos
  const renderPointsSummary = (system: ScoringSystem) => {
    const topPositions = system.positions.slice(0, 5);
    return topPositions.map(pos => `${pos.position}º=${pos.points}pts`).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Carregando sistemas de pontuação...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchScoringSystems} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (scoringSystems.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Trophy}
          title="Nenhum sistema de pontuação configurado"
          description="Crie seu primeiro sistema de pontuação para definir como os pontos serão distribuídos nas corridas."
          action={{
            label: "Criar Sistema Personalizado",
            onClick: handleCreateNew
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistemas de Pontuação</h2>
          <p className="text-muted-foreground">
            Configure como os pontos serão distribuídos nas corridas do campeonato
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Sistema
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de sistemas */}
      <div className="grid gap-4">
        {scoringSystems.map((system) => (
          <Card key={system.id} className={`${!system.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{system.name}</CardTitle>
                    {system.isDefault && (
                      <Badge variant="default">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                    {!system.isActive && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  {system.description && (
                    <CardDescription>{system.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(system)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar sistema</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(system)}
                          disabled={scoringSystems.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {scoringSystems.length <= 1 
                          ? "Não é possível excluir o último sistema" 
                          : "Excluir sistema"
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pontuação por posição */}
                <div>
                  <h4 className="font-medium mb-2">Pontuação por posição:</h4>
                  <div className="text-sm text-muted-foreground">
                    {renderPointsSummary(system)}
                    {system.positions.length > 5 && ` ... (${system.positions.length} posições)`}
                  </div>
                </div>

                {/* Pontos extras */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Pole Position: </span>
                    <span className="text-muted-foreground">{system.polePositionPoints} pts</span>
                  </div>
                  <div>
                    <span className="font-medium">Volta Mais Rápida: </span>
                    <span className="text-muted-foreground">{system.fastestLapPoints} pts</span>
                  </div>
                  <div>
                    <span className="font-medium">Liderança: </span>
                    <span className="text-muted-foreground">{system.leaderLapPoints} pts/volta</span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={system.isActive}
                        onCheckedChange={() => toggleActive(system)}
                        disabled={system.isActive && scoringSystems.filter(s => s.isActive).length <= 1}
                      />
                      Sistema ativo
                    </label>
                  </div>
                  <div className="flex gap-2">
                    {!system.isDefault && system.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefault(system)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Definir como Padrão
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSystem ? 'Editar Sistema de Pontuação' : 'Novo Sistema de Pontuação'}
            </DialogTitle>
            <DialogDescription>
              Configure como os pontos serão distribuídos nas corridas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Fórmula 1, Kart Brasileiro, etc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descrição opcional do sistema"
                />
              </div>
            </div>

            {/* Pontuação por posição */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Pontuação por Posição *</label>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => {
                    const nextPosition = formData.positions.length + 1;
                    setFormData(prev => ({
                      ...prev,
                      positions: [...prev.positions, { position: nextPosition, points: 0 }]
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Posição
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-gray-600">
                  <div className="col-span-2">Posição</div>
                  <div className="col-span-2">Pontos</div>
                  <div className="col-span-6"></div>
                  <div className="col-span-2 text-center">Ações</div>
                </div>
                <div className="space-y-2">
                  {formData.positions.map((pos, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={pos.position}
                          onChange={(e) => {
                            const newPositions = [...formData.positions];
                            newPositions[index] = { ...newPositions[index], position: parseInt(e.target.value) || 1 };
                            setFormData(prev => ({ ...prev, positions: newPositions }));
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={pos.points}
                          onChange={(e) => {
                            const newPositions = [...formData.positions];
                            newPositions[index] = { ...newPositions[index], points: parseInt(e.target.value) || 0 };
                            setFormData(prev => ({ ...prev, positions: newPositions }));
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          min="0"
                        />
                      </div>
                      <div className="col-span-6 text-xs text-gray-500">
                        {pos.position}º lugar = {pos.points} pontos
                      </div>
                      <div className="col-span-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newPositions = formData.positions.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, positions: newPositions }));
                          }}
                          disabled={formData.positions.length <= 1}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.positions.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Adicione pelo menos uma posição
                  </div>
                )}
              </div>
            </div>

            {/* Pontos extras */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Pontos Extras</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pole Position</label>
                  <input
                    type="number"
                    value={formData.polePositionPoints || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      polePositionPoints: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Pontos para quem faz a pole position</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volta Mais Rápida</label>
                  <input
                    type="number"
                    value={formData.fastestLapPoints || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      fastestLapPoints: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Pontos para a volta mais rápida da corrida</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pontos por Volta Liderada</label>
                  <input
                    type="number"
                    value={formData.leaderLapPoints || 0}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      leaderLapPoints: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Pontos por cada volta liderada</p>
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Configurações</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isActive: !!checked 
                    }))}
                  />
                  Sistema ativo
                  <span className="text-xs text-gray-500 ml-1">
                    (sistemas ativos podem ser usados nas corridas)
                  </span>
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.isDefault || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isDefault: !!checked 
                    }))}
                  />
                  Definir como padrão
                  <span className="text-xs text-gray-500 ml-1">
                    (sistema usado por padrão em novas corridas)
                  </span>
                </label>
              </div>
            </div>

            {/* Templates rápidos */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Templates Rápidos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    positions: [
                      { position: 1, points: 25 },
                      { position: 2, points: 18 },
                      { position: 3, points: 15 },
                      { position: 4, points: 12 },
                      { position: 5, points: 10 },
                      { position: 6, points: 8 },
                      { position: 7, points: 6 },
                      { position: 8, points: 4 },
                      { position: 9, points: 2 },
                      { position: 10, points: 1 }
                    ],
                    polePositionPoints: 1,
                    fastestLapPoints: 1
                  }))}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">Fórmula 1</div>
                    <div className="text-xs text-gray-500">25-18-15-12-10-8-6-4-2-1</div>
                  </div>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    positions: [
                      { position: 1, points: 20 },
                      { position: 2, points: 17 },
                      { position: 3, points: 15 },
                      { position: 4, points: 13 },
                      { position: 5, points: 11 },
                      { position: 6, points: 10 },
                      { position: 7, points: 9 },
                      { position: 8, points: 8 },
                      { position: 9, points: 7 },
                      { position: 10, points: 6 },
                      { position: 11, points: 5 },
                      { position: 12, points: 4 },
                      { position: 13, points: 3 },
                      { position: 14, points: 2 },
                      { position: 15, points: 1 }
                    ]
                  }))}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">Kart Brasileiro</div>
                    <div className="text-xs text-gray-500">20-17-15-13-11... (15 pos)</div>
                  </div>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    positions: [
                      { position: 1, points: 5 },
                      { position: 2, points: 4 },
                      { position: 3, points: 3 },
                      { position: 4, points: 2 },
                      { position: 5, points: 1 }
                    ]
                  }))}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">Simples</div>
                    <div className="text-xs text-gray-500">5-4-3-2-1 (Top 5)</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleFormClose}>
              Cancelar
            </Button>
            <Button 
              onClick={saveSystem} 
              disabled={!formData.name.trim() || formData.positions.length === 0}
            >
              {editingSystem ? 'Salvar Alterações' : 'Criar Sistema'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Excluir "{deletingSystem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteSystem} disabled={isDeleting}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 