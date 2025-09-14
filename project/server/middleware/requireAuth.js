export default function requireAuth(req, res, next) {
  if (req.user && req.user.id) return next(); // your existing auth path
  if (process.env.DEV_ALLOW_DEMO === '1') { req.user = { id: 'demo-user' }; return next(); }
  return res.status(401).json({ error: 'Unauthorized' });
};
