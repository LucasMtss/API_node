const express = require('express');
const path = require('path');
const User = require('../models/user');
const bcrypt =  require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require("../../modules/mailer");
const authConfig = require("../../config/auth.json"); // Hash md5 única para o token da aplicação

const router = express.Router();

// Gerando token de autenticação
function generateToken(params = {}){
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400, // Expiração do token em segundos
  });
}

router.post('/register', async (req, res) => {
  const { email } = req.body;
  try {
    // Pesquisando se o email já foi cadastrado
    if(await User.findOne({ email }))
      return res.status(400).send({ error: 'User already exists'});
    const user = await User.create(req.body);
    // Usando password = undefined para não mostrá-la no response
    user.password = undefined;
    return res.send({
       user, 
       token: generateToken({ id: user.id }) 
      });
  } catch (err){
    res.status(400).send({ error: err})
  }
});

router.post('/authenticate', async (req, res) =>{
  const { email, password} = req.body;
  // Buscando usuário
  const user = await User.findOne({ email }).select('+password');
  // Verificando se o usuário existe
  if(!user)
    return res.status(400).send({ error: 'User not found'});
  // Comparando se a senha indicada é equivalente a senha do usuário
  if(!await bcrypt.compare(password, user.password))
    return res.status(400).send({ error: 'Invalid password'});
  user.password = undefined;
  
  res.send({ 
    user,
    token: generateToken({ id: user.id }),
  });
});

router.post('/forgot_password', async (req, res) =>{
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }); // Procura pelo email entre os usuários
    if(!user)
    return res.status(400).send({ error: 'User not found'});
    
    const token = crypto.randomBytes(20).toString('hex'); // Gerando token aleatório de 20 caracteres em hexadecimal
    const now = new Date();
    now.setHours(now.getHours() + 1); // Setando o tempo de expiração do token para 1h
    // Alterando usuário
    await User.findByIdAndUpdate(user.id, {
      // Campos a serem setados
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    });
    mailer.sendMail({
      to: email,
      from: 'lucasrmts2@gmail.com',
      html: `<p>Esqueceu a senha? Sem problemas! use este token para redefinir a senha: ${token}</p>`
    }, (err) => {
        if(err)
          return res.status(400).send({error: 'Cannot send forgot password email'});
        return res.send();
    });
  } catch (err) {
      return res.status(400).send({ error: 'Erro on forgot password, try again' });
  }
});

router.post('/reset_password', async (req, res) => {
  const { email, token, password} = req.body;
  try {
    const user = await User.findOne({ email })
    .select('+passwordResetToken passwordResetExpires'); // Dando select nos campos ocultos

    if(!user)
      return res.status(400).send({ error: 'User not found'});
    
    if(token !== user.passwordResetToken)
      return res.status(400).send({ error: 'Invalid token'});

    const now = new Date();
    if(now > user.passwordResetExpires) // Verificando se a data atual é maior que a data de expiração do token
      return res.status(400).send({ error: 'Token expired, generate a new one'});
    user.password = password;
    await user.save();
    res.send();
  } catch (err) {
      res.status(400).send({error: 'Cannot reset password, try again'});
  }
});

module.exports = app => app.use('/auth', router);