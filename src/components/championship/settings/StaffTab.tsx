import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "brk-design-system";
import {
  AlertTriangle,
  Calendar,
  Crown,
  Mail,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Loading } from "@/components/ui/loading";
import { useChampionshipData } from "@/contexts/ChampionshipContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ChampionshipStaffService,
  StaffMember,
  StaffPermissions,
} from "@/lib/services/championship-staff.service";
import { formatName } from "@/utils/name";

interface StaffTabProps {
  championshipId: string;
}

export const StaffTab = ({ championshipId }: StaffTabProps) => {
  const isMobile = useIsMobile();

  // Usar o contexto de dados do campeonato
  const {
    getStaff,
    addStaff,
    updateStaff,
    removeStaff,
    loading: contextLoading,
    error: contextError,
  } = useChampionshipData();

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<StaffMember | null>(null);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  type StaffPermissionsWithAnalise = StaffPermissions & { analise?: boolean };
  const [permissions, setPermissions] = useState<StaffPermissionsWithAnalise>(
    {},
  );

  // Definir permissões padrão (todas false)
  const defaultPermissions = {
    seasons: false,
    categories: false,
    stages: false,
    pilots: false,
    classification: false,
    regulations: false,
    penalties: false,
    raceDay: false,
    editChampionship: false,
    gridTypes: false,
    scoringSystems: false,
    sponsors: false,
    staff: false,
    asaasAccount: false,
    analise: false,
  };

  // Carregar membros do staff do contexto
  const loadStaffMembers = useCallback(() => {
    try {
      setError(null);
      const members = getStaff();
      setStaffMembers(members);
    } catch (err) {
      console.error("Erro ao carregar staff:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar membros da equipe",
      );
    } finally {
      setLoading(false);
    }
  }, [getStaff]);

  useEffect(() => {
    loadStaffMembers();
  }, [loadStaffMembers]);

  // Atualizar staff members quando o contexto mudar
  useEffect(() => {
    const members = getStaff();
    setStaffMembers(members);
    setLoading(false);
  }, [getStaff]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMemberEmail.trim()) {
      toast.error("Por favor, informe o email do usuário");
      return;
    }

    try {
      setIsAddingMember(true);
      setError(null);

      const newMember = await ChampionshipStaffService.addStaffMember(
        championshipId,
        {
          email: newMemberEmail.trim(),
          permissions: { ...defaultPermissions },
        },
      );

      // Atualizar o contexto com o novo membro
      addStaff(newMember);

      toast.success("Membro adicionado à equipe com sucesso!");
      setNewMemberEmail("");
      // Abrir modal de permissões para o novo membro
      setMemberToEdit(newMember);
      setPermissions(newMember.permissions || { ...defaultPermissions });
      setShowPermissionsDialog(true);
    } catch (err) {
      console.error("Erro ao adicionar membro:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erro ao adicionar membro à equipe";
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

      await ChampionshipStaffService.removeStaffMember(
        championshipId,
        memberToDelete.id,
      );

      // Atualizar o contexto removendo o membro
      removeStaff(memberToDelete.id);

      toast.success("Membro removido da equipe com sucesso!");
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao remover membro da equipe";
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

      const updatedMember =
        await ChampionshipStaffService.updateStaffMemberPermissions(
          championshipId,
          memberToEdit.id,
          { permissions },
        );

      // Atualizar o contexto com as novas permissões
      updateStaff(memberToEdit.id, { permissions: updatedMember.permissions });

      toast.success("Permissões atualizadas com sucesso!");
      setShowPermissionsDialog(false);
      setMemberToEdit(null);
    } catch (err) {
      console.error("Erro ao atualizar permissões:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao atualizar permissões";
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

  const handlePermissionChange = (
    permission: keyof StaffPermissionsWithAnalise,
    checked: boolean,
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: checked,
    }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular membros da equipe (sem contar o owner)
  const teamMembers = staffMembers.filter((member) => !member.isOwner);
  const hasTeamMembers = teamMembers.length > 0;

  // Usar loading do contexto se disponível
  const isLoading = contextLoading.staff || loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading type="spinner" size="sm" message="Carregando equipe..." />
      </div>
    );
  }

  // Permissões em ordem alfabética para o card explicativo
  const permissionOrder = [
    "analise",
    "categories",
    "classification",
    "asaasAccount",
    "editChampionship",
    "stages",
    "staff",
    "sponsors",
    "pilots",
    "penalties",
    "raceDay",
    "regulations",
    "scoringSystems",
    "seasons",
    "gridTypes",
  ];
  const permissionLabels: Record<string, string> = {
    analise: "Análises",
    categories: "Categorias",
    classification: "Classificação",
    asaasAccount: "Conta Asaas",
    editChampionship: "Editar Campeonato",
    stages: "Etapas",
    staff: "Gerenciar Equipe",
    sponsors: "Patrocinadores",
    pilots: "Pilotos",
    penalties: "Punições",
    raceDay: "Race Day",
    regulations: "Regulamentos",
    scoringSystems: "Sistemas de Pontuação",
    seasons: "Temporadas",
    gridTypes: "Tipos de Grid",
  };

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
            Informe o email do usuário que deve ter acesso para editar dados do
            campeonato
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
                className={isMobile ? "w-full" : ""}
              >
                {isAddingMember ? "Adicionando..." : "Adicionar Membro"}
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
              <h3 className="text-lg font-semibold mb-2">
                Nenhum membro na equipe
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Adicione usuários à equipe para que possam editar dados do
                campeonato
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
                          <h4 className="font-semibold">
                            {formatName(member.user.name)}
                          </h4>
                          {member.isOwner ? (
                            <Badge
                              variant="default"
                              className="bg-yellow-500 hover:bg-yellow-600"
                            >
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
                            : `Adicionado em ${formatDate(member.addedAt)} por ${member.addedBy.name}`}
                        </div>
                        {!member.isOwner && member.permissions && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">
                              Permissões:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(member.permissions).map(
                                ([key, value]) => {
                                  if (value) {
                                    const permissionLabels: Record<
                                      string,
                                      string
                                    > = {
                                      seasons: "Temporadas",
                                      categories: "Categorias",
                                      stages: "Etapas",
                                      pilots: "Pilotos",
                                      classification: "Classificação",
                                      regulations: "Regulamentos",
                                      penalties: "Punições",
                                      raceDay: "Race Day",
                                      editChampionship: "Editar Campeonato",
                                      gridTypes: "Tipos de Grid",
                                      scoringSystems: "Sistemas de Pontuação",
                                      sponsors: "Patrocinadores",
                                      staff: "Equipe",
                                      asaasAccount: "Conta Asaas",
                                      analise: "Análises",
                                    };
                                    return (
                                      <Badge
                                        key={key}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {permissionLabels[key] || key}
                                      </Badge>
                                    );
                                  }
                                  return null;
                                },
                              )}
                              {Object.values(member.permissions).every(
                                (v) => !v,
                              ) && (
                                <span className="text-xs text-muted-foreground">
                                  Nenhuma permissão específica
                                </span>
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

      {/* Modal de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>
                "
                {memberToDelete?.user.name
                  ? formatName(memberToDelete.user.name)
                  : "Usuário"}
                "
              </strong>{" "}
              da equipe?
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
      <Dialog
        open={showPermissionsDialog}
        onOpenChange={setShowPermissionsDialog}
      >
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Configure as permissões de acesso para{" "}
              <strong>
                "
                {memberToEdit?.user.name
                  ? formatName(memberToEdit.user.name)
                  : "Usuário"}
                "
              </strong>
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
              {permissionOrder.map((key) => (
                <div className="flex items-center space-x-2" key={key}>
                  <Checkbox
                    id={key}
                    checked={
                      permissions[key as keyof StaffPermissionsWithAnalise] ||
                      false
                    }
                    onCheckedChange={(checked) =>
                      handlePermissionChange(
                        key as keyof StaffPermissionsWithAnalise,
                        checked as boolean,
                      )
                    }
                  />
                  <label
                    htmlFor={key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permissionLabels[key]}
                  </label>
                </div>
              ))}
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
