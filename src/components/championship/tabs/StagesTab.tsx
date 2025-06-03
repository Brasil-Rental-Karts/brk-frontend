import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Calendar, MapPin, Flag, MoreVertical } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Stage {
  id: string;
  name: string;
  seasonName: string;
  date: string;
  location: string;
  status: "Agendado" | "Em andamento" | "Concluído" | "Cancelado";
  participants: number;
  trackLayout?: string;
}

interface StagesTabProps {
  championshipId: string;
}

/**
 * Componente da aba Etapas
 * Exibe lista de etapas do campeonato com opções de gerenciamento
 */
export const StagesTab = ({ championshipId: _championshipId }: StagesTabProps) => {
  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data - substituir por dados reais da API
  const [stages] = useState<Stage[]>([
    {
      id: "1",
      name: "1ª Etapa",
      seasonName: "Temporada 2025/1",
      date: "2025-03-15",
      location: "Kartódromo Granja Viana",
      status: "Agendado",
      participants: 85,
      trackLayout: "Configuração A",
    },
    {
      id: "2",
      name: "2ª Etapa", 
      seasonName: "Temporada 2025/1",
      date: "2025-04-12",
      location: "Kartódromo Aldeia da Serra",
      status: "Agendado",
      participants: 92,
      trackLayout: "Configuração B",
    },
    {
      id: "3",
      name: "3ª Etapa",
      seasonName: "Temporada 2024/2",
      date: "2024-12-20",
      location: "Kartódromo Granja Viana",
      status: "Concluído",
      participants: 78,
      trackLayout: "Configuração A",
    },
  ]);

  const [sortBy, setSortBy] = useState<keyof Stage>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (column: keyof Stage) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddStage = () => {
    console.log("Adicionar nova etapa");
    // TODO: Implementar modal ou navegação para criação de etapa
  };

  const handleStageAction = (action: string, stageId: string) => {
    console.log(`Ação: ${action} para etapa: ${stageId}`);
    // TODO: Implementar ações específicas
  };

  const getStatusColor = (status: Stage["status"]) => {
    switch (status) {
      case "Agendado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Em andamento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      weekday: "short",
    });
  };

  if (stages.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="Nenhuma etapa criada"
        description="Crie sua primeira etapa para começar a organizar as corridas"
        action={{
          label: "Adicionar Etapa",
          onClick: handleAddStage,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Etapas</h2>
          <p className="text-muted-foreground">
            Gerencie as etapas e corridas do seu campeonato
          </p>
        </div>
        <Button onClick={handleAddStage} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Etapa
        </Button>
      </div>

      {/* Tabela de etapas */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("name")}
              >
                Etapa
                {sortBy === "name" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Temporada</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("date")}
              >
                Data
                {sortBy === "date" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("location")}
              >
                Local
                {sortBy === "location" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("participants")}
              >
                Participantes
                {sortBy === "participants" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                Status
                {sortBy === "status" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stages.map((stage) => (
              <TableRow key={stage.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div>{stage.name}</div>
                      {stage.trackLayout && (
                        <div className="text-xs text-muted-foreground">
                          {stage.trackLayout}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {stage.seasonName}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {formatDate(stage.date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {stage.location}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{stage.participants}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(stage.status)}
                  >
                    {stage.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStageAction("view", stage.id)}
                      >
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStageAction("edit", stage.id)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStageAction("results", stage.id)}
                      >
                        Gerenciar resultados
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStageAction("participants", stage.id)}
                      >
                        Ver participantes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStageAction("delete", stage.id)}
                        className="text-destructive"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}; 