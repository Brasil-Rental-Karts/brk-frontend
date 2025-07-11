import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Input } from "brk-design-system";
import { Checkbox } from "brk-design-system";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "brk-design-system";
import { AlertTriangle, Mail, Plus, Trash2, Users, Calendar, Crown, Settings } from "lucide-react";
import { ChampionshipStaffService, StaffMember, StaffPermissions } from "@/lib/services/championship-staff.service";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loading } from '@/components/ui/loading';
import { formatName } from '@/utils/name';

interface StaffTabProps {
  championshipId: string;
}

export const StaffTab = ({ championshipId }: StaffTabProps) => {
  const isMobile = useIsMobile();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<StaffMember | null>(null);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const [permissions, setPermissions] = useState<StaffPermissions>({});

  // Carregar membros do staff
  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const members = await ChampionshipStaffService.getStaffMembers(championshipId);
      setStaffMembers(members);
    } catch (err) {
      console.error('Erro ao carregar staff:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros da equipe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffMembers();
  }, [championshipId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) {
      toast.error('Por favor, informe o email do usuário');
      return;
    }

    try {
      setIsAddingMember(true);
      setError(null);

      await ChampionshipStaffService.addStaffMember(championshipId, { 
        email: newMemberEmail.trim(),
        permissions: {}
      });
      
      toast.success('Membro adicionado à equipe com sucesso!');
      setNewMemberEmail('');
      
      // Recarregar lista
      await loadStaffMembers();
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar membro à equipe';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = (member: StaffMember) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);

      await ChampionshipStaffService.removeStaffMember(championshipId, memberToDelete.id);
      
      toast.success('Membro removido da equipe com sucesso!');
      
      // Recarregar lista
      await loadStaffMembers();
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover membro da equipe';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setMemberToDelete(null);
    }
  };

  const cancelRemoveMember = () => {
    setShowDeleteDialog(false);
    setMemberToDelete(null);
  };

  const handleEditPermissions = (member: StaffMember) => {
    setMemberToEdit(member);
    setPermissions(member.permissions || {});
    setShowPermissionsDialog(true);
  };

  const handleUpdatePermissions = async () => {
    if (!memberToEdit) return;

    try {
      setIsUpdatingPermissions(true);
      setError(null);

      await ChampionshipStaffService.updateStaffMemberPermissions(
        championshipId,
        memberToEdit.id,
        { permissions }
      );
      
      toast.success('Permissões atualizadas com sucesso!');
      
      // Recarregar lista
      await loadStaffMembers();
      setShowPermissionsDialog(false);
      setMemberToEdit(null);
    } catch (err) {
      console.error('Erro ao atualizar permissões:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar permissões';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const cancelEditPermissions = () => {
    setShowPermissionsDialog(false);
    setMemberToEdit(null);
    setPermissions({});
  };

  const handlePermissionChange = (permission: keyof StaffPermissions, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular membros da equipe (sem contar o owner)
  const teamMembers = staffMembers.filter(member => !member.isOwner);
  const hasTeamMembers = teamMembers.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading type="spinner" size="sm" message="Carregando equipe..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Equipe do Campeonato
        </h2>
        <p className="text-muted-foreground">
          Gerencie os usuários que podem editar dados do campeonato
        </p>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Member Form - Always Visible */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adicionar Membro à Equipe</CardTitle>
          <CardDescription>
            Informe o email do usuário que deve ter acesso para editar dados do campeonato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email do usuário
              </label>
              <Input
                id="email"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                disabled={isAddingMember}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isAddingMember}
                className={isMobile ? 'w-full' : ''}
              >
                {isAddingMember ? 'Adicionando...' : 'Adicionar Membro'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Staff Members List */}
      <div className="space-y-4">

        {!hasTeamMembers ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum membro na equipe</h3>
              <p className="text-muted-foreground text-center mb-4">
                Adicione usuários à equipe para que possam editar dados do campeonato
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Lista de todos os membros (owner + equipe) */}
        {staffMembers.length > 0 && (
          <div className="grid gap-4">
            {staffMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{formatName(member.user.name)}</h4>
                          {member.isOwner ? (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                              <Crown className="h-3 w-3 mr-1" />
                              Proprietário
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Equipe</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {member.isOwner 
                            ? `Proprietário desde ${formatDate(member.addedAt)}`
                            : `Adicionado em ${formatDate(member.addedAt)} por ${member.addedBy.name}`
                          }
                        </div>
                        {!member.isOwner && member.permissions && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Permissões:</div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(member.permissions).map(([key, value]) => {
                                if (value) {
                                  const permissionLabels: Record<string, string> = {
                                    seasons: 'Temporadas',
                                    categories: 'Categorias',
                                    stages: 'Etapas',
                                    pilots: 'Pilotos',
                                    classification: 'Classificação',
                                    regulations: 'Regulamentos',
                                    penalties: 'Punições',
                                    raceDay: 'Race Day',
                                    editChampionship: 'Editar Campeonato',
                                    gridTypes: 'Tipos de Grid',
                                    scoringSystems: 'Sistemas de Pontuação',
                                    sponsors: 'Patrocinadores',
                                    staff: 'Equipe',
                                    asaasAccount: 'Conta Asaas'
                                  };
                                  return (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {permissionLabels[key] || key}
                                    </Badge>
                                  );
                                }
                                return null;
                              })}
                              {Object.values(member.permissions).every(v => !v) && (
                                <span className="text-xs text-muted-foreground">Nenhuma permissão específica</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!member.isOwner && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPermissions(member)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sobre a Equipe e Permissões
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • <strong>Proprietário:</strong> Tem acesso total a todas as funcionalidades do campeonato.
          </p>
          <p>
            • <strong>Membros da Equipe:</strong> Podem ter permissões específicas configuradas para diferentes áreas:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Temporadas:</strong> Criar, editar e gerenciar temporadas</li>
            <li><strong>Categorias:</strong> Configurar categorias e suas regras</li>
            <li><strong>Etapas:</strong> Gerenciar etapas e eventos</li>
            <li><strong>Pilotos:</strong> Visualizar e gerenciar pilotos inscritos</li>
            <li><strong>Classificação:</strong> Acessar a aba de classificação do campeonato</li>
            <li><strong>Regulamentos:</strong> Editar regulamentos das temporadas</li>
            <li><strong>Race Day:</strong> Acessar funcionalidades do dia da corrida</li>
            <li><strong>Editar Campeonato:</strong> Modificar dados básicos do campeonato</li>
            <li><strong>Tipos de Grid:</strong> Configurar tipos de grid disponíveis</li>
            <li><strong>Sistemas de Pontuação:</strong> Criar e editar sistemas de pontuação</li>
            <li><strong>Patrocinadores:</strong> Gerenciar patrocinadores</li>
            <li><strong>Gerenciar Equipe:</strong> Adicionar/remover membros e configurar permissões</li>
            <li><strong>Conta Asaas:</strong> Configurar integração de pagamentos</li>
          </ul>
          <p>
            • Use o ícone de configurações (⚙️) ao lado de cada membro para definir suas permissões específicas.
          </p>
          <p>
            • Apenas o proprietário do campeonato e administradores podem gerenciar a equipe.
          </p>
        </CardContent>
      </Card>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
            <DialogDescription>
                              Tem certeza que deseja remover <strong>"{memberToDelete?.user.name ? formatName(memberToDelete.user.name) : 'Usuário'}"</strong> da equipe?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao remover</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={cancelRemoveMember}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemoveMember}
              disabled={isDeleting}
            >
              {isDeleting ? "Removendo..." : "Remover da Equipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de permissões */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
                              Configure as permissões de acesso para <strong>"{memberToEdit?.user.name ? formatName(memberToEdit.user.name) : 'Usuário'}"</strong>
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao atualizar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="seasons"
                  checked={permissions.seasons || false}
                  onCheckedChange={(checked) => handlePermissionChange('seasons', checked as boolean)}
                />
                <label htmlFor="seasons" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Temporadas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="categories"
                  checked={permissions.categories || false}
                  onCheckedChange={(checked) => handlePermissionChange('categories', checked as boolean)}
                />
                <label htmlFor="categories" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Categorias
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stages"
                  checked={permissions.stages || false}
                  onCheckedChange={(checked) => handlePermissionChange('stages', checked as boolean)}
                />
                <label htmlFor="stages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Etapas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pilots"
                  checked={permissions.pilots || false}
                  onCheckedChange={(checked) => handlePermissionChange('pilots', checked as boolean)}
                />
                <label htmlFor="pilots" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Pilotos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="classification"
                  checked={permissions.classification || false}
                  onCheckedChange={(checked) => handlePermissionChange('classification', checked as boolean)}
                />
                <label htmlFor="classification" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Classificação
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regulations"
                  checked={permissions.regulations || false}
                  onCheckedChange={(checked) => handlePermissionChange('regulations', checked as boolean)}
                />
                <label htmlFor="regulations" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Regulamentos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="penalties"
                  checked={permissions.penalties || false}
                  onCheckedChange={(checked) => handlePermissionChange('penalties', checked as boolean)}
                />
                <label htmlFor="penalties" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Punições
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="raceDay"
                  checked={permissions.raceDay || false}
                  onCheckedChange={(checked) => handlePermissionChange('raceDay', checked as boolean)}
                />
                <label htmlFor="raceDay" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Race Day
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editChampionship"
                  checked={permissions.editChampionship || false}
                  onCheckedChange={(checked) => handlePermissionChange('editChampionship', checked as boolean)}
                />
                <label htmlFor="editChampionship" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Editar Campeonato
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gridTypes"
                  checked={permissions.gridTypes || false}
                  onCheckedChange={(checked) => handlePermissionChange('gridTypes', checked as boolean)}
                />
                <label htmlFor="gridTypes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Tipos de Grid
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scoringSystems"
                  checked={permissions.scoringSystems || false}
                  onCheckedChange={(checked) => handlePermissionChange('scoringSystems', checked as boolean)}
                />
                <label htmlFor="scoringSystems" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Sistemas de Pontuação
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sponsors"
                  checked={permissions.sponsors || false}
                  onCheckedChange={(checked) => handlePermissionChange('sponsors', checked as boolean)}
                />
                <label htmlFor="sponsors" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Patrocinadores
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="staff"
                  checked={permissions.staff || false}
                  onCheckedChange={(checked) => handlePermissionChange('staff', checked as boolean)}
                />
                <label htmlFor="staff" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Gerenciar Equipe
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="asaasAccount"
                  checked={permissions.asaasAccount || false}
                  onCheckedChange={(checked) => handlePermissionChange('asaasAccount', checked as boolean)}
                />
                <label htmlFor="asaasAccount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Conta Asaas
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={cancelEditPermissions}
              disabled={isUpdatingPermissions}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdatePermissions}
              disabled={isUpdatingPermissions}
            >
              {isUpdatingPermissions ? "Salvando..." : "Salvar Permissões"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 