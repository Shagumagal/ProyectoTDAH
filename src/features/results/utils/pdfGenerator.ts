import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { ResultsPDF } from '../components/ResultsPDF';
import type { ResultadosAlumno } from '../types';

export const generatePDF = async (data: ResultadosAlumno) => {
  try {
    // 1. Renderizar el componente PDF a un blob
    // @ts-ignore
    const blob = await pdf(createElement(ResultsPDF, { data })).toBlob();
    
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
