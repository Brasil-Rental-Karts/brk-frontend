import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { Button } from "brk-design-system";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "brk-design-system";
import { Badge } from "brk-design-system";
import { Input } from "brk-design-system";
import { AlertTriangle, Mail, Plus, Trash2, Users, Calendar } from "lucide-react";
import { ChampionshipStaffService, StaffMember } from "@/lib/services/championship-staff.service";

interface StaffTabProps {
  championshipId: string;
}

export const StaffTab = ({ championshipId }: StaffTabProps) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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
      setError('Por favor, informe o email do usuário');
      return;
    }

    try {
      setIsAddingMember(true);
      setError(null);
      setSuccess(null);

      await ChampionshipStaffService.addStaffMember(championshipId, { email: newMemberEmail.trim() });
      
      setSuccess('Membro adicionado à equipe com sucesso!');
      setNewMemberEmail('');
      setShowAddForm(false);
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
      
      // Recarregar lista
      await loadStaffMembers();
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro à equipe');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName} da equipe?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await ChampionshipStaffService.removeStaffMember(championshipId, memberId);
      
      setSuccess('Membro removido da equipe com sucesso!');
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
      
      // Recarregar lista
      await loadStaffMembers();
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover membro da equipe');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Equipe do Campeonato
          </h2>
          <p className="text-muted-foreground">
            Gerencie os usuários que podem editar dados do campeonato
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Membro
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <Alert>
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Member Form */}
      {showAddForm && (
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
                >
                  {isAddingMember ? 'Adicionando...' : 'Adicionar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMemberEmail('');
                    setError(null);
                  }}
                  disabled={isAddingMember}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Membros da Equipe ({staffMembers.length})
          </h3>
        </div>

        {staffMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum membro na equipe</h3>
              <p className="text-muted-foreground text-center mb-4">
                Adicione usuários à equipe para que possam editar dados do campeonato
              </p>
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Membro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {staffMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{member.user.name}</h4>
                          <Badge variant="secondary">Equipe</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Adicionado em {formatDate(member.addedAt)} por {member.addedBy.name}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.user.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            • O proprietário do campeonato sempre tem todas as permissões e não precisa ser 
            adicionado à equipe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 