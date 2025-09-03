module.exports = function normalizeUsername(s = "") {
  return s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
};
