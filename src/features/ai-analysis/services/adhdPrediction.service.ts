
// Parámetros extraídos del modelo Python
const coefficients: number[] = [-3.8135472409751108, 0.0, 3.3655277981956595, 0.402634242110309, 1.4431032983970766, 0.415677509110848, 0.0, -0.5758817587898222, 3.386762082054547, 1.6835862368801215, 0.3023652790048167, 1.4267719077370473, 1.8859665887857608, 0.5682283978320876, -1.688652367108186, 1.688652367108186];
const intercept: number = 0.562454514484786;
const scalerMeans: number[] = [2.08, 1.0, 10.88, 1.5, 1.0866666666666667, 2.2466666666666666, 160.0, 0.8638200000000003, 0.8591616666666666, 0.1425883333333333, 0.4980619987759016, 0.47591, 0.7071693333333333, 0.11748110551753975, 137.19333333333333, 22.80666666666667];
const scalerScales: number[] = [1.852997571504075, 1.0, 0.9724196624914575, 0.5, 0.2813459712801226, 0.4310710176087256, 1.0, 0.044694184185417235, 0.0588348120918975, 0.05861613214143543, 0.06436330426093971, 0.05134319396635417, 0.14950741372773313, 0.04244874518410925, 9.384879091152722, 9.384879091152722];

// Los feature_medians deben mapearse por nombre de característica a su valor

const featureMedians: { [key: string]: number } = {
    "Age": 11.0,
    "Gender": 1.5,
    "n_trials": 160.0,
};

// Lista de columnas en orden.

const featureColumns: string[] = [
    "Feature_0", "Feature_1", "Feature_2", "Feature_3", "Feature_4", "Feature_5", "Feature_6", "Feature_7",
    "Feature_8", "Feature_9", "Feature_10", "Feature_11", "Feature_12", "Feature_13", "Feature_14", "Feature_15"
];

const threshold: number = 0.3; // Umbral seleccionado

export interface InputFeatures {
    [key: string]: number | undefined;
}

export function predictADHD(input: InputFeatures): number {
    // 1. Imputación por mediana
   
    // si falta el valor y la mediana.
    const imputedFeatures: number[] = featureColumns.map((col, i) => {
        const inputValue = input[col];
        // Fallback a scalerMeans[i] si no hay mediana definida, asumiendo que la media es una buena imputación
        const fallback = featureMedians[col] !== undefined ? featureMedians[col] : scalerMeans[i];
        return inputValue !== undefined && !isNaN(inputValue) ? inputValue : fallback;
    });

    // 2. Escalado de características (StandardScaler)
    const scaledFeatures: number[] = imputedFeatures.map((value, i) => {
        // Evitar división por cero si la desviación estándar es 0
        if (scalerScales[i] === 0) {
            return (value - scalerMeans[i]); // Si std es 0, el valor escalado es la diferencia a la media
        } else {
            return (value - scalerMeans[i]) / scalerScales[i];
        }
    });

    // 3. Predicción de Regresión Logística (Cálculo del producto punto + intercepto)
    // Multiplicar características escaladas por coeficientes y sumar el intercepto
    let z: number = intercept;
    for (let i = 0; i < scaledFeatures.length; i++) {
        z += scaledFeatures[i] * coefficients[i];
    }

    // Aplicar la función sigmoide para obtener la probabilidad
    // Fórmula de la función sigmoide: 1 / (1 + Math.exp(-z))
    const probability: number = 1 / (1 + Math.exp(-z));

    // 4. Convertir la probabilidad en una predicción binaria usando el umbral
    const prediction: number = probability >= threshold ? 1 : 0;

    return prediction;
}
