import { Button } from "brk-design-system";
import { Avatar, AvatarFallback, AvatarImage } from "brk-design-system";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "brk-design-system";
import { Settings, CreditCard, Trophy, ChevronDown, Award, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Championship } from "@/lib/services/championship.service";
import { UserPermissions } from "@/hooks/use-staff-permissions";

interface ChampionshipHeaderProps {
  championship: Championship;
  permissions?: UserPermissions;
}

/**
 * Header da página do campeonato
 * Exibe avatar, nome, link para página pública e botão de configurações com dropdown
 */
export const ChampionshipHeader = ({ championship, permissions }: ChampionshipHeaderProps) => {
  const navigate = useNavigate();

  const handleViewPublicPage = () => {
    const siteUrl = import.meta.env.VITE_SITE_URL;
    window.location.href = `${siteUrl}/campeonato/${championship.slug}`;
  };

  const handleConfigurationOption = (option: 'grid-types' | 'scoring-systems' | 'asaas-account' | 'edit-data' | 'sponsors' | 'staff') => {
    navigate(`/championship/${championship.id}?tab=${option}`);
  };

  // Gerar iniciais do nome do campeonato para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-dark-900 text-white w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="container px-6 py-4">
        {/* Layout Desktop */}
        <div className="hidden md:flex items-center justify-between">
          {/* Avatar e nome */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              <AvatarImage 
                src={`/api/championships/${championship.id}/avatar`} 
                alt={`Avatar ${championship.name}`}
              />
              <AvatarFallback className="text-sm font-bold text-black bg-white">
                {getInitials(championship.name)}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold">
              {championship.name}
            </h1>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPublicPage}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent"
            >
              Visitar Página
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {permissions?.editChampionship && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('edit-data')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Editar Dados
                  </DropdownMenuItem>
                )}
                {permissions?.sponsors && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('sponsors')}
                    className="flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Patrocinadores
                  </DropdownMenuItem>
                )}
                {permissions?.staff && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('staff')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Equipe
                  </DropdownMenuItem>
                )}
                {permissions?.gridTypes && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('grid-types')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Tipos de Grid
                  </DropdownMenuItem>
                )}
                {permissions?.scoringSystems && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('scoring-systems')}
                    className="flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Sistema de Pontuação
                  </DropdownMenuItem>
                )}
                {permissions?.asaasAccount && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('asaas-account')}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Conta Asaas
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Layout Mobile */}
        <div className="md:hidden space-y-4">
          {/* Linha 1: Avatar e nome */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage 
                src={`/api/championships/${championship.id}/avatar`} 
                alt={`Avatar ${championship.name}`}
              />
              <AvatarFallback className="text-xs font-bold text-black bg-white">
                {getInitials(championship.name)}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-lg font-bold flex-1 min-w-0">
              <span className="truncate block">{championship.name}</span>
            </h1>
          </div>

          {/* Linha 2: Botões */}
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPublicPage}
              className="flex-1 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent text-xs"
            >
              Visitar Página
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent text-xs"
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Configurações
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {permissions?.editChampionship && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('edit-data')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Editar Dados
                  </DropdownMenuItem>
                )}
                {permissions?.sponsors && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('sponsors')}
                    className="flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Patrocinadores
                  </DropdownMenuItem>
                )}
                {permissions?.staff && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('staff')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Equipe
                  </DropdownMenuItem>
                )}
                {permissions?.gridTypes && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('grid-types')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Tipos de Grid
                  </DropdownMenuItem>
                )}
                {permissions?.scoringSystems && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('scoring-systems')}
                    className="flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Sistema de Pontuação
                  </DropdownMenuItem>
                )}
                {permissions?.asaasAccount && (
                  <DropdownMenuItem 
                    onClick={() => handleConfigurationOption('asaas-account')}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Conta Asaas
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}; 