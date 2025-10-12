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
        { id: 1, nombre: 'Juan Pérez', email: 'juan@demo', username: 'juan', rol: 'estudiante', activo: true },
        { id: 2, nombre: 'Ana Doc', email: 'ana@demo', username: 'ana', rol: 'profesor', activo: false }
      ]
    });

    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    const juan = res.body.find(u => u.username === 'juan');
    const ana = res.body.find(u => u.username === 'ana');
    expect(juan.rol).toMatch(/Alumno|Estudiante/i);
    expect(ana.rol).toMatch(/Docente|Profesor/i);
  });

  test('POST /users (Alumno sin email) → 201', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }) // INSERT
      .mockResolvedValueOnce({ rows: [{ id: 99 }] }); // SELECT opcional

    const res = await request(app)
      .post('/users')
      .send({
        nombres: 'Luis',
        apellidos: 'Gómez',
        rol: 'Alumno',
        username: 'luisg',
        password: '123456'
      });

    expect(res.statusCode).toBe(201);
    expect(pool.query).toHaveBeenCalled();
  });

  test('PATCH /users/:id/status → 200', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5, activo: false }] });

    const res = await request(app)
      .patch('/users/5/status')
      .send({ activo: false });

    expect(res.statusCode).toBe(200);
  });
});
