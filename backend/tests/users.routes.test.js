const express = require('express');
const request = require('supertest');
const { pool } = require('../db');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', require('../routes/users'));
  return app;
}

describe('Rutas /users', () => {
  const app = makeApp();

  test('GET /users → lista mapeada', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nombre_completo: 'Juan Pérez',
          email: 'juan@demo',
          username: 'juan',
          rol_db: 'estudiante',
          activo: true,
          fecha_nacimiento: '2018-05-10',
          genero: 'M',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          nombre_completo: 'Ana Doc',
          email: 'ana@demo',
          username: 'ana',
          rol_db: 'profesor',
          activo: false,
          fecha_nacimiento: null,
          genero: 'F',
          created_at: '2025-01-01T00:00:00Z'
        }
      ]
    });

    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const juan = res.body.find(u => u.username === 'juan');
    const ana = res.body.find(u => u.username === 'ana');
    expect(juan.rol).toMatch(/Alumno|Estudiante/i);
    expect(ana.rol).toMatch(/Docente|Profesor/i);
  });

  test('POST /users (Alumno sin email) → 201', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // SELECT id FROM app.roles
        .mockResolvedValueOnce({
          rows: [
            { column_name: 'must_change_password' },
            { column_name: 'fecha_nacimiento' },
            { column_name: 'genero' }
          ]
        }) // information_schema.columns
        .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT INTO app.usuarios
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn()
    };
    pool.connect.mockResolvedValueOnce(mockClient);

    const res = await request(app)
      .post('/users')
      .send({
        nombres: 'Luis',
        apellidos: 'Gómez',
        rol: 'estudiante',
        username: 'luisg',
        password: '123456',
        fecha_nacimiento: '2018-05-10'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(99);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('PATCH /users/:id/status → 200', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5, activo: false }] });

    const res = await request(app)
      .patch('/users/5/status')
      .send({ is_active: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.activo).toBe(false);
  });
});
