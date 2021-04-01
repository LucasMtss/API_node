const fs = require('fs');
const path = require('path');

module.exports = app => {
  fs
    .readdirSync(__dirname) // Ler o diretório atual
    .filter(file => ((file.indexOf('.')) !== 0 && (file !== 'index.js'))) // Exclui arquivos de configuração que começam com '.' e o arquivo index.js
    .forEach(file => require(path.resolve(__dirname, file))(app)); 
};