import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "brk-design-system";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { RaceTrackService, RaceTrack } from "@/lib/services/race-track.service";
import { toast } from "sonner";

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
      toast.error('Erro ao carregar kartódromos');
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
      toast.success('Kartódromo excluído com sucesso');
      loadRaceTracks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir kartódromo');
    } finally {
      setShowDeleteDialog(false);
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await RaceTrackService.toggleActive(id);
      toast.success('Status alterado com sucesso');
      loadRaceTracks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
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
    <div className="space-y-6">
      {/* Race Tracks List */}
      <div className="grid gap-4">
        {raceTracks.map((raceTrack) => (
          <Card key={raceTrack.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <CardTitle className="text-lg">{raceTrack.name}</CardTitle>
                    <CardDescription>
                      {raceTrack.city} - {raceTrack.state}
                    </CardDescription>
                  </div>
                  <Badge variant={raceTrack.isActive ? "default" : "secondary"}>
                    {raceTrack.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(raceTrack.id)}
                  >
                    {raceTrack.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(raceTrack)}
                    title="Editar kartódromo"
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeletingId(raceTrack.id);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Endereço:</strong>
                  <p className="text-muted-foreground">{raceTrack.address}</p>
                </div>
                <div>
                  <strong>Traçados:</strong>
                  <p className="text-muted-foreground">
                    {raceTrack.trackLayouts.length} traçados
                  </p>
                </div>
                <div>
                  <strong>Frotas:</strong>
                  <p className="text-muted-foreground">
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
                <p>Nenhum kartódromo cadastrado</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => navigate('/admin/race-tracks/create')}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir este kartódromo? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingId(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
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