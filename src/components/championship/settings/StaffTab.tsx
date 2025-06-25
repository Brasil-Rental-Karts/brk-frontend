import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Input } from "brk-design-system";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "brk-design-system";
import { AlertTriangle, Mail, Plus, Trash2, Users, Calendar, Crown } from "lucide-react";
import { ChampionshipStaffService, StaffMember } from "@/lib/services/championship-staff.service";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

      await ChampionshipStaffService.addStaffMember(championshipId, { email: newMemberEmail.trim() });
      
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
        <div className="text-sm text-muted-foreground">Carregando equipe...</div>
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
                          <h4 className="font-semibold">{member.user.name}</h4>
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
                      </div>
                    </div>
                    {!member.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
            Sobre a Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Membros da equipe podem editar todos os dados do campeonato, incluindo configurações, 
            temporadas, categorias, etapas e pilotos.
          </p>
          <p>
            • Apenas o proprietário do campeonato e administradores podem gerenciar a equipe.
          </p>
          <p>
            • O proprietário do campeonato aparece na lista com todas as permissões, mas não pode 
            ser removido da equipe.
          </p>
        </CardContent>
      </Card>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>"{memberToDelete?.user.name}"</strong> da equipe?
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
    </div>
  );
}; 