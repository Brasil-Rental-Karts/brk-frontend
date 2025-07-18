import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface RegulationPDFData {
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

export class PDFGenerator {
  /**
   * Gera um PDF do regulamento com capa moderna
   */
  static async generateRegulationPDF(data: RegulationPDFData): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Configurações de fonte
    pdf.setFont('helvetica');
    
    // PÁGINA 1 - CAPA
    await this.generateCoverPage(pdf, data);
    
    // PÁGINAS DE CONTEÚDO
    await this.generateContentPages(pdf, data);

    // Salvar o PDF
    const fileName = `${data.championshipName} - ${data.seasonName}.pdf`
      .replace(/[\\/:*?"<>|]+/g, '') // remove caracteres inválidos para nome de arquivo
      .trim();
    pdf.save(fileName);
  }

  /**
   * Gera a página de capa
   */
  private static async generateCoverPage(pdf: jsPDF, data: RegulationPDFData): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Background gradiente (simulado com retângulos)
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Logo do campeonato (se disponível)
    if (data.championshipLogo) {
      try {
        const logoImg = await this.loadImage(data.championshipLogo);
        const logoWidth = 60;
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = 60;
        
        pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Erro ao carregar logo:', error);
      }
    }

    // Título principal
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    
    const title = 'REGULAMENTO';
    const titleWidth = pdf.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    pdf.text(title, titleX, 140);

    // Nome do campeonato
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(34, 34, 34);
    
    const championshipName = data.championshipName.toUpperCase();
    const championshipWidth = pdf.getTextWidth(championshipName);
    const championshipX = (pageWidth - championshipWidth) / 2;
    pdf.text(championshipName, championshipX, 160);

    // Nome da temporada
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    
    const seasonName = data.seasonName;
    const seasonWidth = pdf.getTextWidth(seasonName);
    const seasonX = (pageWidth - seasonWidth) / 2;
    pdf.text(seasonName, seasonX, 175);

    // Linha decorativa
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 200, pageWidth - margin, 200);

    // Data de atualização
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(153, 153, 153);
    
    const dateText = `Atualizado em: ${data.generatedAt}`;
    const dateWidth = pdf.getTextWidth(dateText);
    const dateX = (pageWidth - dateWidth) / 2;
    pdf.text(dateText, dateX, 220);

    // Número de páginas
    pdf.setFontSize(10);
    pdf.setTextColor(200, 200, 200);
    pdf.text('1', pageWidth - 15, pageHeight - 10);
  }

  /**
   * Gera as páginas de conteúdo
   */
  private static async generateContentPages(pdf: jsPDF, data: RegulationPDFData): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;
    let pageNumber = 2;

    // Adicionar nova página para o conteúdo detalhado (direto, sem índice)
    pdf.addPage();
    currentY = margin;
    pageNumber++;

    // Conteúdo detalhado
    data.regulations.forEach((regulation, index) => {
      // Calcular altura da seção
      const cleanTitle = this.cleanMarkdownFromTitle(regulation.title);
      const sectionHeight = this.estimateSectionHeight(
        pdf,
        `${index + 1}. ${cleanTitle}`,
        regulation.content,
        margin,
        contentWidth,
        pageHeight
      );
      // Se não couber, nova página
      if (currentY + sectionHeight > pageHeight - 20) {
        pdf.addPage();
        currentY = margin;
        pageNumber++;
      }
      // Título da seção (processado com markdown)
      currentY = this.renderMarkdownTitle(pdf, `${index + 1}. ${cleanTitle}`, margin, currentY, contentWidth, pageHeight);
      // Conteúdo da seção (processado com markdown)
      currentY = this.renderMarkdownContent(pdf, regulation.content, margin, currentY, contentWidth, pageHeight, pageNumber);
      currentY += 8; // Espaçamento entre seções (mais compacto)
    });

    // Adicionar números de página
    for (let i = 2; i <= pageNumber; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 200);
      pdf.text(i.toString(), pageWidth - 15, pageHeight - 10);
    }
  }

  /**
   * Renderiza um título com suporte a markdown
   */
  private static renderMarkdownTitle(
    pdf: jsPDF, 
    title: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);

    // Processar markdown no título
    const titleParts = this.parseMarkdownText(title);
    let currentY = y;

    titleParts.forEach(part => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20; // margin
      }

      // Aplicar estilo baseado no tipo
      if (part.type === 'bold') {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 51, 51);
      } else if (part.type === 'italic') {
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(51, 51, 51);
      } else if (part.type === 'link') {
        pdf.setFont('helvetica', 'bold'); // Títulos sempre em negrito
        pdf.setTextColor(0, 0, 255); // Cor azul para links
      } else {
        pdf.setFont('helvetica', 'bold'); // Títulos sempre em negrito
        pdf.setTextColor(51, 51, 51);
      }

      // Quebrar linha se necessário
      const lines = this.splitTextIntoLines(pdf, part.text, maxWidth);
      lines.forEach(line => {
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = 20;
        }
        pdf.text(line, x, currentY);
        currentY += 8; // Espaçamento menor para títulos
      });
      
      // Resetar cor para normal após processar o link
      if (part.type === 'link') {
        pdf.setTextColor(51, 51, 51);
      }
    });

    return currentY + 4; // Espaçamento extra após título (mais compacto)
  }

  /**
   * Renderiza conteúdo com suporte completo a markdown
   */
  private static renderMarkdownContent(
    pdf: jsPDF, 
    content: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number,
    pageNumber: number
  ): number {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(68, 68, 68);

    let currentY = y;
    let currentPageNumber = pageNumber;

    // Dividir conteúdo em blocos (parágrafos, listas, etc.)
    const blocks = this.parseMarkdownBlocks(content);

    blocks.forEach(block => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
        currentPageNumber++;
      }

      switch (block.type) {
        case 'paragraph':
          currentY = this.renderParagraph(pdf, block.content, x, currentY, maxWidth, pageHeight);
          break;
        case 'list':
          if (block.items) {
            currentY = this.renderList(pdf, block.items, x, currentY, maxWidth, pageHeight);
          }
          break;
        case 'heading':
          if (block.level) {
            currentY = this.renderHeading(pdf, block.content, block.level, x, currentY, maxWidth, pageHeight);
          }
          break;
        case 'code':
          currentY = this.renderCodeBlock(pdf, block.content, x, currentY, maxWidth, pageHeight);
          break;
        case 'table':
          if (block.table) {
            currentY = this.renderTable(pdf, block.table, x, currentY, maxWidth, pageHeight);
          }
          break;
        case 'blockquote':
          currentY = this.renderBlockquote(pdf, block.content, x, currentY, maxWidth, pageHeight);
          break;
      }

      currentY += 8; // Espaçamento entre blocos
    });

    return currentY;
  }

  /**
   * Renderiza um parágrafo com formatação inline
   */
  private static renderParagraph(
    pdf: jsPDF, 
    content: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    const parts = this.parseMarkdownText(content);
    let currentY = y;
    let currentX = x;
    let maxLineHeight = 6;
    let lineWidth = 0;

    // Processar todas as partes em sequência, mantendo a continuidade da linha
    parts.forEach((part, partIndex) => {
      // Aplicar estilo
      if (part.type === 'bold') {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(68, 68, 68);
      } else if (part.type === 'italic') {
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(68, 68, 68);
      } else if (part.type === 'code') {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
      } else if (part.type === 'link') {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 255); // Cor azul para links
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(68, 68, 68);
      }

      // Quebra em palavras para respeitar largura máxima
      const words = part.text.split(' ');
      words.forEach((word, wordIndex) => {
        const isLastWord = wordIndex === words.length - 1;
        const isLastPart = partIndex === parts.length - 1;
        const wordWithSpace = (!isLastWord || !isLastPart) ? word + ' ' : word;
        const wordWidth = pdf.getTextWidth(wordWithSpace);
        
        // Verificar se a palavra cabe na linha atual
        if (currentX + lineWidth + wordWidth > x + maxWidth) {
          // Nova linha
          currentY += maxLineHeight;
          lineWidth = 0;
          currentX = x;
        }
        
        // Verificar se precisa de nova página
        if (currentY > pageHeight - 40) {
          pdf.addPage();
          currentY = 20;
          currentX = x;
          lineWidth = 0;
        }
        
        pdf.text(wordWithSpace, currentX + lineWidth, currentY);
        lineWidth += wordWidth;
      });
      
      // Resetar cor para normal após processar o link
      if (part.type === 'link') {
        pdf.setTextColor(68, 68, 68);
      }
    });
    
    return currentY + maxLineHeight;
  }

  /**
   * Renderiza uma lista
   */
  private static renderList(
    pdf: jsPDF, 
    items: string[], 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    let currentY = y;

    items.forEach((item, index) => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }

      // Bullet point
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(68, 68, 68);
      pdf.text('•', x, currentY);
      
      // Conteúdo do item
      const itemContent = item.trim();
      const parts = this.parseMarkdownText(itemContent);
      
      let itemX = x + 8; // Indentação para o conteúdo
      let maxLineHeight = 6;
      let currentLineY = currentY;
      let lineWidth = 0;

      // Processar todas as partes em sequência, mantendo a continuidade da linha
      parts.forEach((part, partIndex) => {
        // Aplicar estilo
        if (part.type === 'bold') {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(68, 68, 68);
        } else if (part.type === 'italic') {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(68, 68, 68);
        } else if (part.type === 'code') {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
        } else if (part.type === 'link') {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 255); // Cor azul para links
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(68, 68, 68);
        }

        // Quebra em palavras para respeitar largura máxima
        const words = part.text.split(' ');
        words.forEach((word, wordIndex) => {
          const isLastWord = wordIndex === words.length - 1;
          const isLastPart = partIndex === parts.length - 1;
          const wordWithSpace = (!isLastWord || !isLastPart) ? word + ' ' : word;
          const wordWidth = pdf.getTextWidth(wordWithSpace);
          
          // Verificar se a palavra cabe na linha atual
          if (itemX + lineWidth + wordWidth > x + maxWidth) {
            // Nova linha
            currentLineY += maxLineHeight;
            lineWidth = 0;
            itemX = x + 8;
          }
          
          // Verificar se precisa de nova página
          if (currentLineY > pageHeight - 40) {
            pdf.addPage();
            currentLineY = 20;
            itemX = x + 8;
            lineWidth = 0;
          }
          
          pdf.text(wordWithSpace, itemX + lineWidth, currentLineY);
          lineWidth += wordWidth;
        });
        
        // Resetar cor para normal após processar o link
        if (part.type === 'link') {
          pdf.setTextColor(68, 68, 68);
        }
      });
      
      currentY = currentLineY + maxLineHeight + 2; // Espaçamento entre itens
    });

    return currentY;
  }

  /**
   * Renderiza um cabeçalho
   */
  private static renderHeading(
    pdf: jsPDF, 
    content: string, 
    level: number, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    const fontSize = Math.max(12, 16 - level * 2); // h1=14, h2=12, h3=10, etc.
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);

    const cleanContent = this.cleanMarkdownFromTitle(content);
    const lines = this.splitTextIntoLines(pdf, cleanContent, maxWidth);
    let currentY = y;

    lines.forEach(line => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.text(line, x, currentY);
      currentY += fontSize + 2;
    });

    return currentY + 4;
  }

  /**
   * Renderiza um bloco de código
   */
  private static renderCodeBlock(
    pdf: jsPDF, 
    content: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);

    // Background do código
    const lines = content.split('\n');
    const lineHeight = 12;
    const padding = 4;
    const totalHeight = lines.length * lineHeight + padding * 2;

    if (y + totalHeight > pageHeight - 40) {
      pdf.addPage();
      y = 20;
    }

    // Desenhar background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y - padding, maxWidth, totalHeight, 'F');

    // Desenhar borda
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y - padding, maxWidth, totalHeight, 'S');

    let currentY = y;

    lines.forEach(line => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.text(line, x + padding, currentY);
      currentY += lineHeight;
    });

    return currentY + padding;
  }

  /**
   * Renderiza uma tabela markdown com bordas e cabeçalho destacado
   */
  private static renderTable(
    pdf: jsPDF, 
    table: string[][], 
    x: number, 
    y: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    let currentY = y;
    const colCount = table[0]?.length || 1;
    const colWidth = maxWidth / colCount;
    const rowHeight = 10;
    const cellPadding = 2;
    const tableHeight = table.filter(row => !row.every(cell => /^:?-{3,}:?$/.test(cell))).length * rowHeight + 4;
    // Se não couber, pula para nova página
    if (currentY + tableHeight > pageHeight - 40) {
      pdf.addPage();
      currentY = 20;
    }
    // Cores
    const headerBg = [245, 130, 32]; // laranja
    const headerText = [255, 255, 255];
    const borderColor = [200, 200, 200];
    const cellBg = [255, 255, 255];
    const cellText = [68, 68, 68];

    table.forEach((row, rowIndex) => {
      // Ignorar linhas separadoras (ex: |-----|-----|)
      const isSeparator = row.every(cell => /^:?-{3,}:?$/.test(cell));
      if (isSeparator) return;
      if (currentY + rowHeight > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }
      row.forEach((cell, colIndex) => {
        const cellX = x + colIndex * colWidth;
        // Background
        if (rowIndex === 0) {
          pdf.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
        } else {
          pdf.setFillColor(cellBg[0], cellBg[1], cellBg[2]);
        }
        pdf.rect(cellX, currentY, colWidth, rowHeight, 'F');
        // Borda
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(0.3);
        pdf.rect(cellX, currentY, colWidth, rowHeight, 'S');
        // Texto com markdown
        const parts = this.parseMarkdownText(cell);
        // Calcular largura total (incluindo espaços)
        let totalWidth = 0;
        parts.forEach((part, idx) => {
          totalWidth += pdf.getTextWidth(part.text);
          if (idx < parts.length - 1) totalWidth += pdf.getTextWidth(' ');
        });
        const textY = currentY + rowHeight / 2 + 2.5;
        let currentX = cellX + (colWidth - totalWidth) / 2;
        parts.forEach((part, idx) => {
          // Aplica o estilo igual ao parágrafo:
          if (rowIndex === 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(headerText[0], headerText[1], headerText[2]);
          } else if (part.type === 'bold') {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(cellText[0], cellText[1], cellText[2]);
          } else if (part.type === 'italic') {
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(cellText[0], cellText[1], cellText[2]);
          } else if (part.type === 'code') {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
          } else if (part.type === 'link') {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 255);
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(cellText[0], cellText[1], cellText[2]);
          }
          pdf.text(part.text, currentX, textY, { baseline: 'middle' });
          currentX += pdf.getTextWidth(part.text);
          if (idx < parts.length - 1) currentX += pdf.getTextWidth(' ');
        });
      });
      currentY += rowHeight;
    });
    return currentY + 4;
  }

  /**
   * Renderiza um bloco de citação
   */
  private static renderBlockquote(
    pdf: jsPDF,
    content: string,
    x: number,
    y: number,
    maxWidth: number,
    pageHeight: number
  ): number {
    // Dividir o conteúdo em linhas para processar quebras de linha
    const lines = content.split('\n');
    let currentY = y + 10; // Espaçamento do topo
    let currentX = x + 15; // Indentação para o conteúdo
    let maxLineHeight = 6;
    const contentWidth = maxWidth - 15; // Largura disponível para o conteúdo
    // Calcular altura total primeiro
    let totalHeight = 0;
    lines.forEach(line => {
      const parts = this.parseMarkdownText(line);
      let lineWidth = 0;
      let tempX = currentX;
      
      parts.forEach((part, partIndex) => {
        const words = part.text.split(' ');
        words.forEach((word, wordIndex) => {
          const isLastWord = wordIndex === words.length - 1;
          const isLastPart = partIndex === parts.length - 1;
          const wordWithSpace = (!isLastWord || !isLastPart) ? word + ' ' : word;
          const wordWidth = pdf.getTextWidth(wordWithSpace);
          
          if (tempX + lineWidth + wordWidth > x + contentWidth) {
            totalHeight += maxLineHeight;
            lineWidth = 0;
            tempX = x + 15;
          }
          lineWidth += wordWidth;
        });
      });
      totalHeight += maxLineHeight;
    });
    totalHeight += 20; // Espaçamento extra
    // Se não couber, pula para nova página
    if (y + totalHeight > pageHeight - 40) {
      pdf.addPage();
      y = 20;
      currentY = y + 10;
    }
    // Desenhar linha vertical à esquerda com altura calculada
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(3);
    pdf.line(x, y, x, y + totalHeight);
    // Resetar variáveis para renderização
    currentY = y + 10;
    currentX = x + 15;
    // Processar cada linha do blockquote
    lines.forEach(line => {
      if (line.trim() === '') {
        currentY += maxLineHeight; // Espaçamento extra para linhas vazias
        return;
      }
      const parts = this.parseMarkdownText(line);
      let lineWidth = 0;
      // Processar todas as partes em sequência para renderização
      parts.forEach((part, partIndex) => {
        // Aplicar estilo
        if (part.type === 'bold') {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(68, 68, 68);
        } else if (part.type === 'italic') {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(68, 68, 68);
        } else if (part.type === 'code') {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
        } else if (part.type === 'link') {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 255);
        } else {
          pdf.setFont('helvetica', 'italic'); // Citações em itálico por padrão
          pdf.setTextColor(102, 102, 102);
        }

        // Quebra em palavras para respeitar largura máxima
        const words = part.text.split(' ');
        words.forEach((word, wordIndex) => {
          const isLastWord = wordIndex === words.length - 1;
          const isLastPart = partIndex === parts.length - 1;
          const wordWithSpace = (!isLastWord || !isLastPart) ? word + ' ' : word;
          const wordWidth = pdf.getTextWidth(wordWithSpace);
          
          // Verificar se a palavra cabe na linha atual
          if (currentX + lineWidth + wordWidth > x + contentWidth) {
            // Nova linha
            currentY += maxLineHeight;
            lineWidth = 0;
            currentX = x + 15; // Manter indentação
          }
          
          // Verificar se precisa de nova página
          if (currentY > pageHeight - 40) {
            pdf.addPage();
            currentY = 20;
            currentX = x + 15;
            lineWidth = 0;
          }
          
          pdf.text(wordWithSpace, currentX + lineWidth, currentY);
          lineWidth += wordWidth;
        });
        
        // Resetar cor para normal após processar o link
        if (part.type === 'link') {
          pdf.setTextColor(102, 102, 102);
        }
      });
      
      // Nova linha após processar toda a linha do blockquote
      currentY += maxLineHeight;
    });
    
    return currentY + 15; // Espaçamento extra após a citação
  }

  /**
   * Parse markdown text into parts with formatting
   */
  private static parseMarkdownText(text: string): Array<{type: string, text: string}> {
    const parts: Array<{type: string, text: string}> = [];
    let remaining = text;
    // Regex atualizado para incluir links markdown
    const pattern = /(`.+?`)|(\*\*.+?\*\*)|(__.+?__)|(\*.+?\*)|(_.+?_)|(\[.+?\]\(.+?\))/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = pattern.exec(remaining)) !== null) {
      // Adiciona texto normal antes do match
      if (match.index > lastIndex) {
        parts.push({ type: 'normal', text: remaining.slice(lastIndex, match.index) });
      }
      const matched = match[0];
      if (matched.startsWith('`') && matched.endsWith('`')) {
        parts.push({ type: 'code', text: matched.slice(1, -1) });
      } else if (matched.startsWith('**') && matched.endsWith('**')) {
        parts.push({ type: 'bold', text: matched.slice(2, -2) });
      } else if (matched.startsWith('__') && matched.endsWith('__')) {
        parts.push({ type: 'bold', text: matched.slice(2, -2) });
      } else if (matched.startsWith('*') && matched.endsWith('*')) {
        parts.push({ type: 'italic', text: matched.slice(1, -1) });
      } else if (matched.startsWith('_') && matched.endsWith('_')) {
        parts.push({ type: 'italic', text: matched.slice(1, -1) });
      } else if (matched.startsWith('[') && matched.includes('](') && matched.endsWith(')')) {
        // Processar link markdown [texto](url)
        const linkMatch = matched.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          // Para PDF, mostrar apenas o texto do link, não a URL
          parts.push({ type: 'link', text: linkMatch[1] });
        } else {
          parts.push({ type: 'normal', text: matched });
        }
      } else {
        parts.push({ type: 'normal', text: matched });
      }
      lastIndex = match.index + matched.length;
    }
    // Adiciona texto restante
    if (lastIndex < remaining.length) {
      parts.push({ type: 'normal', text: remaining.slice(lastIndex) });
    }
    return parts;
  }

  /**
   * Parse markdown blocks (paragraphs, lists, headings, tables, etc.)
   */
  private static parseMarkdownBlocks(content: string): Array<{type: string, content: string, items?: string[], level?: number, table?: string[][]}> {
    const blocks: Array<{type: string, content: string, items?: string[], level?: number, table?: string[][]}> = [];
    const lines = content.split('\n');
    let currentBlock: any = null;
    let tableBuffer: string[] = [];
    let inTable = false;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Ignorar linhas que são só separadores de tabela
      if (trimmedLine.replace(/\s/g, '').match(/^[|\-:]+$/)) {
        return;
      }

      // Detect table row (starts and ends with |, or has at least one | and --- separator)
      const isTableRow = /^\s*\|(.+)\|\s*$/.test(line) || (/^\s*\|?(.+\|)+(.+)\s*$/.test(line) && line.includes('|'));
      const isTableSeparator = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);

      if (isTableRow && !isTableSeparator) {
        if (!inTable) {
          if (currentBlock) blocks.push(currentBlock);
          inTable = true;
          tableBuffer = [];
        }
        tableBuffer.push(line);
        return;
      }
      if (inTable && (isTableSeparator || trimmedLine === '')) {
        // Fim da tabela
        if (tableBuffer.length > 0) {
          const table = tableBuffer
            // remove qualquer linha que, após remover espaços, seja só |, - ou :
            .filter(l => !l.replace(/\s/g, '').match(/^[|\-:]+$/))
            .map(l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()))
            .filter(row => row.length > 1);
          if (table.length > 0) {
            blocks.push({ type: 'table', table, content: '' });
          }
        }
        inTable = false;
        tableBuffer = [];
        if (trimmedLine === '') return;
      }
      if (inTable) {
        tableBuffer.push(line);
        return;
      }

      // Cabeçalhos
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          type: 'heading',
          content: headingMatch[2],
          level: headingMatch[1].length
        };
        return;
      }

      // Blockquotes (citações)
      const blockquoteMatch = trimmedLine.match(/^>\s*(.*)$/);
      if (blockquoteMatch) {
        // Se for só '>', '> ', '> >', etc, adiciona quebra de linha
        if (blockquoteMatch[1].trim() === '') {
          if (currentBlock && currentBlock.type === 'blockquote') {
            currentBlock.content += '\n';
          } else {
            // Inicia um novo bloco de citação vazio
            currentBlock = { type: 'blockquote', content: '' };
          }
          return;
        }
        if (!currentBlock || currentBlock.type !== 'blockquote') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: 'blockquote', content: '' };
        }
        // Adicionar quebra de linha se já há conteúdo
        if (currentBlock.content && currentBlock.content.trim()) {
          currentBlock.content += '\n' + blockquoteMatch[1];
        } else {
          currentBlock.content = blockquoteMatch[1];
        }
        return;
      }

      // Se estamos em um blockquote e a linha está vazia (sem '>'), finalizar o blockquote
      if (currentBlock && currentBlock.type === 'blockquote' && trimmedLine === '') {
        blocks.push(currentBlock);
        currentBlock = null;
        return;
      }

      // Listas
      const listMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
      if (listMatch) {
        if (!currentBlock || currentBlock.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: 'list', items: [] };
        }
        currentBlock.items.push(listMatch[1]);
        return;
      }

      // Blocos de código
      if (trimmedLine.startsWith('```')) {
        if (currentBlock && currentBlock.type === 'code') {
          blocks.push(currentBlock);
          currentBlock = null;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: 'code', content: '' };
        }
        return;
      }

      // Conteúdo de código
      if (currentBlock && currentBlock.type === 'code') {
        currentBlock.content += line + '\n';
        return;
      }

      // Parágrafos
      if (trimmedLine) {
        if (!currentBlock || currentBlock.type !== 'paragraph') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: 'paragraph', content: '' };
        }
        // Adicionar espaço se já há conteúdo e a linha não está vazia
        if (currentBlock.content && currentBlock.content.trim()) {
          // Se a linha anterior termina com pontuação ou é uma palavra completa, adicionar espaço
          const lastChar = currentBlock.content.trim().slice(-1);
          const needsSpace = !/[.!?]/.test(lastChar) && !/\s$/.test(currentBlock.content);
          currentBlock.content += (needsSpace ? ' ' : '') + trimmedLine;
        } else {
          currentBlock.content = trimmedLine;
        }
      } else {
        // Linha vazia - finalizar bloco atual apenas se não estivermos no meio de uma frase
        if (currentBlock && currentBlock.type === 'paragraph') {
          const lastChar = currentBlock.content.trim().slice(-1);
          // Se termina com pontuação, finalizar o parágrafo
          if (/[.!?]/.test(lastChar)) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
          // Se não termina com pontuação, continuar o parágrafo (pode ser uma quebra de linha no meio)
        } else if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
      }
    });

    // Finalizar tabela no fim do conteúdo
    if (inTable && tableBuffer.length > 0) {
      const table = tableBuffer
        // remove qualquer linha que, após remover espaços, seja só |, - ou :
        .filter(l => !l.replace(/\s/g, '').match(/^[|\-:]+$/))
        .map(l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()))
        .filter(row => row.length > 1);
      if (table.length > 0) {
        blocks.push({ type: 'table', table, content: '' });
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Remove markdown de títulos para o índice
   */
  private static cleanMarkdownFromTitle(title: string): string {
    return title
      // Remove cabeçalhos markdown (# ## ### etc.)
      .replace(/^#{1,6}\s+/g, '')
      // Remove negrito
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove itálico
      .replace(/\*(.*?)\*/g, '$1')
      // Remove código inline
      .replace(/`([^`]+)`/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove blocos de código
      .replace(/```[\s\S]*?```/g, '')
      // Remove listas
      .replace(/^[-*+]\s+/gm, '')
      // Remove listas numeradas
      .replace(/^\d+\.\s+/gm, '')
      // Remove linhas horizontais
      .replace(/^---$/gm, '')
      // Remove espaços extras
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Divide texto em linhas que cabem na largura da página
   */
  private static splitTextIntoLines(pdf: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = pdf.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Carrega uma imagem de uma URL
   */
  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Estima a altura de uma seção (título + conteúdo)
  private static estimateSectionHeight(
    pdf: jsPDF,
    title: string,
    content: string,
    x: number,
    maxWidth: number,
    pageHeight: number
  ): number {
    // Clonar pdf para simular sem desenhar
    const pdfClone = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 0;
    y = this.renderMarkdownTitle(pdfClone, title, x, y, maxWidth, pageHeight);
    y = this.renderMarkdownContent(pdfClone, content, x, y, maxWidth, pageHeight, 1);
    return y;
  }
}