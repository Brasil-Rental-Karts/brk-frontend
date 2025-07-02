import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DynamicForm } from "@/components/ui/dynamic-form";
import { FormSectionConfig } from "@/components/ui/dynamic-form";
import { 
  fetchCitiesByState, 
  states,
  City 
} from "@/utils/ibge";
import { RaceTrackService } from "@/lib/services/race-track.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, Button } from "brk-design-system";
import { Input } from "brk-design-system";
import { Label } from "brk-design-system";
import { Textarea } from "brk-design-system";
import { Plus, X } from "lucide-react";

interface TrackLayout {
  name: string;
  length: number;
  description: string;
}

interface DefaultFleet {
  name: string;
  kartQuantity: number;
}

export const CreateRaceTrack = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [cities, setCities] = useState<City[]>([]);
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [trackLayouts, setTrackLayouts] = useState<TrackLayout[]>([
    { name: "Traçado Principal", length: 1000, description: "" }
  ]);
  const [defaultFleets, setDefaultFleets] = useState<DefaultFleet[]>([
    { name: "Frota 1", kartQuantity: 10 }
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const isEditing = !!id;

  const loadCities = useCallback(async (uf: string) => {
    try {
      const citiesData = await fetchCitiesByState(uf);
      setCities(citiesData);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      setCities([]);
    }
  }, []);

  const handleFieldChange = useCallback(async (fieldId: string, value: any, formData: any) => {
    if (fieldId === "state" && value) {
      await loadCities(value);
    }
  }, [loadCities]);

  const fetchData = useCallback(async () => {
    if (isEditing && id) {
      try {
        const data = await RaceTrackService.getById(id);
        return data;
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        throw error;
      }
    }
    return null;
  }, [isEditing, id]);

  const updateData = useCallback(async (id: string, data: any) => {
    const processedData = {
      ...data,
      trackLayouts,
      defaultFleets,
      isActive: data.isActive === "true" || data.isActive === true
    };

    if (isEditing) {
      return await RaceTrackService.update(id, processedData);
    } else {
      return await RaceTrackService.create(processedData);
    }
  }, [isEditing, trackLayouts, defaultFleets]);

  const transformInitialData = useCallback((data: any) => {
    if (data?.state) {
      loadCities(data.state);
    }
    
    if (data?.trackLayouts && data.trackLayouts.length > 0) {
      setTrackLayouts(data.trackLayouts);
    }
    
    if (data?.defaultFleets && data.defaultFleets.length > 0) {
      setDefaultFleets(data.defaultFleets);
    }

    return {
      ...data,
      name: data?.name || "",
      city: data?.city || "",
      state: data?.state || "",
      address: data?.address || "",
      generalInfo: data?.generalInfo || "",
      isActive: data?.isActive !== undefined ? data.isActive.toString() : "true"
    };
  }, [loadCities]);

  const transformSubmitData = (data: any) => {
    return {
      ...data,
      isActive: data.isActive === "true"
    };
  };

  const onSuccess = () => {
    toast.success(isEditing ? 'Kartódromo atualizado com sucesso!' : 'Kartódromo criado com sucesso!');
    navigate('/admin?tab=race-tracks', { replace: true });
  };

  const onCancel = () => {
    navigate('/admin?tab=race-tracks');
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const data = await fetchData();
        if (data) {
          const transformedData = transformInitialData(data);
          setInitialData(transformedData);
        } else {
          setInitialData({
            name: "",
            city: "",
            state: "",
            address: "",
            generalInfo: "",
            isActive: "true"
          });
        }
      } catch (error) {
        toast.error('Erro ao carregar dados do kartódromo');
        navigate('/admin?tab=race-tracks');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [fetchData, transformInitialData, navigate]);

  // Funções para gerenciar traçados
  const addTrackLayout = () => {
    setTrackLayouts(prev => [
      ...prev,
      { name: `Traçado ${prev.length + 1}`, length: 1000, description: "" }
    ]);
  };

  const removeTrackLayout = (index: number) => {
    if (trackLayouts.length <= 1) {
      toast.error('Pelo menos um traçado deve ser mantido');
      return;
    }
    setTrackLayouts(prev => prev.filter((_, i) => i !== index));
  };

  const updateTrackLayout = (index: number, field: keyof TrackLayout, value: any) => {
    setTrackLayouts(prev => prev.map((track, i) => 
      i === index ? { ...track, [field]: value } : track
    ));
  };

  // Funções para gerenciar frotas
  const addDefaultFleet = () => {
    setDefaultFleets(prev => [
      ...prev,
      { name: `Frota ${prev.length + 1}`, kartQuantity: 10 }
    ]);
  };

  const removeDefaultFleet = (index: number) => {
    if (defaultFleets.length <= 1) {
      toast.error('Pelo menos uma frota deve ser mantida');
      return;
    }
    setDefaultFleets(prev => prev.filter((_, i) => i !== index));
  };

  const updateDefaultFleet = (index: number, field: keyof DefaultFleet, value: any) => {
    setDefaultFleets(prev => prev.map((fleet, i) => 
      i === index ? { ...fleet, [field]: value } : fleet
    ));
  };

  const handleSubmit = async (formData: any) => {
    // Validar se há pelo menos um traçado e uma frota
    if (trackLayouts.length === 0) {
      toast.error('Pelo menos um traçado deve ser configurado');
      return;
    }
    if (defaultFleets.length === 0) {
      toast.error('Pelo menos uma frota deve ser configurada');
      return;
    }

    setSaving(true);
    try {
      const transformedData = transformSubmitData(formData);
      await updateData(id || "new", transformedData);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar kartódromo');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const config: FormSectionConfig[] = [
      {
        section: "Informações Básicas",
        detail: "Dados principais do kartódromo",
        fields: [
          {
            id: "name",
            name: "Nome do Kartódromo",
            type: "input",
            mandatory: true,
            max_char: 100,
            placeholder: "Digite o nome do kartódromo"
          },
          {
            id: "state",
            name: "Estado",
            type: "select",
            mandatory: true,
            options: states.map(state => ({ value: state, description: state })),
            inline: true,
            inlineGroup: "location"
          },
          {
            id: "city",
            name: "Cidade",
            type: "select",
            mandatory: true,
            options: cities.map(city => ({ value: city.nome, description: city.nome })),
            inline: true,
            inlineGroup: "location"
          },
          {
            id: "address",
            name: "Endereço Completo",
            type: "textarea",
            mandatory: true,
            max_char: 500,
            placeholder: "Digite o endereço completo do kartódromo"
          },
          {
            id: "generalInfo",
            name: "Informações Gerais",
            type: "textarea",
            mandatory: false,
            max_char: 1000,
            placeholder: "Informações adicionais sobre o kartódromo..."
          },
          {
            id: "isActive",
            name: "Kartódromo Ativo",
            type: "select",
            mandatory: false,
            options: [
              { value: "true", description: "Sim" },
              { value: "false", description: "Não" }
            ]
          }
        ]
      }
    ];

    setFormConfig(config);
  }, [cities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando kartódromo...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? "Editar Kartódromo" : "Novo Kartódromo"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing 
                ? "Atualize as informações do kartódromo." 
                : "Cadastre um novo kartódromo no sistema."
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const formElement = document.getElementById('race-track-form') as HTMLFormElement;
                if (formElement) {
                  formElement.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
              disabled={saving}
            >
              {saving ? "Salvando..." : (isEditing ? "Atualizar kartódromo" : "Criar kartódromo")}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Formulário básico */}
        {initialData && (
          <DynamicForm
            config={formConfig}
            onSubmit={handleSubmit}
            onFieldChange={handleFieldChange}
            initialValues={initialData}
            showButtons={false}
            className="space-y-6"
            formId="race-track-form"
          />
        )}

        {/* Seção de Traçados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Traçados</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os traçados disponíveis no kartódromo
                </p>
              </div>
              <Button onClick={addTrackLayout} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Traçado
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trackLayouts.map((track, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Traçado {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrackLayout(index)}
                        disabled={trackLayouts.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={track.name}
                          onChange={(e) => updateTrackLayout(index, 'name', e.target.value)}
                          placeholder="Ex: Traçado Principal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Comprimento (metros) *</Label>
                        <Input
                          type="number"
                          value={track.length}
                          onChange={(e) => updateTrackLayout(index, 'length', parseInt(e.target.value) || 0)}
                          min="1"
                          placeholder="1000"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={track.description}
                        onChange={(e) => updateTrackLayout(index, 'description', e.target.value)}
                        placeholder="Descrição do traçado..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seção de Frotas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Frotas Padrão</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure as frotas disponíveis no kartódromo
                </p>
              </div>
              <Button onClick={addDefaultFleet} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Frota
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaultFleets.map((fleet, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Frota {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeDefaultFleet(index)}
                        disabled={defaultFleets.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={fleet.name}
                          onChange={(e) => updateDefaultFleet(index, 'name', e.target.value)}
                          placeholder="Ex: Frota 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade de Karts *</Label>
                        <Input
                          type="number"
                          value={fleet.kartQuantity}
                          onChange={(e) => updateDefaultFleet(index, 'kartQuantity', parseInt(e.target.value) || 0)}
                          min="1"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação no final */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              const formElement = document.getElementById('race-track-form') as HTMLFormElement;
              if (formElement) {
                formElement.dispatchEvent(new Event('submit', { bubbles: true }));
              }
            }}
            disabled={saving}
          >
            {saving ? "Salvando..." : (isEditing ? "Atualizar kartódromo" : "Criar kartódromo")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRaceTrack; 