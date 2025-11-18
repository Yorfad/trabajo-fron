import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Mapea colores de semáforo a colores RGB para PDF
 * Rangos: Verde >= 66.67%, Amarillo >= 33.34%, Rojo < 33.34%
 */
const getSemaforoColor = (color) => {
  switch (color) {
    case 'Verde':
      return [34, 197, 94]; // green-500
    case 'Amarillo':
      return [234, 179, 8]; // yellow-500
    case 'Rojo':
      return [239, 68, 68]; // red-500
    default:
      return [156, 163, 175]; // gray-400
  }
};

/**
 * Genera un PDF con los resultados del análisis filtrado
 * @param {Object} data - Datos del análisis filtrado
 */
export const generateFilteredAnalyticsPDF = (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Título principal
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Análisis de Resultados CAB', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Información de filtros
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Comunidad: ${data.filtros.comunidad}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Vuelta: ${data.filtros.vuelta}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Encuesta: ${data.filtros.encuesta}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-GT')}`, 14, yPosition);
  yPosition += 12;

  // Semáforo por Categoría
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Semáforo por Categoría', 14, yPosition);
  yPosition += 8;

  const categoriasRows = data.semaforo_categorias.map((cat) => [
    cat.categoria,
    cat.promedio,
    cat.color_semaforo,
    cat.total_respuestas.toString(),
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Categoría', 'Promedio', 'Semáforo', 'Respuestas']],
    body: categoriasRows,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 10 },
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
    },
    didDrawCell: (data) => {
      // Colorear la celda del semáforo
      if (data.column.index === 2 && data.section === 'body') {
        const color = data.cell.raw;
        const rgb = getSemaforoColor(color);
        doc.setFillColor(...rgb);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(color, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, {
          align: 'center',
          baseline: 'middle',
        });
      }
    },
  });

  yPosition = doc.lastAutoTable.finalY + 12;

  // Semáforo por Pregunta (nueva página si es necesario)
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Semáforo por Pregunta', 14, yPosition);
  yPosition += 8;

  const preguntasRows = data.semaforo_preguntas.map((preg) => [
    preg.pregunta.substring(0, 60) + (preg.pregunta.length > 60 ? '...' : ''),
    preg.categoria,
    preg.tipo,
    preg.promedio,
    preg.color_semaforo,
    preg.total_respuestas.toString(),
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Pregunta', 'Categoría', 'Tipo', 'Promedio', 'Semáforo', 'Resp.']],
    body: preguntasRows,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20, halign: 'center', fontSize: 7 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Colorear la celda del semáforo
      if (data.column.index === 4 && data.section === 'body') {
        const color = data.cell.raw;
        const rgb = getSemaforoColor(color);
        doc.setFillColor(...rgb);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(color, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, {
          align: 'center',
          baseline: 'middle',
        });
      }
    },
  });

  yPosition = doc.lastAutoTable.finalY + 12;

  // Lista de Respuestas (nueva página)
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Respuestas Individuales', 14, yPosition);
  yPosition += 8;

  const respuestasRows = data.respuestas.map((resp) => [
    resp.boleta_num.toString(),
    resp.nombre_encuestada || 'N/A',
    resp.edad_encuestada?.toString() || 'N/A',
    resp.nombre_encuestador,
    new Date(resp.aplicada_en).toLocaleDateString('es-GT'),
    resp.promedio_respuesta,
    resp.color_semaforo,
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [['Boleta', 'Encuestada', 'Edad', 'Encuestador', 'Fecha', 'Prom.', 'Sem.']],
    body: respuestasRows,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35 },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Colorear la celda del semáforo
      if (data.column.index === 6 && data.section === 'body') {
        const color = data.cell.raw;
        const rgb = getSemaforoColor(color);
        doc.setFillColor(...rgb);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(color, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, {
          align: 'center',
          baseline: 'middle',
        });
      }
    },
  });

  // Pie de página en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Sistema CAB - Centro Agrícola Bautista',
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Descargar el PDF
  const fileName = `Analisis_${data.filtros.comunidad.replace(/\s+/g, '_')}_Vuelta${data.filtros.vuelta}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

/**
 * Genera un PDF con el detalle de una respuesta individual
 * @param {Object} data - Datos de la respuesta individual
 */
export const generateResponseDetailPDF = (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Título principal
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`Detalle de Respuesta - Boleta #${data.respuesta.boleta_num}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 12;

  // Información general
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Encuesta: ${data.respuesta.encuesta}`, 14, yPosition);
  yPosition += 6;
  doc.text(
    `Comunidad: ${data.respuesta.comunidad}, ${data.respuesta.municipio}, ${data.respuesta.departamento}`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Encuestada: ${data.respuesta.nombre_encuestada || 'N/A'}${data.respuesta.edad_encuestada ? ` (${data.respuesta.edad_encuestada} años)` : ''}`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Encuestador: ${data.respuesta.nombre_encuestador || data.respuesta.usuario}${data.respuesta.sexo_encuestador ? ` (${data.respuesta.sexo_encuestador})` : ''}`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Fecha: ${new Date(data.respuesta.aplicada_en).toLocaleString('es-GT')}`,
    14,
    yPosition
  );
  yPosition += 6;
  doc.text(`Vuelta: ${data.respuesta.vuelta}`, 14, yPosition);
  yPosition += 12;

  // Respuestas por categoría
  Object.entries(data.categorias).forEach(([categoria, preguntas]) => {
    // Verificar si necesitamos nueva página
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(categoria, 14, yPosition);
    yPosition += 8;

    const rows = preguntas.map((preg) => [
      preg.pregunta.substring(0, 50) + (preg.pregunta.length > 50 ? '...' : ''),
      preg.tipo,
      preg.valor_texto || preg.valor_numerico?.toString() || 'N/A',
      preg.puntaje_0a10.toString(),
      preg.color_semaforo,
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Pregunta', 'Tipo', 'Respuesta', 'Puntaje', 'Semáforo']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25, fontSize: 7 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
      },
      didDrawCell: (cellData) => {
        // Colorear la celda del semáforo
        if (cellData.column.index === 4 && cellData.section === 'body') {
          const color = cellData.cell.raw;
          const rgb = getSemaforoColor(color);
          doc.setFillColor(...rgb);
          doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.text(
            color,
            cellData.cell.x + cellData.cell.width / 2,
            cellData.cell.y + cellData.cell.height / 2 + 1,
            { align: 'center', baseline: 'middle' }
          );
        }
      },
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Sistema CAB - Centro Agrícola Bautista',
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Descargar el PDF
  const fileName = `Respuesta_Boleta${data.respuesta.boleta_num}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};
