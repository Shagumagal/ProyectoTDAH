import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { ResultsPDF } from '../components/ResultsPDF';
import type { ResultadosAlumno } from '../types';
import { generateClinicalAnalysis } from './aiAdvisor';

export const generatePDF = async (data: ResultadosAlumno) => {
  try {
    // Generar análisis de IA (Asesor)
    const aiText = generateClinicalAnalysis(data);
    const pdfData = { ...data, aiAnalysisText: aiText };

    // 1. Renderizar el componente PDF a un blob
    const docElement = createElement(ResultsPDF, { data: pdfData }) as unknown as ReactElement<DocumentProps>;
    const blob = await pdf(docElement).toBlob();
    
    // 2. Crear una URL para el blob
    const url = URL.createObjectURL(blob);
    
    // 3. Crear un elemento <a> temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resultados_${data.alumno.nombre || 'Alumno'}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // 4. Simular clic y limpiar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
  }
};
