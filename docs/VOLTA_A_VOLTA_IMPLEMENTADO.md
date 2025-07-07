# Volta a Volta - Implementado

## 📋 Status da Implementação

✅ **Backend**: Implementado completamente
✅ **Frontend**: Implementado completamente  
✅ **Bug Fix**: Cache Redis corrigido

## 🗄️ Backend

### 1. **Modelo de Dados**
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

### 2. **Estrutura JSON dos Tempos**
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

### 3. **API Endpoints**
- `GET /lap-times/stage/:stageId` - Buscar todos os tempos de uma etapa
- `GET /lap-times/stage/:stageId/category/:categoryId` - Buscar tempos por categoria  
- `GET /lap-times/stage/:stageId/category/:categoryId/user/:userId` - Buscar tempos específicos
- `POST /lap-times/import` - Importar tempos de arquivo Excel
- `DELETE /lap-times/:id` - Deletar registro de tempos

### 4. **Serviços**
- `LapTimesService`: Gerenciamento de tempos volta a volta
- `LapTimesRepository`: Acesso a dados
- `LapTimesController`: Endpoints da API

## 🎨 Frontend

### 1. **Importação de Dados**
- **Botão**: "Importar Volta a Volta" no menu dropdown
- **Formato de Arquivo**: Excel (.xlsx)
- **Estrutura Esperada**:
  - Coluna A: Marcador `#` seguido pelos dados
  - Coluna A: Número do kart (após o marcador #)
  - Coluna C: Número da volta
  - Coluna D: Tempo de volta (formato MM:SS.sss)

### 2. **Visualização em Gráfico**
- **Botão**: "📊 Gráfico Volta a Volta"
- **Funcionalidades**:
  - Seleção múltipla de pilotos
  - Gráfico de linha com tempos por volta
  - Diferentes cores para cada piloto
  - Tooltip com informações detalhadas
  - Formatação de tempo legível

### 3. **Interface do Usuário**
- Modal para importação com instruções de formato
- Validação de arquivos Excel
- Feedback visual do progresso
- Mensagens de erro detalhadas
- Gráfico responsivo para diferentes tamanhos de tela

## 🐛 Bug Fix: Cache Redis

### **Problema Identificado**
Durante a importação de volta a volta, os dados de temporada eram removidos do cache Redis, mesmo que os lap times sejam armazenados apenas no PostgreSQL.

### **Causa Raiz**
1. **Auto-save automático**: O frontend tem um `useEffect` que salva automaticamente os `stageResults` quando há mudanças
2. **Disparar durante importação**: Durante a importação de lap times, o auto-save era disparado
3. **Atualização de etapa**: O auto-save chamava `saveStageResults()`, atualizando o campo `stage_results` da etapa
4. **Evento de database**: O `database-events.service.ts` detectava a atualização da etapa
5. **Recálculo da classificação**: Como a etapa tinha `stage_results`, o sistema chamava `recalculateSeasonClassification()`
6. **Invalidação do cache**: O recálculo limpava todas as classificações e invalidava o cache Redis da temporada

### **Solução Implementada**
Adicionada uma flag `isImportingLapTimes` para controlar o auto-save durante a importação:

```typescript
// Flag para controlar auto-save durante importação
const [isImportingLapTimes, setIsImportingLapTimes] = useState(false);

// Auto-save modificado
useEffect(() => {
  // Não executar auto-save durante importação de lap times
  if (isImportingLapTimes) {
    return;
  }
  
  if (Object.keys(stageResults).length > 0) {
    const timeoutId = setTimeout(() => {
      saveStageResults();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }
}, [stageResults, isImportingLapTimes]);

// Durante importação de lap times
try {
  setIsImportingLapTimes(true);
  // ... lógica de importação
} finally {
  setIsImportingLapTimes(false);
}
```

### **Resultado**
✅ Importação de lap times não afeta mais o cache Redis da temporada  
✅ Dados de temporada permanecem no cache durante importação  
✅ Auto-save continua funcionando normalmente para outras operações  

## 📝 Como Usar

### 1. **Importar Tempos Volta a Volta**
1. Na aba "Race Day", selecione a etapa desejada
2. Clique no menu dropdown da categoria
3. Selecione "Importar Volta a Volta"
4. Faça upload do arquivo Excel no formato correto
5. Confirme a importação

### 2. **Visualizar Gráfico**
1. Na mesma aba, clique em "📊 Gráfico Volta a Volta"
2. Selecione os pilotos que deseja comparar
3. Visualize os tempos por volta no gráfico

### 3. **Formato do Arquivo Excel**
```
   A        B        C        D
1  #        -        Volta    Tempo
2  1        -        1        01:21.855
3  1        -        2        01:20.422
4  2        -        1        01:22.134
5  2        -        2        01:21.789
```

## ⚠️ Observações

- **Requisitos**: É necessário ter realizado o sorteio de karts antes de importar os tempos
- **Formato**: O arquivo deve estar no formato Excel (.xlsx)
- **Estrutura**: Seguir exatamente a estrutura de colunas especificada
- **Validação**: O sistema valida se os karts existem no sorteio antes de importar

## 🔄 Fluxo de Dados

1. **Importação**: Excel → Processamento → Validação → Banco de dados
2. **Visualização**: Banco de dados → API → Frontend → Gráfico
3. **Cache**: Dados ficam separados dos resultados de etapa para evitar conflitos 