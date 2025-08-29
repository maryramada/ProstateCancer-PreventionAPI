const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const token = req.headers['x-access-token'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
}

module.exports = authenticateJWT;
