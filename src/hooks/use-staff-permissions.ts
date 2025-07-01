import { useState, useEffect } from 'react';
import { ChampionshipStaffService, StaffPermissions } from '@/lib/services/championship-staff.service';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPermissions {
  seasons: boolean;
  categories: boolean;
  stages: boolean;
  pilots: boolean;
  regulations: boolean;
  editChampionship: boolean;
  gridTypes: boolean;
  scoringSystems: boolean;
  sponsors: boolean;
  staff: boolean;
  asaasAccount: boolean;
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
        const staffMembers = await ChampionshipStaffService.getStaffMembers(championshipId);
        
        // Verificar se é owner
        const owner = staffMembers.find(member => member.isOwner);
        if (owner && owner.user.id === user.id) {
          // Owner tem todas as permissões
          setPermissions({
            seasons: true,
            categories: true,
            stages: true,
            pilots: true,
            regulations: true,
            editChampionship: true,
            gridTypes: true,
            scoringSystems: true,
            sponsors: true,
            staff: true,
            asaasAccount: true
          });
          return;
        }

        // Verificar se é membro do staff
        const staffMember = staffMembers.find(member => 
          !member.isOwner && member.user.id === user.id
        );

        if (staffMember && staffMember.permissions) {
          // Mapear permissões do staff member
          setPermissions({
            seasons: staffMember.permissions.seasons || false,
            categories: staffMember.permissions.categories || false,
            stages: staffMember.permissions.stages || false,
            pilots: staffMember.permissions.pilots || false,
            regulations: staffMember.permissions.regulations || false,
            editChampionship: staffMember.permissions.editChampionship || false,
            gridTypes: staffMember.permissions.gridTypes || false,
            scoringSystems: staffMember.permissions.scoringSystems || false,
            sponsors: staffMember.permissions.sponsors || false,
            staff: staffMember.permissions.staff || false,
            asaasAccount: staffMember.permissions.asaasAccount || false
          });
        } else {
          // Usuário não tem permissões específicas
          setPermissions({
            seasons: false,
            categories: false,
            stages: false,
            pilots: false,
            regulations: false,
            editChampionship: false,
            gridTypes: false,
            scoringSystems: false,
            sponsors: false,
            staff: false,
            asaasAccount: false
          });
        }
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar permissões');
        // Em caso de erro, não dar permissões
        setPermissions({
          seasons: false,
          categories: false,
          stages: false,
          pilots: false,
          regulations: false,
          editChampionship: false,
          gridTypes: false,
          scoringSystems: false,
          sponsors: false,
          staff: false,
          asaasAccount: false
        });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user, championshipId]);

  return { permissions, loading, error };
}; 