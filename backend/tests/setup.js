const MockDate = require('mockdate');
MockDate.set('2025-09-18T12:00:00Z');

// DB
jest.mock(require.resolve('../db'), () => ({
  pool: { query: jest.fn() }
}));

// bcrypt / jwt
jest.mock('bcrypt', () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => 'hash')
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'TEST_JWT')
}));

// Middlewares de auth (asegura que pase cualquier rol)
jest.mock(require.resolve('../middlewares/auth'), () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  requireRole: () => (req, _res, next) => next()
}));

// Servicio 2FA (usa exactamente la misma ruta que importa tu router)
jest.mock(require.resolve('../services/twofactor.service'), () => ({
  startTwoFactor: jest.fn(async () => ({ ok: true, expiresIn: 600 })),
  verifyTwoFactor: jest.fn(async () => ({ ok: true, token: 'TEST_JWT' })),
  resendTwoFactor: jest.fn(async () => ({ ok: true, expiresIn: 600 }))
}));

// Si tu auth.js usa rate-limit u otro middleware, desactívalo en tests:
try {
  jest.mock('express-rate-limit', () => () => (req, res, next) => next());
} catch {}
