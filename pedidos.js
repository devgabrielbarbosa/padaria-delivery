const fs = require('fs');
const path = require('path');

const pedidosPath = path.resolve(__dirname, '../../backend/pedidos.json');

exports.handler = async (event) => {
  if (!fs.existsSync(pedidosPath)) {
    return {
      statusCode: 404,
      body: JSON.stringify({ erro: 'Arquivo pedidos.json não encontrado' })
    };
  }

  const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: JSON.stringify(pedidos)
    };
  }

  if (event.httpMethod === 'POST') {
    const novo = JSON.parse(event.body);
    novo.id = pedidos.length ? pedidos[pedidos.length - 1].id + 1 : 1;
    novo.status = 'Pendente';
    pedidos.push(novo);
    fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));
    return {
      statusCode: 201,
      body: JSON.stringify(novo)
    };
  }

  if (event.httpMethod === 'PUT') {
    const id = Number(event.queryStringParameters.id);
    const status = JSON.parse(event.body).status;
    const index = pedidos.findIndex(p => p.id === id);

    if (index === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ erro: 'Pedido não encontrado' })
      };
    }

    pedidos[index].status = status;
    fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify(pedidos[index])
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ erro: 'Método não permitido' })
  };
};
