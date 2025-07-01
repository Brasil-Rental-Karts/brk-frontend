import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "brk-design-system";
import { Card } from "brk-design-system";

import { Alert, AlertDescription, AlertTitle } from "brk-design-system";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Check, 
  X, 
  Trophy,
  Link as LinkIcon 
} from "lucide-react";
import { Stage } from "@/lib/types/stage";
import { StageParticipationService, StageParticipation } from "@/lib/services/stage-participation.service";
import { CategoryService } from "@/lib/services/category.service";
import { StageService } from "@/lib/services/stage.service";
import { Loading } from '@/components/ui/loading';

interface StageDetailsModalProps {
  stage: Stage | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryWithParticipants {
  id: string;
  name: string;
  ballast: number;
  participants: StageParticipation[];
  totalRegistered: number;
}

export const StageDetailsModal = ({ stage, isOpen, onClose }: StageDetailsModalProps) => {
  const [categories, setCategories] = useState<CategoryWithParticipants[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStageDetails = async (stageId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar participações da etapa
      const stageParticipations = await StageParticipationService.getStageParticipations(stageId);

      // Buscar todas as categorias da etapa
      const allCategories = await CategoryService.getAll();
      
      // Filtrar apenas as categorias que estão na etapa
      const stageCategories = allCategories.filter(category => 
        stage?.categoryIds.includes(category.id)
      );

      // Organizar participações por categoria
      const categoriesWithParticipants: CategoryWithParticipants[] = stageCategories.map(category => {
        const categoryParticipations = stageParticipations.filter(
          participation => participation.categoryId === category.id
        );

        return {
          id: category.id,
          name: category.name,
          ballast: category.ballast,
          participants: categoryParticipations,
          totalRegistered: categoryParticipations.length
        };
      });

      setCategories(categoriesWithParticipants);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes da etapa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage && isOpen) {
      fetchStageDetails(stage.id);
    }
  }, [stage, isOpen]);

  const getStatusBadge = (participation: StageParticipation) => {
    if (participation.status === 'confirmed') {
      return (
        <Badge variant="default" className="bg-green-500 text-xs">
          <Check className="h-3 w-3 mr-1" />
          Confirmado
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          Cancelado
        </Badge>
      );
    }
  };

  const formatDateTime = (date: string, time: string) => {
    return `${StageService.formatDate(date)} às ${StageService.formatTime(time)}`;
  };

  if (!stage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {stage.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes da etapa e participações por categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da etapa */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Informações da Etapa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(stage.date, stage.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{stage.kartodrome}</span>
              </div>
              {stage.kartodromeAddress && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm text-muted-foreground">{stage.kartodromeAddress}</span>
                </div>
              )}
              {stage.doublePoints && (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Pontuação em Dobro</Badge>
                </div>
              )}
              {stage.streamLink && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={stage.streamLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Link da Transmissão
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Participações por categoria */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participações por Categoria
            </h3>

            {loading ? (
              <div className="space-y-4">
                <Loading type="spinner" size="md" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar participações</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : categories.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Nenhuma participação encontrada</h4>
                <p className="text-sm text-muted-foreground">
                  Ainda não há pilotos confirmados para esta etapa.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        {category.name}
                        <Badge variant="outline" className="text-xs">
                          Lastro: {category.ballast}kg
                        </Badge>
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {category.totalRegistered} {category.totalRegistered === 1 ? 'piloto' : 'pilotos'}
                      </Badge>
                    </div>

                    {category.participants.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum piloto confirmado nesta categoria</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {category.participants.map((participation) => (
                          <div 
                            key={participation.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{participation.user.name}</p>
                                <p className="text-xs text-muted-foreground">{participation.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(participation)}
                              {participation.confirmedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(participation.confirmedAt).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 