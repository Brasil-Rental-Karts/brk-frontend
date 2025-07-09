import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from 'brk-design-system';
import { Input } from 'brk-design-system';
import { Label } from 'brk-design-system';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'brk-design-system';
import { Alert, AlertDescription } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'brk-design-system';
import { Calendar, CreditCard, RefreshCw, AlertTriangle, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { usePaymentManagement } from '@/hooks/use-payment-management';
import { OverduePayment } from '@/lib/services/payment-management.service';
import { formatCurrency } from '@/utils/currency';
import { formatDateToBrazilian } from '@/utils/date';

export const OverduePaymentsTable = () => {
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<OverduePayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<OverduePayment | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'value' | 'registrationId'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { loading, error, getAllOverduePayments, reactivateOverduePayment } = usePaymentManagement();

  useEffect(() => {
    loadOverduePayments();
  }, []);

  useEffect(() => {
    filterAndSortPayments();
  }, [overduePayments, searchTerm, sortBy, sortOrder]);

  const loadOverduePayments = async () => {
    try {
      const payments = await getAllOverduePayments();
      setOverduePayments(payments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos vencidos:', error);
    }
  };

  const filterAndSortPayments = () => {
    let filtered = overduePayments;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.registration?.user?.name && payment.registration.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.registration?.user?.email && payment.registration.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.registration?.season?.championship?.name && payment.registration.season.championship.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.registration?.season?.name && payment.registration.season.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'registrationId':
          aValue = a.registrationId;
          bValue = b.registrationId;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPayments(filtered);
  };

  const handleReactivatePayment = async () => {
    if (!selectedPayment || !newDueDate) return;

    try {
      await reactivateOverduePayment(selectedPayment.id, newDueDate);
      setIsDialogOpen(false);
      setSelectedPayment(null);
      setNewDueDate('');
      
      // Recarregar pagamentos vencidos
      await loadOverduePayments();
    } catch (error) {
      console.error('Erro ao reativar pagamento:', error);
    }
  };

  const openReactivateDialog = (payment: OverduePayment) => {
    setSelectedPayment(payment);
    // Definir data padrão como 7 dias a partir de hoje
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setNewDueDate(defaultDate.toISOString().split('T')[0]);
    setIsDialogOpen(true);
  };

  const handleSort = (column: 'dueDate' | 'value' | 'registrationId') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'CONFIRMED':
        return <Badge variant="default">Confirmado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && overduePayments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando pagamentos vencidos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Pagamentos Vencidos
          </CardTitle>
          <CardDescription>
            Gerencie faturas vencidas por PIX. Você pode reativar faturas alterando a data de vencimento e gerando um novo QR Code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do piloto, email ou competição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={loadOverduePayments}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{filteredPayments.length}</div>
              <div className="text-sm text-muted-foreground">Faturas Vencidas</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">
                {formatCurrency(filteredPayments.reduce((sum, p) => sum + (Number(p.value) || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{overduePayments.length}</div>
              <div className="text-sm text-muted-foreground">Total no Sistema</div>
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Piloto / Competição</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      Vencimento
                      <Filter className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center gap-1">
                      Valor
                      <Filter className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'Nenhum pagamento encontrado para a busca.' : 'Nenhum pagamento vencido encontrado.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.registration?.user?.name || 'Nome não disponível'}
                          </div>
                          {payment.registration?.season?.championship?.name && payment.registration?.season?.name && (
                            <div className="text-sm text-muted-foreground">
                              {payment.registration.season.championship.name} / {payment.registration.season.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDateToBrazilian(payment.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(payment.value || 0)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.installmentNumber || 1}
                          {payment.installmentCount && payment.installmentCount > 1 && 
                            ` de ${payment.installmentCount}`
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => openReactivateDialog(payment)}
                          disabled={loading}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reativar Fatura Vencida</DialogTitle>
            <DialogDescription>
              Defina uma nova data de vencimento para reativar a fatura. Um novo QR Code PIX será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPayment && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">Detalhes da Fatura</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Piloto:</span>
                    <div className="font-semibold">
                      {selectedPayment.registration?.user?.name || 'Nome não disponível'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <div className="font-semibold">{formatCurrency(selectedPayment.value || 0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Competição:</span>
                    <div className="font-semibold">
                      {selectedPayment.registration?.season?.championship?.name && selectedPayment.registration?.season?.name 
                        ? `${selectedPayment.registration.season.championship.name} / ${selectedPayment.registration.season.name}`
                        : 'Não disponível'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vencimento Atual:</span>
                    <div className="font-semibold">{formatDateToBrazilian(selectedPayment.dueDate)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parcela:</span>
                    <div className="font-semibold">
                      {selectedPayment.installmentNumber || 1}
                      {selectedPayment.installmentCount && selectedPayment.installmentCount > 1 && 
                        ` de ${selectedPayment.installmentCount}`
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newDueDate">Nova Data de Vencimento</Label>
              <Input
                id="newDueDate"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                A nova data deve ser posterior à data atual.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReactivatePayment}
              disabled={loading || !newDueDate}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Reativando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reativar Fatura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 