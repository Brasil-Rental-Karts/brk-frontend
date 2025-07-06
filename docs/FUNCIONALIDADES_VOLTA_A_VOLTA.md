# Funcionalidades de Volta a Volta - BRK App

## 📋 Resumo das Implementações

### 🗄️ Backend

#### 1. **Modelo de Dados**
- **Tabela**: `lap_times`
- **Campos**:
  - `id`: UUID único
  - `userId`: ID do usuário/piloto
  - `stageId`: ID da etapa
  - `categoryId`: ID da categoria
  - `batteryIndex`: Índice da bateria (0, 1, 2...)
  - `kartNumber`: Número do kart
  - `lapTimes`: JSON com array de tempos volta a volta
  - `createdAt`, `updatedAt`: Timestamps

#### 2. **Estrutura JSON dos Tempos**
```json
{
  "lapTimes": [
    {
      "lap": 1,
      "time": "01:21.855",
      "timeMs": 81855
    },
    {
      "lap": 2,
      "time": "01:20.422",
      "timeMs": 80422
    }
  ]
}
```

#### 3. **API Endpoints**
- `GET /lap-times/stage/:stageId` - Buscar todos os tempos de uma etapa
- `GET /lap-times/stage/:stageId/category/:categoryId` - Buscar tempos por categoria
- `GET /lap-times/stage/:stageId/category/:categoryId/user/:userId` - Buscar tempos específicos
- `POST /lap-times/import` - Importar tempos de arquivo Excel
- `DELETE /lap-times/:id` - Deletar registro de tempos

#### 4. **Serviços**
- `LapTimesService`: Gerenciamento de tempos volta a volta
- `LapTimesRepository`: Acesso a dados
- `LapTimesController`: Endpoints da API

### 🎨 Frontend

#### 1. **Importação de Dados**
- **Botão**: "Importar Volta a Volta" no menu dropdown
- **Formato de Arquivo**: Excel (.xlsx)
- **Estrutura Esperada**:
  - Coluna A: Marcador `#` seguido pelos dados
  - Coluna A: Número do kart (após o marcador #)
  - Coluna C: Número da volta
  - Coluna D: Tempo de volta (formato MM:SS.sss)

#### 2. **Visualização em Gráfico**
- **Botão**: "📊 Gráfico Volta a Volta"
- **Funcionalidades**:
  - Seleção múltipla de pilotos
  - Gráfico de linha com tempos por volta
  - Diferentes cores para cada piloto
  - Tooltip com informações detalhadas
  - Formatação de tempo legível

#### 3. **Interface do Usuário**
- **Modal de Importação**: Instruções claras do formato
- **Modal de Gráfico**: Visualização interativa
- **Seleção de Pilotos**: Checkboxes para cada piloto
- **Controles**: Selecionar todos / Limpar seleção

### 📊 Exemplo de Uso

#### 1. **Formato do Arquivo Excel**
```
Categoria: NOVATOS
Data: 02/10/2025
Bateria: 1
#
14    1    01:21.855
14    2    01:20.422
14    3    01:19.988
20    1    01:22.144
20    2    01:21.677
```

#### 2. **Fluxo de Importação**
1. Realizar sorteio de karts
2. Clicar em "Importar Volta a Volta"
3. Selecionar arquivo Excel
4. Confirmar importação
5. Verificar feedback de sucesso

#### 3. **Visualização do Gráfico**
1. Clicar em "📊 Gráfico Volta a Volta"
2. Selecionar pilotos desejados
3. Visualizar gráfico interativo
4. Analisar performance volta a volta

### 🔧 Tecnologias Utilizadas

#### Backend
- **TypeORM**: ORM para gerenciamento de dados
- **PostgreSQL**: Banco de dados principal
- **Express**: Framework web
- **XLSX**: Processamento de arquivos Excel

#### Frontend
- **React**: Interface do usuário
- **Recharts**: Biblioteca de gráficos
- **XLSX**: Leitura de arquivos Excel
- **Tailwind CSS**: Estilização

### 📁 Arquivos Criados/Modificados

#### Backend
- `migrations/1760000000000-CreateLapTimesTable.ts`
- `models/lap-times.entity.ts`
- `repositories/lap-times.repository.ts`
- `repositories/lap-times.repository.impl.ts`
- `services/lap-times.service.ts`
- `controllers/lap-times.controller.ts`
- `index.ts` (registrar controller)

#### Frontend
- `lib/services/lap-times.service.ts`
- `components/championship/tabs/RaceDayTab.tsx` (modificado)
- `public/exemplo-volta-a-volta.xlsx` (arquivo de exemplo)
- `package.json` (adicionado recharts)

### 🚀 Próximos Passos

1. **Testes**: Implementar testes unitários e de integração
2. **Performance**: Otimizar consultas para grandes volumes de dados
3. **Análises**: Adicionar mais análises estatísticas
4. **Exportação**: Permitir exportar gráficos e relatórios
5. **Comparações**: Comparar performance entre diferentes etapas

### 📝 Observações

- ✅ Suporte a múltiplas baterias por etapa
- ✅ Validação de dados na importação
- ✅ Interface intuitiva e responsiva
- ✅ Gráficos interativos e informativos
- ✅ Mapeamento automático kart → piloto
- ✅ Tratamento de erros robusto
- ✅ Documentação completa

A implementação está completa e pronta para uso em produção! 