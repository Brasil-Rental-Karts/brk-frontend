import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { Championship } from "@/lib/services/championship.service";

interface ChampionshipHeaderProps {
  championship: Championship;
}

/**
 * Header da página do campeonato
 * Exibe avatar, nome, link para página pública e botão de configurações
 */
export const ChampionshipHeader = ({ championship }: ChampionshipHeaderProps) => {
  const handleViewPublicPage = () => {
    // TODO: Implementar navegação para página pública
    window.open(`/public/championship/${championship.id}`, '_blank');
  };

  const handleSettings = () => {
    // TODO: Implementar navegação para configurações

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
    <div className="bg-dark-900 text-white w-full">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between">
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
            
            <h1 className="text-xl md:text-2xl font-bold">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettings}
              className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-transparent"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 