import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Tag, Users, MoreVertical } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  description: string;
  minAge: number;
  maxAge: number;
  participants: number;
  maxParticipants: number;
  status: "Ativo" | "Inativo";
}

interface CategoriesTabProps {
  championshipId: string;
}

/**
 * Componente da aba Categorias
 * Exibe lista de categorias do campeonato com opções de gerenciamento
 */
export const CategoriesTab = ({ championshipId: _championshipId }: CategoriesTabProps) => {
  // TODO: Usar _championshipId para buscar dados reais da API
  // Mock data - substituir por dados reais da API
  const [categories] = useState<Category[]>([
    {
      id: "1",
      name: "Mirim",
      description: "Categoria para pilotos iniciantes",
      minAge: 8,
      maxAge: 12,
      participants: 25,
      maxParticipants: 30,
      status: "Ativo",
    },
    {
      id: "2",
      name: "Cadete",
      description: "Categoria intermediária",
      minAge: 13,
      maxAge: 17,
      participants: 35,
      maxParticipants: 40,
      status: "Ativo",
    },
    {
      id: "3",
      name: "Júnior",
      description: "Categoria para jovens pilotos",
      minAge: 18,
      maxAge: 25,
      participants: 28,
      maxParticipants: 35,
      status: "Ativo",
    },
    {
      id: "4",
      name: "Sênior",
      description: "Categoria principal",
      minAge: 26,
      maxAge: 45,
      participants: 42,
      maxParticipants: 50,
      status: "Ativo",
    },
    {
      id: "5",
      name: "Master",
      description: "Categoria para pilotos experientes",
      minAge: 46,
      maxAge: 99,
      participants: 18,
      maxParticipants: 25,
      status: "Ativo",
    },
  ]);

  const [sortBy, setSortBy] = useState<keyof Category>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof Category) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleAddCategory = () => {
    console.log("Adicionar nova categoria");
    // TODO: Implementar modal ou navegação para criação de categoria
  };

  const handleCategoryAction = (action: string, categoryId: string) => {
    console.log(`Ação: ${action} para categoria: ${categoryId}`);
    // TODO: Implementar ações específicas
  };

  const getStatusColor = (status: Category["status"]) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inativo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Nenhuma categoria criada"
        description="Crie suas primeiras categorias para organizar os participantes"
        action={{
          label: "Adicionar Categoria",
          onClick: handleAddCategory,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-muted-foreground">
            Gerencie as categorias de participação do campeonato
          </p>
        </div>
        <Button onClick={handleAddCategory} className="sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Categoria
        </Button>
      </div>

      {/* Tabela de categorias */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("name")}
              >
                Nome da Categoria
                {sortBy === "name" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("minAge")}
              >
                Faixa Etária
                {sortBy === "minAge" && (
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
            {categories.map((category) => (
              <TableRow key={category.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {category.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {category.description}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {category.minAge} - {category.maxAge === 99 ? "+" : category.maxAge} anos
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {category.participants}/{category.maxParticipants}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(category.status)}
                  >
                    {category.status}
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
                        onClick={() => handleCategoryAction("view", category.id)}
                      >
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCategoryAction("edit", category.id)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCategoryAction("participants", category.id)}
                      >
                        Ver participantes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCategoryAction("toggle", category.id)}
                      >
                        {category.status === "Ativo" ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCategoryAction("delete", category.id)}
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