import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "brk-design-system";
import { MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { RaceTrack, RaceTrackService } from "@/lib/services/race-track.service";

export const RaceTrackManagement = () => {
  const navigate = useNavigate();
  const [raceTracks, setRaceTracks] = useState<RaceTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadRaceTracks();
  }, []);

  const loadRaceTracks = async () => {
    setLoading(true);
    try {
      const raceTracks = await RaceTrackService.getAll();
      setRaceTracks(raceTracks);
    } catch (error) {
      toast.error("Erro ao carregar kartódromos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (raceTrack: RaceTrack) => {
    navigate(`/admin/race-tracks/edit/${raceTrack.id}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await RaceTrackService.delete(deletingId);
      toast.success("Kartódromo excluído com sucesso");
      loadRaceTracks();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao excluir kartódromo",
      );
    } finally {
      setShowDeleteDialog(false);
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await RaceTrackService.toggleActive(id);
      toast.success("Status alterado com sucesso");
      loadRaceTracks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao alterar status");
    }
  };

  const handleRaceTrackAction = (action: string, raceTrack: RaceTrack) => {
    switch (action) {
      case "edit":
        handleEdit(raceTrack);
        break;
      case "toggle":
        handleToggleActive(raceTrack.id);
        break;
      case "delete":
        setDeletingId(raceTrack.id);
        setShowDeleteDialog(true);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando kartódromos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Race Tracks List */}
      <div className="grid gap-3 sm:gap-4">
        {raceTracks.map((raceTrack) => (
          <Card key={raceTrack.id}>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">
                      {raceTrack.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {raceTrack.city} - {raceTrack.state}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={raceTrack.isActive ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {raceTrack.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center justify-end sm:justify-start space-x-2 relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleRaceTrackAction("edit", raceTrack)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleRaceTrackAction("toggle", raceTrack)
                        }
                      >
                        {raceTrack.isActive ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleRaceTrackAction("delete", raceTrack)
                        }
                        className="text-destructive"
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <strong className="text-xs sm:text-sm">Endereço:</strong>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                    {raceTrack.address}
                  </p>
                </div>
                <div>
                  <strong className="text-xs sm:text-sm">Traçados:</strong>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                    {raceTrack.trackLayouts.length} traçados
                  </p>
                </div>
                <div>
                  <strong className="text-xs sm:text-sm">Frotas:</strong>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                    {raceTrack.defaultFleets.length} frotas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {raceTracks.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p className="text-sm sm:text-base">
                  Nenhum kartódromo cadastrado
                </p>
                <Button
                  variant="outline"
                  className="mt-2 w-full sm:w-auto"
                  onClick={() => navigate("/admin/race-tracks/create")}
                >
                  Cadastrar primeiro kartódromo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-4 sm:p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
              Tem certeza que deseja excluir este kartódromo? Esta ação não pode
              ser desfeita.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingId(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full sm:w-auto"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
