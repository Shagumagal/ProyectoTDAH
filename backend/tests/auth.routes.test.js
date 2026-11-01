const express = require('express');
const request = require('supertest');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const twofa = require('../services/twofactor.service');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', require('../routes/auth'));
  return app;
}

describe('Rutas /auth', () => {
  const app = makeApp();

  test('login-password → 2FA_REQUIRED si rol requiere 2FA y tiene email', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 42,
        email: 'alguien@demo.local',
        username: 'docente1',
        password_hash: 'hash',
        must_change_password: false,
        activo: true,
        role: 'profesor'
      }]
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/auth/login-password')
      .send({ identifier: 'alguien@demo.local', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('2FA_REQUIRED');
    expect(res.body.user_id).toBe(42);
    expect(twofa.startTwoFactor).toHaveBeenCalledWith({ id: 42, email: 'alguien@demo.local' });
  });

  test('login-password → OK + token si rol estudiante (sin 2FA)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 7,
        email: null,
        username: 'alumno1',
        password_hash: 'hash',
        must_change_password: false,
        activo: true,
        role: 'estudiante'
      }]
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/auth/login-password')
      .send({ identifier: 'alumno1', password: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('token');
  });

  test('login-password → 401 credenciales inválidas', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'x@x', password_hash: 'hash', activo: true, role: 'profesor' }]
    });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/auth/login-password')
      .send({ identifier: 'x@x', password: 'wrong' });

    expect(res.statusCode).toBe(401);
  });

  test('verify-2fa → token OK', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ role: 'profesor', must_change_password: false, activo: true }]
      })
      .mockResolvedValueOnce({
        rows: [{ username: 'docente1', email: 'alguien@demo.local' }]
      });

    const res = await request(app)
      .post('/auth/verify-2fa')
      .send({ user_id: 42, code: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('resend-2fa → 200', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 42, email: 'alguien@demo.local', activo: true }]
    });

    const res = await request(app)
      .post('/auth/resend-2fa')
      .send({ user_id: 42 });

    expect(res.statusCode).toBe(200);
    expect(twofa.resendTwoFactor).toHaveBeenCalledWith({ id: 42, email: 'alguien@demo.local' });
  });
});
