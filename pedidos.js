const fs = require('fs');
const path = require('path');

const pedidosPath = path.resolve(__dirname, '../../backend/pedidos.json');

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf8'));
    return {
      statusCode: 200,
      body: JSON.stringify(pedidos)
    };
  }

  if (event.httpMethod === 'POST') {
    const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf8'));
    const novo = JSON.parse(event.body);
    novo.id = pedidos.length ? pedidos.at(-1).id + 1 : 1;
    novo.status = 'Pendente';
    pedidos.push(novo);
    fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));
    return {
      statusCode: 201,
      body: JSON.stringify(novo)
    };
  }

  return {
    statusCode: 405,
    body: 'Método não permitido'
  };
};
