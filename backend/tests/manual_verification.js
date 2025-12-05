const { prepareModelInput, predictADHD, ML_CONFIG } = require('../services/adhdPrediction.service');

console.log("=== Starting Manual Verification of ADHD Prediction Service ===\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passed++;
    } else {
        console.error(`[FAIL] ${message}`);
        failed++;
    }
}

function assertApprox(actual, expected, tolerance = 0.0001, message) {
    if (Math.abs(actual - expected) < tolerance) {
        console.log(`[PASS] ${message} (Expected: ${expected}, Actual: ${actual})`);
        passed++;
    } else {
        console.error(`[FAIL] ${message} (Expected: ${expected}, Actual: ${actual})`);
        failed++;
    }
}

// --- Test Case 1: Age Adjustment ---
console.log("\n--- Test Case 1: Age Adjustment ---");
const mockStudentYoung = { fecha_nacimiento: new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 365.25 * 6)), genero: 'M' }; // 6 years old
const inputYoung = prepareModelInput({}, mockStudentYoung);
assertApprox(inputYoung.Age, 10.0, 0.01, "Age < 9 should be adjusted to 10.0");

const mockStudentOld = { fecha_nacimiento: new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 365.25 * 12)), genero: 'M' }; // 12 years old
const inputOld = prepareModelInput({}, mockStudentOld);
assertApprox(inputOld.Age, 12.0, 0.1, "Age > 9 should remain real age");


// --- Test Case 2: Gender Coding ---
console.log("\n--- Test Case 2: Gender Coding ---");
const inputMale = prepareModelInput({}, { fecha_nacimiento: new Date(), genero: 'Masculino' });
assert(inputMale.Gender === 1, "Gender 'Masculino' should be 1");

const inputFemale = prepareModelInput({}, { fecha_nacimiento: new Date(), genero: 'Femenino' });
assert(inputFemale.Gender === 2, "Gender 'Femenino' should be 2");

const inputFemale2 = prepareModelInput({}, { fecha_nacimiento: new Date(), genero: 'F' });
assert(inputFemale2.Gender === 2, "Gender 'F' should be 2");


// --- Test Case 3: Trial Projection ---
console.log("\n--- Test Case 3: Trial Projection ---");
const mockDetails = {
    n_trials: 30,
    n_correct: 25,
    n_incorrect: 5,
    responded_rate: 0.9,
    accuracy: 0.83,
    fail_rate: 0.17,
    mean_rt: 500,
    median_rt: 480,
    p95_rt: 800,
    std_rt: 100
};
const inputProjection = prepareModelInput(mockDetails, { fecha_nacimiento: new Date(), genero: 'M' });

const expectedFactor = 160 / 30;
assertApprox(inputProjection.n_trials, 160, 0.01, "n_trials should be projected to 160");
assertApprox(inputProjection.n_correct, 25 * expectedFactor, 0.01, "n_correct should be scaled");
assertApprox(inputProjection.n_incorrect, 5 * expectedFactor, 0.01, "n_incorrect should be scaled");
assert(inputProjection.visit === 1, "visit should be 1");
assert(inputProjection.session === 1, "session should be 1");
assert(inputProjection.runid1 === 1, "runid1 should be 1");
assert(inputProjection.runid2 === 1, "runid2 should be 1");


// --- Test Case 4: Prediction Logic (Smoke Test) ---
console.log("\n--- Test Case 4: Prediction Logic ---");
// Create an input that is exactly the mean values -> should result in z = intercept
// scaled = (val - mean) / scale. If val = mean, scaled = 0.
// z = intercept + sum(0 * coeff) = intercept.
// prob = 1 / (1 + exp(-intercept))
// intercept = 0.56245451
// prob = 1 / (1 + exp(-0.56245451)) = 1 / (1 + 0.5698) = 1 / 1.5698 ~= 0.637
// threshold = 0.3 -> prediction should be 1 (ADHD)

const meanInput = {
    visit: ML_CONFIG.scalerMeans[0],
    session: ML_CONFIG.scalerMeans[1],
    Age: ML_CONFIG.scalerMeans[2],
    Gender: ML_CONFIG.scalerMeans[3],
    runid1: ML_CONFIG.scalerMeans[4],
    runid2: ML_CONFIG.scalerMeans[5],
    n_trials: ML_CONFIG.scalerMeans[6],
    responded_rate: ML_CONFIG.scalerMeans[7],
    accuracy: ML_CONFIG.scalerMeans[8],
    fail_rate: ML_CONFIG.scalerMeans[9],
    mean_rt: ML_CONFIG.scalerMeans[10],
    median_rt: ML_CONFIG.scalerMeans[11],
    p95_rt: ML_CONFIG.scalerMeans[12],
    std_rt: ML_CONFIG.scalerMeans[13],
    n_correct: ML_CONFIG.scalerMeans[14],
    n_incorrect: ML_CONFIG.scalerMeans[15]
};

const prediction = predictADHD(meanInput);
console.log(`Prediction for mean input: ${prediction}`);
assert(prediction === 1, "Prediction for mean input should be 1 (High Probability)");


console.log(`\n=== Verification Complete: ${passed} Passed, ${failed} Failed ===`);
if (failed > 0) process.exit(1);
