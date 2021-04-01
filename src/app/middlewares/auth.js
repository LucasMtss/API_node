/*
 O middleware fica entre a requisição e a resposta, pode verificar autenticidade de parâmetros e fazer tratamento de erros,
 aumentando a segurança das responses.
 */
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

 module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader)
      return res.status(401).send({ error: 'No token provided' });

    // Formato do token -> Bearer dasd7sadsd7ds8d8sd78sd (hash muito louco!)
    const parts = authHeader.split(' ');
    if(!parts.length === 2)
      return res.status(401).send({ error: 'Token error' });
    
    // Desestruturando o token
    const [ scheme, token ] = parts;

    // Regex para verificar se existe a palavra bearer no scheme
    if(!/^Bearer$/i.test(scheme)){
      return res.status(401).send({ error: 'Token malformatted' });
    }

    jwt.verify(token, authConfig.secret, (err, decoded) => {
      if(err)
        return res.status(401).send({ error: 'Invalid token' });
      // Incluindo informações do user id nas próximas requisições para o conroller
      req.userId = decoded.id;
      return next();
    });


 };