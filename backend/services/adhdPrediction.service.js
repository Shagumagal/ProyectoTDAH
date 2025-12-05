// backend/services/adhdPrediction.service.js

// Model Parameters (Hardcoded from Python model)
const COEFFICIENTS = [-3.8135472409751108, 0.0, 3.3655277981956595, 0.402634242110309, 1.4431032983970766, 0.415677509110848, 0.0, -0.5758817587898222, 3.386762082054547, 1.6835862368801215, 0.3023652790048167, 1.4267719077370473, 1.8859665887857608, 0.5682283978320876, -1.688652367108186, 1.688652367108186];
const INTERCEPT = 0.562454514484786;
const SCALER_MEANS = [2.08, 1.0, 10.88, 1.5, 1.0866666666666667, 2.2466666666666666, 160.0, 0.8638200000000003, 0.8591616666666666, 0.1425883333333333, 0.4980619987759016, 0.47591, 0.7071693333333333, 0.11748110551753975, 137.19333333333333, 22.80666666666667];
const SCALER_SCALES = [1.852997571504075, 1.0, 0.9724196624914575, 0.5, 0.2813459712801226, 0.4310710176087256, 1.0, 0.044694184185417235, 0.0588348120918975, 0.05861613214143543, 0.06436330426093971, 0.05134319396635417, 0.14950741372773313, 0.04244874518410925, 9.384879091152722, 9.384879091152722];
const FEATURE_MEDIANS = { "Age": 11.0, "Gender": 1.5, "n_trials": 160.0 }; // Partial list
const THRESHOLD = 0.3;

// Feature names in the exact order expected by the model
const FEATURE_COLUMNS = [
    "visit", "session", "Age", "Gender", "runid1", "runid2",
    "n_trials", "responded_rate", "accuracy", "fail_rate",
    "mean_rt", "median_rt", "p95_rt", "std_rt",
    "n_correct", "n_incorrect"
];

/**
 * Prepares the input vector for the model.
 * @param {object} detalles - Metrics from the game (Unity JSON).
 * @param {object} alumno - Student data (fecha_nacimiento, genero).
 * @returns {object} - Input vector with 16 keys.
 */
function prepareModelInput(detalles, alumno) {
    // 1. Calcular Edad (Numérica Continua)
    const birthDate = new Date(alumno.fecha_nacimiento);
    const now = new Date();
    // 365.25 considera años bisiestos para mayor precisión
    const age = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    // 2. Codificar Género (1 y 2)
    // Asumimos: 1 = Masculino, 2 = Femenino (Estándar común en datasets médicos)
    const g = (alumno.genero || "").toString().toUpperCase();
    let genderCode = 1; // Default Masculino
    if (g === 'F' || g === 'FEMENINO' || g === 'FEMALE') {
        genderCode = 2;
    }

    // 3. Retornar Objeto con las 16 columnas exactas
    return {
        // --- Identificadores Dummy (Obligatorios) ---
        visit: 1,
        session: 1,
        Age: Number(age.toFixed(2)), // Ej: 11.5
        Gender: genderCode,          // 1 o 2
        runid1: 1,
        runid2: 1,

        // --- Métricas del Juego ---
        n_trials: detalles.n_trials || 0,
        responded_rate: detalles.responded_rate || 0,
        accuracy: detalles.accuracy || 0,
        fail_rate: detalles.fail_rate || 0,
        mean_rt: detalles.mean_rt || 0,
        median_rt: detalles.median_rt || 0,
        p95_rt: detalles.p95_rt || 0,
        std_rt: detalles.std_rt || 0,
        n_correct: detalles.n_correct || 0,
        n_incorrect: detalles.n_incorrect || 0
    };
}

/**
 * Predicts ADHD probability based on input features.
 * @param {object} inputFeatures - Object with 16 keys.
 * @returns {number} - 1 if ADHD is detected, 0 otherwise.
 */
function predictADHD(inputFeatures) {
    // 1. Convert input object to array in correct order
    const featureVector = FEATURE_COLUMNS.map(col => {
        let val = inputFeatures[col];
        // Simple imputation if undefined/null
        if (val === undefined || val === null) {
            val = FEATURE_MEDIANS[col] !== undefined ? FEATURE_MEDIANS[col] : 0;
        }
        return val;
    });

    // 2. Standard Scaling
    const scaledFeatures = featureVector.map((val, i) => {
        const mean = SCALER_MEANS[i];
        const scale = SCALER_SCALES[i];
        if (scale === 0) return 0; // Avoid division by zero
        return (val - mean) / scale;
    });

    // 3. Logistic Regression Prediction
    let z = INTERCEPT;
    for (let i = 0; i < scaledFeatures.length; i++) {
        z += scaledFeatures[i] * COEFFICIENTS[i];
    }

    // Sigmoid function
    const probability = 1 / (1 + Math.exp(-z));

    // 4. Binary Classification
    return probability >= THRESHOLD ? 1 : 0;
}

module.exports = {
    prepareModelInput,
    predictADHD
};
