import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'brk-design-system';
import { Button } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Separator } from 'brk-design-system';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Car, 
  Trophy, 
  Target, 
  Users, 
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { SeasonRegistrationService, type PilotDetails } from '@/lib/services/season-registration.service';
import { formatCurrency } from '@/utils/currency';
import { formatDateToBrazilian } from '@/utils/date';

interface PilotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationId: string;
}

// Enums para tradução
const GenderLabels = {
  0: 'Masculino',
  1: 'Feminino',
  2: 'Outro',
  3: 'Prefere não informar'
};

const ExperienceLabels = {
  0: 'Nunca',
  1: 'Menos de 1 ano',
  2: '1 a 2 anos',
  3: '3 a 5 anos',
  4: 'Mais de 5 anos'
};

const RaceFrequencyLabels = {
  0: 'Raramente',
  1: 'Regularmente',
  2: 'Semanalmente',
  3: 'Diariamente'
};

const ChampionshipParticipationLabels = {
  0: 'Nunca',
  1: 'Local/Regional',
  2: 'Estadual',
  3: 'Nacional'
};

const CompetitiveLevelLabels = {
  0: 'Iniciante',
  1: 'Intermediário',
  2: 'Competitivo',
  3: 'Profissional'
};

const AttendsEventsLabels = {
  0: 'Sim',
  1: 'Não',
  2: 'Depende da distância'
};

const InterestCategoryLabels = {
  0: 'Kart Aluguel Leve',
  1: 'Kart Aluguel Pesado',
  2: 'Kart 2 Tempos',
  3: 'Endurance',
  4: 'Equipes',
  5: 'Campeonatos Longos',
  6: 'Corridas Únicas'
};

const PaymentStatusLabels = {
  pending: 'Pendente',
  processing: 'Processando',
  paid: 'Pago',
  failed: 'Falhou',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
};

const RegistrationStatusLabels = {
  pending: 'Pendente',
  payment_pending: 'Aguardando Pagamento',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  expired: 'Expirado'
};

