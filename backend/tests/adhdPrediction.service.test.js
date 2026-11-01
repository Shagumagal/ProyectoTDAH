const { prepareInputVector, predictADHD, ML_CONFIG } = require('../services/adhdPrediction.service');

describe('ADHD Prediction Service', () => {
    
    describe('prepareInputVector', () => {
        test('should adjust age to 10.0 if calculated age is less than 9.0', () => {
            const alumno = { fecha_nacimiento: new Date().toISOString(), genero: 'M' };
            const detalles = { n_trials: 160 };
            
            const sixYearsAgo = new Date();
            sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
            alumno.fecha_nacimiento = sixYearsAgo.toISOString();

            const input = prepareInputVector(detalles, alumno);
            expect(input.Age).toBe(10.0);
        });

        test('should handle null or missing fecha_nacimiento safely for 6-8yo target group', () => {
            const input = prepareInputVector({ n_trials: 160 }, { fecha_nacimiento: null, genero: 'M' });
            expect(input.Age).toBe(10.0);
        });

        test('should keep real age if greater than or equal to 9.0', () => {
            const alumno = { fecha_nacimiento: '', genero: 'M' };
            const elevenYearsAgo = new Date();
            elevenYearsAgo.setFullYear(elevenYearsAgo.getFullYear() - 11);
            alumno.fecha_nacimiento = elevenYearsAgo.toISOString();

            const input = prepareInputVector({ n_trials: 160 }, alumno);
            expect(input.Age).toBeCloseTo(11.0, 1); 
        });

        test('should encode gender correctly', () => {
            const detalles = { n_trials: 160 };
            
            expect(prepareInputVector(detalles, { genero: 'Masculino' }).Gender).toBe(1);
            expect(prepareInputVector(detalles, { genero: 'M' }).Gender).toBe(1);
            
            expect(prepareInputVector(detalles, { genero: 'Femenino' }).Gender).toBe(2);
            expect(prepareInputVector(detalles, { genero: 'F' }).Gender).toBe(2);
            expect(prepareInputVector(detalles, { genero: 'Mujer' }).Gender).toBe(2);
        });

        test('should project trials and metrics to 160 trials and normalize ms RT to seconds', () => {
            const alumno = { fecha_nacimiento: '2010-01-01', genero: 'M' };
            const detalles = {
                n_trials: 30,
                n_correct: 15,
                n_incorrect: 5,
                mean_rt: 450,
                median_rt: 420,
                p95_rt: 750,
                std_rt: 80
            };

            const input = prepareInputVector(detalles, alumno);
            
            const factor = 160 / 30;
            expect(input.n_trials).toBe(160);
            expect(input.n_correct).toBeCloseTo(15 * factor);
            expect(input.n_incorrect).toBeCloseTo(5 * factor);
            expect(input.mean_rt).toBeCloseTo(0.45);
            expect(input.median_rt).toBeCloseTo(0.42);
            expect(input.p95_rt).toBeCloseTo(0.75);
            expect(input.std_rt).toBeCloseTo(0.08);
        });
    });

    describe('predictADHD', () => {
        test('should return 0 or 1', () => {
            const input = {
                visit: 1, session: 1, Age: 10, Gender: 1, runid1: 1, runid2: 1,
                n_trials: 160, responded_rate: 0.9, accuracy: 0.8, fail_rate: 0.1,
                mean_rt: 0.4, median_rt: 0.38, p95_rt: 0.6, std_rt: 0.05,
                n_correct: 128, n_incorrect: 10
            };
            const prediction = predictADHD(input);
            expect([0, 1]).toContain(prediction);
        });

        test('should predict correctly for a high risk case (mocked values)', () => {
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

            const prediction = predictADHD(meanInput);
            expect(prediction).toBe(1);
        });
        
        test('should predict correctly for a low risk case', () => {
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
            
            lowRiskInput['visit'] = 10;
            
            const prediction = predictADHD(lowRiskInput);
            expect(prediction).toBe(0);
        });
    });
});
