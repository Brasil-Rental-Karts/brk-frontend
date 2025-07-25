import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "brk-design-system";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { useChampionships } from "@/hooks/use-championships";

import { useCreditCardFees } from "../hooks/use-credit-card-fees";
import { useIsMobile } from "../hooks/use-mobile";
import {
  CreateCreditCardFeesData,
  CreditCardFees,
} from "../lib/services/credit-card-fees.service";

// Função utilitária para converter valores decimal para número
const toNumber = (value: number | string): number => {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
};

export default function CreditCardFeesAdmin() {
  const { fees, loading, error, fetchFees, createFee, updateFee, deleteFee } =
    useCreditCardFees();
  const { championships, fetchChampionships } = useChampionships();
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingFee, setEditingFee] = useState<CreditCardFees | null>(null);
  const [formData, setFormData] = useState<CreateCreditCardFeesData>({
    championshipId: "",
    installmentRange: "",
    percentageRate: 0,
    fixedFee: 0.49,
    description: "",
    isActive: true,
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchFees();
    fetchChampionships();
  }, []);

  const filteredFees = selectedChampionship
    ? fees.filter((fee) => fee.championshipId === selectedChampionship)
    : fees;

  const getChampionshipName = (championshipId: string) => {
    const championship = championships.find(
      (c: any) => c.id === championshipId,
    );
    return championship?.name || "Campeonato não encontrado";
  };

  // Ordenação por campeonato e parcelas
  const sortedFees = [...filteredFees].sort((a, b) => {
    const champA = getChampionshipName(a.championshipId).toLowerCase();
    const champB = getChampionshipName(b.championshipId).toLowerCase();
    if (champA < champB) return -1;
    if (champA > champB) return 1;
    // Se for o mesmo campeonato, ordenar pelo início do range de parcelas
    const getFirstInstallment = (range: string) => {
      const match = range.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    const aFirst = getFirstInstallment(a.installmentRange);
    const bFirst = getFirstInstallment(b.installmentRange);
    return aFirst - bFirst;
  });

  const handleCreate = async () => {
    try {
      await createFee(formData);
      setShowCreateForm(false);
      setFormData({
        championshipId: "",
        installmentRange: "",
        percentageRate: 0,
        fixedFee: 0.49,
        description: "",
        isActive: true,
      });
      toast.success("Taxa criada com sucesso!");
    } catch (err) {
      toast.error("Erro ao criar taxa");
    }
  };

  const handleEdit = async () => {
    if (!editingFee) return;

    try {
      await updateFee(editingFee.id, formData);
      setShowEditForm(false);
      setEditingFee(null);
      setFormData({
        championshipId: "",
        installmentRange: "",
        percentageRate: 0,
        fixedFee: 0.49,
        description: "",
        isActive: true,
      });
      toast.success("Taxa atualizada com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar taxa");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta taxa?")) {
      try {
        await deleteFee(id);
        toast.success("Taxa removida com sucesso!");
      } catch (err) {
        toast.error("Erro ao remover taxa");
      }
    }
  };

  const openEditForm = (fee: CreditCardFees) => {
    setEditingFee(fee);
    setFormData({
      championshipId: fee.championshipId,
      installmentRange: fee.installmentRange,
      percentageRate: toNumber(fee.percentageRate),
      fixedFee: toNumber(fee.fixedFee),
      description: fee.description || "",
      isActive: fee.isActive,
    });
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Configuração de Taxas do Cartão de Crédito
          </h1>
          <p className="text-muted-foreground">
            Gerencie as taxas do cartão de crédito para cada campeonato
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Taxa
        </Button>
      </div>

      <div className="mb-4">
        <label
          htmlFor="championshipFilter"
          className="block text-sm font-medium mb-2"
        >
          Filtrar por Campeonato
        </label>
        <select
          id="championshipFilter"
          value={selectedChampionship}
          onChange={(e) => setSelectedChampionship(e.target.value)}
          className="w-64 p-2 border border-gray-300 rounded-md"
        >
          <option value="">Todos os campeonatos</option>
          {championships.map((championship: any) => (
            <option key={championship.id} value={championship.id}>
              {championship.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Formulário de criação */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Criar Nova Taxa</CardTitle>
            <CardDescription>
              Configure uma nova taxa para um campeonato específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="championshipId"
                  className="block text-sm font-medium mb-2"
                >
                  Campeonato
                </label>
                <select
                  id="championshipId"
                  value={formData.championshipId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      championshipId: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um campeonato</option>
                  {championships.map((championship: any) => (
                    <option key={championship.id} value={championship.id}>
                      {championship.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="installmentRange"
                  className="block text-sm font-medium mb-2"
                >
                  Range de Parcelas
                </label>
                <input
                  id="installmentRange"
                  type="text"
                  value={formData.installmentRange}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      installmentRange: e.target.value,
                    }))
                  }
                  placeholder="Ex: 1, 2-6, 7-12, 13-21"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="percentageRate"
                  className="block text-sm font-medium mb-2"
                >
                  Taxa Percentual (%)
                </label>
                <input
                  id="percentageRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentageRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      percentageRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Ex: 1.99"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="fixedFee"
                  className="block text-sm font-medium mb-2"
                >
                  Taxa Fixa (R$)
                </label>
                <input
                  id="fixedFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixedFee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fixedFee: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Ex: 0.49"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Descrição
                </label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: À vista, 2 a 6 parcelas"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Ativo
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de edição */}
      {showEditForm && editingFee && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Editar Taxa</CardTitle>
            <CardDescription>Atualize as configurações da taxa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="editInstallmentRange"
                  className="block text-sm font-medium mb-2"
                >
                  Range de Parcelas
                </label>
                <input
                  id="editInstallmentRange"
                  type="text"
                  value={formData.installmentRange}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      installmentRange: e.target.value,
                    }))
                  }
                  placeholder="Ex: 1, 2-6, 7-12, 13-21"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="editPercentageRate"
                  className="block text-sm font-medium mb-2"
                >
                  Taxa Percentual (%)
                </label>
                <input
                  id="editPercentageRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentageRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      percentageRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Ex: 1.99"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="editFixedFee"
                  className="block text-sm font-medium mb-2"
                >
                  Taxa Fixa (R$)
                </label>
                <input
                  id="editFixedFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixedFee}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fixedFee: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Ex: 0.49"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="editDescription"
                  className="block text-sm font-medium mb-2"
                >
                  Descrição
                </label>
                <input
                  id="editDescription"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: À vista, 2 a 6 parcelas"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="editIsActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <label htmlFor="editIsActive" className="text-sm font-medium">
                  Ativo
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingFee(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isMobile ? (
        <div className="grid gap-4">
          {sortedFees.map((fee) => (
            <Card key={fee.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getChampionshipName(fee.championshipId)}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          fee.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {fee.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {fee.description || `Range: ${fee.installmentRange}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(fee)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(fee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Range de Parcelas
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {fee.installmentRange}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Taxa Percentual
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {toNumber(fee.percentageRate).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Taxa Fixa</label>
                    <p className="text-sm text-muted-foreground">
                      R$ {toNumber(fee.fixedFee).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex items-center gap-2">
                      {fee.isActive ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {fee.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Campeonato
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Range de Parcelas
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Taxa Percentual
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Taxa Fixa
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Descrição
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFees.map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    {getChampionshipName(fee.championshipId)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {fee.installmentRange}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {toNumber(fee.percentageRate).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    R$ {toNumber(fee.fixedFee).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {fee.description || "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${fee.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {fee.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(fee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(fee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFees.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma taxa encontrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
