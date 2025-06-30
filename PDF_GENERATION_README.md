# PDF Generation Feature

## Overview
This feature provides a modern, minimalist PDF generation capability for the regulation tab in the kart championship app. It generates professional PDFs with a stylish cover page and properly formatted content.

## Features

### Cover Page
- Championship logo (if available)
- Championship name
- Season name
- Generation date
- Modern, minimalist design with orange accent color

### Content Pages
- Table of contents with page numbers
- Regulation sections with proper formatting
- **Markdown support** for rich text formatting:
  - **Bold text** (`**text**` or `__text__`)
  - *Italic text* (`*text*` or `_text_`)
  - `Code snippets` (`` `code` ``)
  - Headers (`#`, `##`, `###`, etc.)
  - Lists (`- item` or `* item`)
  - Code blocks (```code```)

### Technical Implementation
- Uses `jsPDF` for PDF generation
- Uses `html2canvas` for logo rendering
- Responsive text wrapping
- **Inline text rendering** - text formatting (bold, italic, code) flows naturally without breaking lines
- Automatic page breaks
- Clean typography with proper spacing

## Usage

### In RegulationTab Component
```typescript
import { PDFGenerator } from '../utils/pdf-generator';

// Generate PDF
const handleGeneratePDF = async () => {
  try {
    await PDFGenerator.generateRegulationPDF({
      championshipName: championship.name,
      seasonName: season.name,
      championshipLogo: championship.logo,
      regulations: regulations,
      generatedAt: new Date().toLocaleDateString('pt-BR')
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};
```

### PDF Data Structure
```typescript
interface RegulationPDFData {
  championshipName: string;
  seasonName: string;
  championshipLogo?: string;
  regulations: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  generatedAt: string;
}
```

## Dependencies
- `jspdf`: PDF generation library
- `html2canvas`: Canvas rendering for images

## Recent Fixes
- **Fixed inline text rendering**: Text with markdown formatting (bold, italic, code) now flows naturally without breaking lines
- **Improved markdown parsing**: Removed placeholder artifacts (`__BOLD_0__`) from rendered text
- **Enhanced title cleaning**: Removes markdown symbols from titles in index and headers while preserving formatting in content

## File Structure
```
src/
├── utils/
│   └── pdf-generator.ts          # Main PDF generation utility
└── components/
    └── championship/
        └── tabs/
            └── RegulationTab.tsx # Component using PDF generation
```

## Dependências Instaladas

```bash
npm install jspdf html2canvas
npm install --save-dev @types/html2canvas
```

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/utils/pdf-generator.ts` - Classe principal para geração de PDF
- `PDF_GENERATION_README.md` - Esta documentação

### Arquivos Modificados
- `src/components/championship/tabs/RegulationTab.tsx` - Adicionado botão e funcionalidade

## Estrutura do Código

### PDFGenerator Class
```typescript
interface RegulationPDFData {
  championshipName: string;
  seasonName: string;
  championshipLogo?: string;
  regulations: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  generatedAt: string;
}
```

### Métodos Principais
- `generateRegulationPDF()` - Método principal
- `generateCoverPage()` - Gera a página de capa
- `generateContentPages()` - Gera as páginas de conteúdo
- `renderMarkdownTitle()` - Renderiza títulos com markdown
- `renderMarkdownContent()` - Renderiza conteúdo com markdown
- `renderParagraph()` - Renderiza parágrafos com formatação
- `renderList()` - Renderiza listas com bullets
- `renderHeading()` - Renderiza cabeçalhos
- `renderCodeBlock()` - Renderiza blocos de código
- `parseMarkdownText()` - Parse markdown inline
- `parseMarkdownBlocks()` - Parse blocos de markdown
- `splitTextIntoLines()` - Quebra texto em linhas adequadas

## Exemplo de Uso

```typescript
import { PDFGenerator } from '@/utils/pdf-generator';

const pdfData = {
  championshipName: "Campeonato Brasileiro de Kart",
  seasonName: "Temporada 2024",
  championshipLogo: "https://exemplo.com/logo.png",
  regulations: [
    {
      title: "1. **Disposições** Gerais",
      content: "**1.1 Objetivo**\nEste regulamento...\n\n- Item 1\n- Item 2",
      order: 1
    }
  ],
  generatedAt: "25/12/2024 às 14:30"
};

await PDFGenerator.generateRegulationPDF(pdfData);
```

## Tratamento de Erros

- **Validação** de dados antes da geração
- **Tratamento** de erros de carregamento de imagens
- **Feedback** visual durante a geração
- **Alertas** informativos em caso de erro
- **Verificação** de tipos para evitar erros de runtime

## Compatibilidade

- ✅ **Chrome/Edge** - Suporte completo
- ✅ **Firefox** - Suporte completo
- ✅ **Safari** - Suporte completo
- ✅ **Mobile** - Funcional (mas melhor experiência no desktop)

## Melhorias Implementadas

### 🎯 Suporte Avançado ao Markdown
- **Processamento inteligente** de diferentes tipos de conteúdo
- **Formatação visual** mantida no PDF
- **Estrutura hierárquica** respeitada
- **Espaçamento adequado** entre elementos
- **Títulos limpos** - Remove símbolos markdown dos títulos das seções
- **Texto limpo** - Remove placeholders como `__BOLD_0__` do texto

### 📊 Renderização Otimizada
- **Quebra automática** de páginas inteligente
- **Posicionamento preciso** de elementos
- **Tipografia consistente** em todo o documento
- **Cores diferenciadas** para diferentes tipos de conteúdo
- **Índice limpo** - Títulos sem formatação markdown no índice
- **Processamento sequencial** - Evita conflitos entre diferentes tipos de formatação

## Próximas Melhorias

- [ ] Suporte a tabelas markdown
- [ ] Opções de template de PDF
- [ ] Preview do PDF antes do download
- [ ] Compressão de imagens para melhor performance
- [ ] Suporte a múltiplos idiomas
- [ ] Opções de personalização de cores
- [ ] Suporte a imagens inline no markdown 