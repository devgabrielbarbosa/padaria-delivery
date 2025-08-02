// netlify/functions/produtos.js
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const dataPath = path.resolve(__dirname, '../../backend/produtos.json');

  if (!fs.existsSync(dataPath)) {
    return {
      statusCode: 404,
      body: JSON.stringify({ erro: 'Arquivo produtos.json não encontrado' })
    };
  }

  const produtos = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify(produtos)
    };
  }

  if (event.httpMethod === 'POST') {
    const novo = JSON.parse(event.body);
    novo.id = produtos.length ? produtos[produtos.length - 1].id + 1 : 1;
    produtos.push(novo);
    fs.writeFileSync(dataPath, JSON.stringify(produtos, null, 2));
    return {
      statusCode: 201,
      body: JSON.stringify(novo)
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ erro: 'Método não permitido' })
  };
};


