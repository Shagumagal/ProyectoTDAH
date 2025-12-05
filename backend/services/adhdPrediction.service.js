// backend/services/adhdPrediction.service.js

// 1. Constantes del Modelo (Extraídas del .pkl)
const ML_CONFIG = {
    coefficients: [-3.81354724, 0.0, 3.3655278, 0.40263424, 1.4431033, 0.41567751, 0.0, -0.57588176, 3.38676208, 1.68358624, 0.30236528, 1.42677191, 1.88596659, 0.5682284, -1.68865237, 1.68865237],
    intercept: 0.56245451,
    scalerMeans: [2.08, 1.0, 10.88, 1.5, 1.08666667, 2.24666667, 160.0, 0.86382, 0.85916167, 0.14258833, 0.498062, 0.47591, 0.70716933, 0.11748111, 137.193333, 22.8066667],
    scalerScales: [1.85299757, 1.0, 0.97241966, 0.5, 0.28134597, 0.43107102, 1.0, 0.04469418, 0.05883481, 0.05861613, 0.0643633, 0.05134319, 0.14950741, 0.04244875, 9.38487909, 9.38487909],
    threshold: 0.3
};

// Feature names in the exact order expected by the model
const FEATURE_COLUMNS = [
    "visit", "session", "Age", "Gender", "runid1", "runid2",
    "n_trials", "responded_rate", "accuracy", "fail_rate",
    "mean_rt", "median_rt", "p95_rt", "std_rt",
    "n_correct", "n_incorrect"
];

/**
 * 2. Lógica de Preparación de Datos (Data Fusion & Projection)
 * @param {object} detalles - Metrics from the game (Unity JSON).
 * @param {object} alumno - Student data (fecha_nacimiento, genero).
 * @returns {object} - Input vector with 16 keys.
 */
function prepareInputVector(detalles, alumno) {
    // A. Ajuste de Edad (Anti-Sesgo)
    const birthDate = new Date(alumno.fecha_nacimiento);
    const now = new Date();
    // 365.25 considera años bisiestos para mayor precisión
    let age = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Regla: Si edad < 9.0, fuerza el valor a 10.0.
    if (age < 9.0) {
        age = 10.0;
    }

    // B. Ajuste de Género
    // Codificación: Masculino = 1, Femenino = 2.
    const g = (alumno.genero || "").toString().toUpperCase();
    let genderCode = 1; // Default Masculino
    if (g === 'F' || g === 'FEMENINO' || g === 'FEMALE' || g === 'MUJER' || g === 'NIÑA') {
        genderCode = 2;
    }

    // C. Proyección de Intentos (Escalado de Sesión)
    // El modelo espera 160 trials. Nosotros tenemos N (ej. 30).
    const nTrialsActual = detalles.n_trials || 0;
    const factor = nTrialsActual > 0 ? (160 / nTrialsActual) : 0;

    const nCorrectInput = (detalles.n_correct || 0) * factor;
    const nIncorrectInput = (detalles.n_incorrect || 0) * factor;

    // 3. Vector Final (Orden Estricto)
    return {
        // --- D. Variables Dummy (Relleno) ---
        visit: 1,
        session: 1,
        Age: Number(age.toFixed(2)), // Ajustada
        Gender: genderCode,          // 1 o 2
        runid1: 1,
        runid2: 1,

        // --- Métricas del Juego ---
        n_trials: 160, // Proyectado a 160
        responded_rate: detalles.responded_rate || 0,
        accuracy: detalles.accuracy || 0,
        fail_rate: detalles.fail_rate || 0,
        mean_rt: detalles.mean_rt || 0,
        median_rt: detalles.median_rt || 0,
        p95_rt: detalles.p95_rt || 0,
        std_rt: detalles.std_rt || 0,
        n_correct: nCorrectInput,     // Proyectado
        n_incorrect: nIncorrectInput  // Proyectado
    };
}

/**
 * 4. Algoritmo de Predicción
 * @param {object} inputFeatures - Object with 16 keys.
 * @returns {number} - 1 if ADHD is detected, 0 otherwise.
 */
function predictADHD(inputFeatures) {
    // 1. Convert input object to array in correct order
    const featureVector = FEATURE_COLUMNS.map(col => {
        let val = inputFeatures[col];
        // Simple imputation if undefined/null
        if (val === undefined || val === null) {
            val = 0;
        }
        return val;
    });

    // 2. Standard Scaling & Dot Product
    // z = intercept + SUM(scaled[i] * coefficients[i])
    // scaled[i] = (input[i] - scalerMeans[i]) / scalerScales[i]
    
    let z = ML_CONFIG.intercept;
    
    for (let i = 0; i < featureVector.length; i++) {
        const val = featureVector[i];
        const mean = ML_CONFIG.scalerMeans[i];
        const scale = ML_CONFIG.scalerScales[i];
        const coeff = ML_CONFIG.coefficients[i];
        
        // Evitar división por cero si scale es 0
        const scaledVal = scale !== 0 ? (val - mean) / scale : 0;
        
        z += scaledVal * coeff;
    }

    // 3. Sigmoide: prob = 1 / (1 + exp(-z))
    const probability = 1 / (1 + Math.exp(-z));

    // 4. Clasificar: prediction = prob >= threshold ? 1 : 0
    return probability >= ML_CONFIG.threshold ? 1 : 0;
}

module.exports = {
    prepareInputVector,
    predictADHD,
    ML_CONFIG // Exported for testing purposes
};