export function PilotDetailsModal({ isOpen, onClose, registrationId }: PilotDetailsModalProps) {
  const [pilotDetails, setPilotDetails] = useState<PilotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && registrationId) {
      loadPilotDetails();
    }
  }, [isOpen, registrationId]);

  const loadPilotDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await SeasonRegistrationService.getPilotDetails(registrationId);
      setPilotDetails(details);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do piloto');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!pilotDetails && !loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Piloto
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {pilotDetails && (
          <div className="space-y-4">
            {/* Aba Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                    <p className="text-sm">{pilotDetails.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Apelido</label>
                    <p className="text-sm">{pilotDetails.profile?.nickName || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {pilotDetails.user.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pilotDetails.user.phone || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pilotDetails.profile?.birthDate ? formatDateToBrazilian(pilotDetails.profile.birthDate) : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gênero</label>
                    <p className="text-sm">
                      {pilotDetails.profile?.gender !== undefined ? GenderLabels[pilotDetails.profile.gender as keyof typeof GenderLabels] : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cidade</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {pilotDetails.profile?.city || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <p className="text-sm">{pilotDetails.profile?.state || 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aba Experiência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Experiência e Preferências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tempo de Experiência</label>
                    <p className="text-sm">
                      {pilotDetails.profile?.experienceTime !== undefined ? ExperienceLabels[pilotDetails.profile.experienceTime as keyof typeof ExperienceLabels] : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Frequência de Corridas</label>
                    <p className="text-sm">
                      {pilotDetails.profile?.raceFrequency !== undefined ? RaceFrequencyLabels[pilotDetails.profile.raceFrequency as keyof typeof RaceFrequencyLabels] : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Participação em Campeonatos</label>
                    <p className="text-sm">
                      {pilotDetails.profile?.championshipParticipation !== undefined ? ChampionshipParticipationLabels[pilotDetails.profile.championshipParticipation as keyof typeof ChampionshipParticipationLabels] : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nível Competitivo</label>
                    <p className="text-sm">
                      {pilotDetails.profile?.competitiveLevel !== undefined ? CompetitiveLevelLabels[pilotDetails.profile.competitiveLevel as keyof typeof CompetitiveLevelLabels] : 'Não informado'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Possui Kart Próprio</label>
                    <p className="text-sm">{pilotDetails.profile?.hasOwnKart ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membro de Equipe</label>
                    <p className="text-sm">{pilotDetails.profile?.isTeamMember ? 'Sim' : 'Não'}</p>
                  </div>
                  {pilotDetails.profile?.teamName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome da Equipe</label>
                      <p className="text-sm">{pilotDetails.profile.teamName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usa Telemetria</label>
                    <p className="text-sm">{pilotDetails.profile?.usesTelemetry ? 'Sim' : 'Não'}</p>
                  </div>
                  {pilotDetails.profile?.telemetryType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Telemetria</label>
                      <p className="text-sm">{pilotDetails.profile.telemetryType}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Frequenta Eventos</label>
                    <p className="text-sm">
                      {pilotDetails.profile?.attendsEvents !== undefined ? AttendsEventsLabels[pilotDetails.profile.attendsEvents as keyof typeof AttendsEventsLabels] : 'Não informado'}
                    </p>
                  </div>
                </div>

                {pilotDetails.profile?.interestCategories && pilotDetails.profile.interestCategories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Categorias de Interesse</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pilotDetails.profile.interestCategories.map((category: number, index: number) => (
                        <Badge key={index} variant="outline">
                          {InterestCategoryLabels[category as keyof typeof InterestCategoryLabels]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {pilotDetails.profile?.preferredTrack && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pista Preferida</label>
                    <p className="text-sm">{pilotDetails.profile.preferredTrack}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aba Inscrição */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Dados da Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status da Inscrição</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(pilotDetails.registration.status)}
                      <Badge className={getStatusColor(pilotDetails.registration.status)}>
                        {RegistrationStatusLabels[pilotDetails.registration.status as keyof typeof RegistrationStatusLabels]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status do Pagamento</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(pilotDetails.registration.paymentStatus)}
                      <Badge className={getStatusColor(pilotDetails.registration.paymentStatus)}>
                        {pilotDetails.payments && pilotDetails.payments.length > 0 ? (
                          pilotDetails.payments.length > 1 ? (
                            // Pagamento parcelado
                            `${pilotDetails.payments.filter(p => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status)).length}/${pilotDetails.payments.length} parcelas pagas`
                          ) : (
                            // Pagamento único
                            ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(pilotDetails.payments[0].status) ? 'Pago' : 
                            ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(pilotDetails.payments[0].status) ? 'Pendente' : 
                            pilotDetails.payments[0].status === 'OVERDUE' ? 'Vencido' : 
                            PaymentStatusLabels[pilotDetails.registration.paymentStatus as keyof typeof PaymentStatusLabels]
                          )
                        ) : (
                          PaymentStatusLabels[pilotDetails.registration.paymentStatus as keyof typeof PaymentStatusLabels]
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor da Inscrição</label>
                    <p className="text-sm font-semibold">{formatCurrency(pilotDetails.registration.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Inscrição</label>
                    <p className="text-sm">{formatDateToBrazilian(pilotDetails.registration.createdAt)}</p>
                  </div>
                  {pilotDetails.registration.confirmedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Confirmação</label>
                      <p className="text-sm">{formatDateToBrazilian(pilotDetails.registration.confirmedAt)}</p>
                    </div>
                  )}
                  {pilotDetails.registration.cancelledAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Cancelamento</label>
                      <p className="text-sm">{formatDateToBrazilian(pilotDetails.registration.cancelledAt)}</p>
                    </div>
                  )}
                </div>

                {pilotDetails.registration.categories && pilotDetails.registration.categories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Categorias Inscritas</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pilotDetails.registration.categories.map((cat) => (
                        <Badge key={cat.id} variant="outline">
                          {cat.category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Etapas Pagas */}
                {pilotDetails.registration.stages && pilotDetails.registration.stages.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Etapas Pagas</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pilotDetails.registration.stages.map((regStage) => (
                        <Badge key={regStage.id} variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {regStage.stage?.name || regStage.stageName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalhes de Pagamento */}
                {pilotDetails.payments && pilotDetails.payments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detalhes de Pagamento</label>
                    <div className="mt-2 space-y-2">
                      {pilotDetails.payments.length > 1 ? (
                        // Pagamento parcelado
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {pilotDetails.payments.filter(p => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status)).length}/{pilotDetails.payments.length} parcelas pagas
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {pilotDetails.payments.map((payment, index) => {
                              const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status);
                              const isPending = ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(payment.status);
                              const isOverdue = payment.status === 'OVERDUE';
                              
                              return (
                                <div key={payment.id} className={`p-2 border rounded text-xs ${isPaid ? 'bg-green-50 border-green-200' : isPending ? 'bg-yellow-50 border-yellow-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Parcela {payment.installmentNumber || (index + 1)}</span>
                                    <Badge variant={isPaid ? 'success' : isPending ? 'warning' : isOverdue ? 'destructive' : 'default'} className="text-xs">
                                      {isPaid ? 'Pago' : isPending ? 'Pendente' : isOverdue ? 'Vencido' : payment.status}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground mt-1">
                                    <div>Valor: {formatCurrency(payment.value)}</div>
                                    <div>Vencimento: {formatDateToBrazilian(payment.dueDate)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        // Pagamento único
                        <div className="p-2 border rounded bg-gray-50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Pagamento Único</span>
                            <Badge variant={['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(pilotDetails.payments[0].status) ? 'success' : ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(pilotDetails.payments[0].status) ? 'warning' : 'default'} className="text-xs">
                              {['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(pilotDetails.payments[0].status) ? 'Pago' : ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_RISK_ANALYSIS'].includes(pilotDetails.payments[0].status) ? 'Pendente' : pilotDetails.payments[0].status}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            <div>Valor: {formatCurrency(pilotDetails.payments[0].value)}</div>
                            <div>Vencimento: {formatDateToBrazilian(pilotDetails.payments[0].dueDate)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 