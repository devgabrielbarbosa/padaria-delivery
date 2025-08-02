const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Arquivos de dados (JSON)
const produtosPath = './produtos.json';
const pedidosPath = './pedidos.json';

// Função para ler dados do JSON
function lerJSON(caminho) {
  if (!fs.existsSync(caminho)) return [];
  return JSON.parse(fs.readFileSync(caminho));
}

// Função para salvar dados no JSON
function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
}

/* ========== ROTAS DE PRODUTOS ========== */

// GET: listar todos os produtos
app.get('/produtos', (req, res) => {
  const produtos = lerJSON(produtosPath);
  res.json(produtos);
});

// POST: adicionar novo produto
app.post('/produtos', (req, res) => {
  const produtos = lerJSON(produtosPath);
  const novoProduto = req.body;

  novoProduto.id = produtos.length ? produtos[produtos.length - 1].id + 1 : 1;
  produtos.push(novoProduto);
  salvarJSON(produtosPath, produtos);

  res.status(201).json(novoProduto);
});

// PUT: editar produto existente
app.put('/produtos/:id', (req, res) => {
  const produtos = lerJSON(produtosPath);
  const id = parseInt(req.params.id);
  const index = produtos.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Produto não encontrado' });
  }

  produtos[index] = { ...produtos[index], ...req.body, id };
  salvarJSON(produtosPath, produtos);

  res.json(produtos[index]);
});

// DELETE: excluir produto
app.delete('/produtos/:id', (req, res) => {
  const produtos = lerJSON(produtosPath);
  const id = parseInt(req.params.id);
  const novosProdutos = produtos.filter(p => p.id !== id);

  if (novosProdutos.length === produtos.length) {
    return res.status(404).json({ mensagem: 'Produto não encontrado' });
  }

  salvarJSON(produtosPath, novosProdutos);
  res.json({ mensagem: 'Produto removido com sucesso' });
});

/* ========== ROTAS DE PEDIDOS ========== */

// GET: listar todos os pedidos
app.get('/pedidos', (req, res) => {
  const pedidos = lerJSON(pedidosPath);
  res.json(pedidos);
});

// POST: criar novo pedido
app.post('/pedidos', (req, res) => {
  const pedidos = lerJSON(pedidosPath);
  const novoPedido = req.body;

  novoPedido.id = pedidos.length ? pedidos[pedidos.length - 1].id + 1 : 1;
  novoPedido.status = 'Pendente';

  pedidos.push(novoPedido);
  salvarJSON(pedidosPath, pedidos);

  res.status(201).json({ mensagem: 'Pedido recebido com sucesso!' });
});

// PUT: atualizar status do pedido
app.put('/pedidos/:id', (req, res) => {
  const pedidos = lerJSON(pedidosPath);
  const id = parseInt(req.params.id);
  const index = pedidos.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Pedido não encontrado' });
  }

  pedidos[index] = { ...pedidos[index], status: req.body.status };
  salvarJSON(pedidosPath, pedidos);

  res.json(pedidos[index]);
});

/* ========== INICIAR SERVIDOR ========== */

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
