import React, { useState } from 'react';
import { predictADHD } from '../services/adhdPrediction.service';

const AiAnalysisPage: React.FC = () => {
    const [prediction, setPrediction] = useState<number | null>(null);

    const handleAnalysis = async () => {
        try {
            const result = await predictADHD();
            setPrediction(result);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Error al realizar el análisis. Por favor intente nuevamente.");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Análisis de Resultados con IA</h1>
            <p className="mb-4">
                Esta herramienta utiliza un modelo de Regresión Logística para analizar los datos y predecir la probabilidad de TDAH.
            </p>
            
            <button 
                onClick={handleAnalysis}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
                Realizar Análisis con IA
            </button>

            {prediction !== null && (
                <div className="mt-6 p-4 border rounded bg-gray-50">
                    <h2 className="text-xl font-semibold mb-2">Resultado del Análisis:</h2>
                    <p className="text-lg">
                        Predicción: <strong>{prediction === 1 ? "Posible TDAH Detectado" : "No se detecta TDAH"}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        Nota: Este resultado es una estimación basada en el modelo y no sustituye un diagnóstico profesional.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AiAnalysisPage;
