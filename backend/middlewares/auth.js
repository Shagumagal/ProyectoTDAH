const jwt = require("jsonwebtoken");

function getToken(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7);
  return null;
}

function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "SERVER_MISCONFIG" });

    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: p.sub, role: p.role }; // 'admin'|'profesor'|'psicologo'|'estudiante'
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (!allowed.includes(role)) return res.status(403).json({ error: "FORBIDDEN" });
    next();
  };
}

module.exports = { requireAuth, requireRole };
// helpers/roles.js (opcional)
function isStaff(role) { return role === "profesor" || role === "psicologo"; }
module.exports = { isStaff };
