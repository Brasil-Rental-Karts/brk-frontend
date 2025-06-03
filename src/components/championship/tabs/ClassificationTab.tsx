import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClassificationEntry {
  position: number;
  pilotId: string;
  pilotName: string;
  pilotAvatar?: string;
  category: string;
  totalPoints: number;
  victories: number;
  podiums: number;
  participations: number;
  bestPosition: number;
}

interface ClassificationTabProps {
  championshipId: string;
}

/**
 * Componente da aba Classificação
 * Exibe a classificação geral do campeonato por categoria
 */
export const ClassificationTab = ({ championshipId: _championshipId }: ClassificationTabProps) => {
  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data - substituir por dados reais da API
  const [classification] = useState<ClassificationEntry[]>([
    {
      position: 1,
      pilotId: "1",
      pilotName: "João Silva",
      category: "Sênior",
      totalPoints: 285,
      victories: 4,
      podiums: 6,
      participations: 8,
      bestPosition: 1,
    },
    {
      position: 2,
      pilotId: "2",
      pilotName: "Maria Santos",
      category: "Sênior",
      totalPoints: 268,
      victories: 3,
      podiums: 5,
      participations: 8,
      bestPosition: 1,
    },
    {
      position: 3,
      pilotId: "3",
      pilotName: "Pedro Oliveira",
      category: "Sênior",
      totalPoints: 245,
      victories: 2,
      podiums: 4,
      participations: 7,
      bestPosition: 1,
    },
    {
      position: 4,
      pilotId: "4",
      pilotName: "Ana Costa",
      category: "Júnior",
      totalPoints: 220,
      victories: 1,
      podiums: 3,
      participations: 6,
      bestPosition: 2,
    },
    {
      position: 5,
      pilotId: "5",
      pilotName: "Carlos Ferreira",
      category: "Master",
      totalPoints: 198,
      victories: 1,
      podiums: 2,
      participations: 8,
      bestPosition: 2,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const categories = ["Todas", "Mirim", "Cadete", "Júnior", "Sênior", "Master"];

  const filteredClassification = selectedCategory === "Todas" 
    ? classification 
    : classification.filter(entry => entry.category === selectedCategory);

  const handleExportClassification = () => {
    console.log("Exportar classificação");
    // TODO: Implementar exportação da classificação
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{position}º</span>;
    }
  };

  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case 3:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getPilotInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (classification.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma classificação disponível"
        description="A classificação será exibida após o início das corridas"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Classificação Geral</h2>
          <p className="text-muted-foreground">
            Ranking dos pilotos por pontuação acumulada
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Filtro por categoria */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <Button onClick={handleExportClassification} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabela de classificação */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos.</TableHead>
              <TableHead>Piloto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center">Pontos</TableHead>
              <TableHead className="text-center">Vitórias</TableHead>
              <TableHead className="text-center">Pódios</TableHead>
              <TableHead className="text-center">Participações</TableHead>
              <TableHead className="text-center">Melhor Pos.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClassification.map((entry) => (
              <TableRow key={entry.pilotId} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center justify-center">
                    {getPositionIcon(entry.position)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={entry.pilotAvatar} 
                        alt={`Avatar ${entry.pilotName}`}
                      />
                      <AvatarFallback className="text-xs">
                        {getPilotInitials(entry.pilotName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{entry.pilotName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {entry.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-lg">{entry.totalPoints}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{entry.victories}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{entry.podiums}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-muted-foreground">{entry.participations}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="secondary"
                    className={getPositionBadgeColor(entry.bestPosition)}
                  >
                    {entry.bestPosition}º
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Informações adicionais */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {classification.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Pilotos Classificados
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {Math.max(...classification.map(c => c.participations))}
            </div>
            <div className="text-sm text-muted-foreground">
              Etapas Realizadas
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {Math.max(...classification.map(c => c.totalPoints))}
            </div>
            <div className="text-sm text-muted-foreground">
              Maior Pontuação
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 