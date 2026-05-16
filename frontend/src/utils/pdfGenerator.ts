import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateNotaCreditoPDF = (encomenda: any) => {
    console.log('PDF: Iniciando para', encomenda?.codigoFormatado);
    if (!encomenda) {
        console.error('PDF: Encomenda é nula');
        return;
    }

    try {
        const doc = new jsPDF();
        console.log('PDF: Instância jsPDF criada');
    const pageWidth = doc.internal.pageSize.width;

    // --- Header / Branding ---
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTA DE CRÉDITO', 15, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-PT')}`, 15, 33);

    // --- Company & Supplier Info ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Fornecedor:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(encomenda.fornecedor?.nome || 'Fornecedor não identificado', 15, 62);

    doc.setFont('helvetica', 'bold');
    doc.text('Detalhes do Documento:', pageWidth - 80, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Encomenda: ${encomenda.codigoFormatado}`, pageWidth - 80, 62);
    doc.text(`Pedido Origem: ${encomenda.pedidoCompra?.codigoFormatado || 'N/A'}`, pageWidth - 80, 67);
    doc.text(`Data Receção: ${encomenda.dataEntregaReal ? new Date(encomenda.dataEntregaReal).toLocaleDateString('pt-PT') : 'N/A'}`, pageWidth - 80, 72);

    // --- Table of Items ---
    const tableColumn = ["Produto", "Qtd Recebida", "Preço Un.", "Subtotal"];
    const tableRows: any[] = [];

    const linhas = encomenda.linhas || [];
    linhas.forEach((linha: any) => {
        const rowData = [
            linha.produto?.nome || 'Produto desconhecido',
            linha.quantidadeRecebida || 0,
            new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(linha.precoUnitario || 0),
            new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(((linha.quantidadeRecebida || 0) * (linha.precoUnitario || 0)))
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' }, // Emerald 600
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            3: { halign: 'right' }
        },
        margin: { left: 15, right: 15 }
    });

    // --- Totals ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL RECEBIDO:', pageWidth - 80, finalY + 5);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.text(new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(encomenda.valorTotal || 0), pageWidth - 15, finalY + 5, { align: 'right' });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este documento serve como comprovativo interno de receção de mercadoria.', pageWidth / 2, 285, { align: 'center' });

    // --- Download ---
    const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fornecedorNome = sanitize(encomenda.fornecedor?.nome || 'fornecedor');
    const codigo = sanitize(encomenda.codigoFormatado || '000');
    const dataStr = new Date().toISOString().split('T')[0];
    
    const fileName = `Nota_Credito_${codigo}_${fornecedorNome}_${dataStr}.pdf`;
    
    doc.save(fileName);
    console.log('PDF: Documento guardado como', fileName);
    } catch (error) {
        console.error('PDF: Erro catastrófico ao gerar:', error);
        alert('Erro ao gerar PDF. Verifique se o seu browser está a bloquear janelas de pop-up.');
    }
};
