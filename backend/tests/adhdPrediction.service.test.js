const { prepareModelInput, predictADHD, ML_CONFIG } = require('../services/adhdPrediction.service');

describe('ADHD Prediction Service', () => {
    
    describe('prepareModelInput', () => {
        test('should adjust age to 10.0 if calculated age is less than 9.0', () => {
            const alumno = { fecha_nacimiento: new Date().toISOString(), genero: 'M' }; // Born today, age ~0
            const detalles = { n_trials: 160 };
            
            // Mock Date to ensure consistent age calculation if needed, 
            // but here we just check the < 9 logic.
            // Let's set a birthdate 6 years ago.
            const sixYearsAgo = new Date();
            sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
            alumno.fecha_nacimiento = sixYearsAgo.toISOString();

            const input = prepareModelInput(detalles, alumno);
            expect(input.Age).toBe(10.0);
        });

        test('should keep real age if greater than or equal to 9.0', () => {
            const alumno = { fecha_nacimiento: '', genero: 'M' };
            const elevenYearsAgo = new Date();
            elevenYearsAgo.setFullYear(elevenYearsAgo.getFullYear() - 11);
            alumno.fecha_nacimiento = elevenYearsAgo.toISOString();

            const input = prepareModelInput({ n_trials: 160 }, alumno);
            // Age should be close to 11.0
            expect(input.Age).toBeCloseTo(11.0, 1); 
        });

        test('should encode gender correctly', () => {
            const detalles = { n_trials: 160 };
            
            expect(prepareModelInput(detalles, { genero: 'Masculino' }).Gender).toBe(1);
            expect(prepareModelInput(detalles, { genero: 'M' }).Gender).toBe(1);
            
            expect(prepareModelInput(detalles, { genero: 'Femenino' }).Gender).toBe(2);
            expect(prepareModelInput(detalles, { genero: 'F' }).Gender).toBe(2);
            expect(prepareModelInput(detalles, { genero: 'Mujer' }).Gender).toBe(2);
        });

        test('should project trials and metrics to 160 trials', () => {
            const alumno = { fecha_nacimiento: '2010-01-01', genero: 'M' };
            const detalles = {
                n_trials: 30,
                n_correct: 15,
                n_incorrect: 5,
                // other metrics...
            };

            const input = prepareModelInput(detalles, alumno);
            
            const factor = 160 / 30;
            expect(input.n_trials).toBe(160);
            expect(input.n_correct).toBeCloseTo(15 * factor);
            expect(input.n_incorrect).toBeCloseTo(5 * factor);
        });
    });

    describe('predictADHD', () => {
        test('should return 0 or 1', () => {
            const input = {
                visit: 1, session: 1, Age: 10, Gender: 1, runid1: 1, runid2: 1,
                n_trials: 160, responded_rate: 0.9, accuracy: 0.8, fail_rate: 0.1,
                mean_rt: 400, median_rt: 380, p95_rt: 600, std_rt: 50,
                n_correct: 128, n_incorrect: 10
            };
            const prediction = predictADHD(input);
            expect([0, 1]).toContain(prediction);
        });

        test('should predict correctly for a high risk case (mocked values)', () => {
            // We can try to construct a case that pushes Z score high.
            // High Age (coeff 3.36) is risky? Wait, let's check coefficients.
            // Age coeff is 3.36. 
            // Let's just verify the math logic with a controlled input.
            
            // If we pass all zeros (after scaling), Z = Intercept.
            // To pass all zeros after scaling, input must equal mean.
            
            const meanInput = {};
            const FEATURE_COLUMNS = [
                "visit", "session", "Age", "Gender", "runid1", "runid2",
                "n_trials", "responded_rate", "accuracy", "fail_rate",
                "mean_rt", "median_rt", "p95_rt", "std_rt",
                "n_correct", "n_incorrect"
            ];
            
            FEATURE_COLUMNS.forEach((col, i) => {
                meanInput[col] = ML_CONFIG.scalerMeans[i];
            });

            // Z should be intercept
            // Intercept = 0.56245451
            // Sigmoid(0.56) > 0.5 > 0.3 (Threshold) -> Should be 1
            
            const prediction = predictADHD(meanInput);
            expect(prediction).toBe(1);
        });
        
         test('should predict correctly for a low risk case', () => {
             // To get low score, we need negative Z.
             // Coeff[0] is -3.8 (visit). Mean is 2.08. Scale 1.85.
             // If we put a large value for visit? No, let's look at a negative coeff.
             // visit coeff is -3.8.
             // If we increase 'visit', (val - mean)/scale increases. 
             // If val is large, scaled is positive large. * -3.8 -> negative large Z.
             
             const lowRiskInput = {};
             const FEATURE_COLUMNS = [
                "visit", "session", "Age", "Gender", "runid1", "runid2",
                "n_trials", "responded_rate", "accuracy", "fail_rate",
                "mean_rt", "median_rt", "p95_rt", "std_rt",
                "n_correct", "n_incorrect"
            ];
            
             FEATURE_COLUMNS.forEach((col, i) => {
                lowRiskInput[col] = ML_CONFIG.scalerMeans[i];
            });
            
            // Increase 'visit' to drive Z down
            // Mean 2.08, Scale 1.85.
            // Let's set visit = 10.
            // (10 - 2.08) / 1.85 = ~4.28
            // 4.28 * -3.81 = -16.3
            // Z = 0.56 - 16.3 = -15.7
            // Sigmoid(-15) ~ 0
            
            lowRiskInput['visit'] = 10;
            
            const prediction = predictADHD(lowRiskInput);
            expect(prediction).toBe(0);
         });
    });
});
