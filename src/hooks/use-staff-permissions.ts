import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ChampionshipStaffService } from "@/lib/services/championship-staff.service";

export interface UserPermissions {
  seasons: boolean;
  categories: boolean;
  stages: boolean;
  pilots: boolean;
  classification: boolean;
  regulations: boolean;
  penalties: boolean;
  raceDay: boolean;
  editChampionship: boolean;
  gridTypes: boolean;
  scoringSystems: boolean;
  sponsors: boolean;
  staff: boolean;
  asaasAccount: boolean;
  analise: boolean;
}

export const useStaffPermissions = (championshipId: string) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user || !championshipId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar membros do staff para verificar se o usuário é owner ou tem permissões
        const staffMembers =
          await ChampionshipStaffService.getStaffMembers(championshipId);

        // Verificar se é owner
        const owner = staffMembers.find((member) => member.isOwner);
        if (owner && owner.user.id === user.id) {
          // Owner tem todas as permissões
          setPermissions({
            seasons: true,
            categories: true,
            stages: true,
            pilots: true,
            classification: true,
            regulations: true,
            penalties: true,
            raceDay: true,
            editChampionship: true,
            gridTypes: true,
            scoringSystems: true,
            sponsors: true,
            staff: true,
            asaasAccount: true,
            analise: true,
          });
          return;
        }

        // Verificar se é membro do staff
        const staffMember = staffMembers.find(
          (member) => !member.isOwner && member.user.id === user.id,
        );

        if (staffMember && staffMember.permissions) {
          // Mapear permissões do staff member
          setPermissions({
            seasons: staffMember.permissions.seasons || false,
            categories: staffMember.permissions.categories || false,
            stages: staffMember.permissions.stages || false,
            pilots: staffMember.permissions.pilots || false,
            classification: staffMember.permissions.classification || false,
            regulations: staffMember.permissions.regulations || false,
            penalties: staffMember.permissions.penalties || false,
            raceDay: staffMember.permissions.raceDay || false,
            editChampionship: staffMember.permissions.editChampionship || false,
            gridTypes: staffMember.permissions.gridTypes || false,
            scoringSystems: staffMember.permissions.scoringSystems || false,
            sponsors: staffMember.permissions.sponsors || false,
            staff: staffMember.permissions.staff || false,
            asaasAccount: staffMember.permissions.asaasAccount || false,
            analise: staffMember.permissions.analise || false,
          });
        } else {
          // Usuário não tem permissões específicas
          setPermissions({
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
          });
        }
      } catch (err) {
        console.error("Erro ao carregar permissões:", err);
        setError(
          err instanceof Error ? err.message : "Erro ao carregar permissões",
        );
        // Em caso de erro, não dar permissões
        setPermissions({
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
        });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user, championshipId]);

  return { permissions, loading, error };
};
