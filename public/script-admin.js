// 🌐 Endpoints do backend
const urlProdutos = 'http://localhost:3000/produtos';
const urlPedidos = 'http://localhost:3000/pedidos';

// 🔗 Elementos do DOM
const listaProdutos = document.getElementById('listaProdutos');
const listaPedidos = document.getElementById('listaPedidos');
const formProduto = document.getElementById('formProduto');

const produtoIdInput = document.getElementById('produtoId');
const nomeProdutoInput = document.getElementById('nomeProduto');
const precoProdutoInput = document.getElementById('precoProduto');
const descricaoProdutoInput = document.getElementById('descricaoProduto');
const imagemProdutoInput = document.getElementById('imagemProduto');
const cancelarEdicaoBtn = document.getElementById('cancelarEdicao');
const preview = document.getElementById('preview');
const listaFinalizados = document.getElementById('listaFinalizados');
document.getElementById('buscaProduto')?.addEventListener('input', renderizarProdutos);
const categoria = document.getElementById('categoriaProduto').value;




// 📦 Variáveis de controle
let produtos = [];
let pedidos = [];
let editandoProdutoId = null;

/* =========================
   PRODUTOS
========================= */

async function carregarPedidos() {
  try {
    const res = await fetch(urlPedidos);
    pedidos = await res.json();
    renderizarPedidos();
    renderizarPedidosFinalizados(); // ➕ renderizar pedidos entregues
  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
  }
}

function renderizarProdutos() {
  const termo = document.getElementById('buscaProduto')?.value.toLowerCase() || '';
  listaProdutos.innerHTML = '';

  produtos
    .filter(p => p.nome.toLowerCase().includes(termo) || (p.categoria || '').toLowerCase().includes(termo))
    .forEach(p => {
      const card = document.createElement('div');
      card.className = 'produto-card';

      const statusBtn = p.ativo
        ? `<button class="danger" onclick="alterarStatusProduto(${p.id}, false)">Desativar</button>`
        : `<button class="success" onclick="alterarStatusProduto(${p.id}, true)">Ativar</button>`;

      card.innerHTML = `
        <img src="${p.imagem}" alt="${p.nome}" class="produto-img" />
        <div>
          <strong>${p.nome}</strong><br>
          <small>${p.descricao || ''}</small><br>
          <span><strong>Categoria:</strong> ${p.categoria || 'N/A'}</span><br>
          <span><strong>Preço:</strong> R$ ${p.preco.toFixed(2)}</span><br>
          <span><strong>Status:</strong> ${p.ativo ? 'Ativo ✅' : 'Inativo ❌'}</span>
          <div class="acoes">
            <button onclick="editarProduto(${p.id})">Editar</button>
            <button onclick="deletarProduto(${p.id})">Excluir</button>
            ${statusBtn}
          </div>
        </div>
      `;

      listaProdutos.appendChild(card);
    });
}

async function alterarStatusProduto(id, novoStatus) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  try {
    await fetch(`${urlProdutos}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...produto, ativo: novoStatus })
    });
    carregarProdutos(); // atualiza lista
  } catch (err) {
    alert('Erro ao alterar status do produto');
    console.error(err);
  }
}

formProduto.addEventListener('submit', async e => {
  e.preventDefault();

  const nome = nomeProdutoInput.value.trim();
  const preco = parseFloat(precoProdutoInput.value);
  const descricao = descricaoProdutoInput.value.trim();
  const imagemFile = imagemProdutoInput.files[0];

  if (!nome || isNaN(preco) || (!editandoProdutoId && !imagemFile) || !descricao) {
    alert('Preencha todos os campos corretamente!');
    return;
  }

  try {
    let imagemUrl = '';

    if (imagemFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        const formData = new FormData();
        formData.append('image', base64Image);

        const res = await fetch('https://api.imgbb.com/1/upload?key=5633d7932b72210c398e734ddbc2d8ea', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        imagemUrl = data.data.url;

        await salvarProduto(nome, preco, imagemUrl, descricao);
      };
      reader.readAsDataURL(imagemFile);
    } else {
      // Se estiver editando e não trocou a imagem
      const produto = produtos.find(p => p.id === editandoProdutoId);
      imagemUrl = produto.imagem;
      await salvarProduto(nome, preco, imagemUrl, descricao);
    }

  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    alert('Erro ao salvar produto.');
  }
});

async function salvarProduto(nome, preco, imagemUrl, descricao, categoria) {
  const produto = {
    nome,
    preco,
    descricao,
    imagem: imagemUrl,
    categoria,
    ativo: true // já cadastra como ativo
  };

  try {
    if (editandoProdutoId) {
      await fetch(`${urlProdutos}/${editandoProdutoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
      });
      editandoProdutoId = null;
      cancelarEdicaoBtn.style.display = 'none';
    } else {
      await fetch(urlProdutos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
      });
    }

    formProduto.reset();
    preview.src = '';
    carregarProdutos();
  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    alert('Erro ao salvar produto');
  }
}


function editarProduto(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  editandoProdutoId = id;
  nomeProdutoInput.value = produto.nome;
  precoProdutoInput.value = produto.preco;
  descricaoProdutoInput.value = produto.descricao || '';
  preview.src = produto.imagem;
  cancelarEdicaoBtn.style.display = 'inline';
}

cancelarEdicaoBtn.addEventListener('click', () => {
  editandoProdutoId = null;
  formProduto.reset();
  preview.src = '';
  cancelarEdicaoBtn.style.display = 'none';
});

async function deletarProduto(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  try {
    await fetch(`${urlProdutos}/${id}`, { method: 'DELETE' });
    carregarProdutos();
  } catch (err) {
    alert('Erro ao excluir produto');
    console.error(err);
  }
}

/* =========================
   PEDIDOS
========================= */
async function carregarProdutos() {
  try {
    const resposta = await fetch('/api/produtos');

    if (!resposta.ok) throw new Error('Erro ao carregar produtos');

    const dados = await resposta.json();

    // Filtra apenas os produtos ativos (caso você use isso)
    produtos = dados.filter(p => p.ativo);

    renderizarProdutos(); // ou mostrarProdutos(produtos), se for sua função
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
  }
}

async function carregarPedidos() {
  try {
    const resposta = await fetch('/api/pedidos');
    if (!resposta.ok) throw new Error('Erro ao carregar pedidos');

    const dados = await resposta.json();
    console.log('Pedidos:', dados); // ou renderizarPedidos(dados)
  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
  }
}

// 2. Depois defina mostrarPainel
function mostrarPainel() {
  document.getElementById('telaLogin').style.display = 'none';
  document.getElementById('painel').style.display = 'block';
  carregarProdutos();
  carregarPedidos();
}

function renderizarPedidos() {
  listaPedidos.innerHTML = '';
  const pedidosAtivos = pedidos.filter(p => p.status !== 'Entregue');

  pedidosAtivos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pedido-card';

    const itensTexto = p.itens.map(i => `${i.nome} x${i.quantidade}`).join(', ');

    card.innerHTML = `
      <div>
        <strong>Pedido #${p.id}</strong><br>
        Cliente: ${p.cliente}<br>
        WhatsApp: <a href="https://wa.me/${p.whatsapp}" target="_blank">${p.whatsapp}</a><br>
        Endereço: ${p.endereco}<br>
        Itens: ${itensTexto}<br>
        Taxa: R$ ${p.taxaEntrega.toFixed(2)}<br>
        Total: <strong>R$ ${p.total.toFixed(2)}</strong><br>
        Status: ${p.status}<br>
        <button onclick="atualizarStatus(${p.id}, 'Em preparo')">Em preparo</button>
        <button onclick="atualizarStatus(${p.id}, 'Saiu para entrega')">Saiu para entrega</button>
        <button onclick='enviarWhatsapp(${JSON.stringify(p).replace(/'/g, "\\'")})'>WhatsApp</button>
        <button onclick="atualizarStatus(${p.id}, 'Entregue')">Finalizar</button>
      </div>
    `;

    listaPedidos.appendChild(card);
  });
}

async function atualizarStatus(id, status) {
  try {
    await fetch(`${urlPedidos}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    carregarPedidos();
  } catch (err) {
    alert('Erro ao atualizar status');
    console.error(err);
  }
}

function enviarWhatsapp(pedido) {
  const itensTexto = pedido.itens.map(i => `• ${i.nome} x${i.quantidade}`).join('\n');
  const totalFormatado = pedido.total.toFixed(2).replace('.', ',');
  const taxaFormatada = pedido.taxaEntrega.toFixed(2).replace('.', ',');

  const mensagem = `
🍞 *Padaria Delivery* 🍞

Olá, ${pedido.cliente}! 😄
Seu pedido está *saindo para entrega* 🚗💨

📦 *Itens do pedido:*
${itensTexto}

📍 Endereço: ${pedido.endereco}
🚚 Taxa de entrega: R$ ${taxaFormatada}

💰 *Total a pagar:* R$ ${totalFormatado}

Agradecemos pela preferência! ❤️
Em breve seu pedido estará com você! 😊
  `.trim();

  const msg = encodeURIComponent(mensagem);
  window.open(`https://wa.me/${pedido.whatsapp}?text=${msg}`, '_blank');
}

/* =========================
   LOGIN E TEMA
========================= */

const senhaCorreta = 'admin123';

function verificarLogin() {
  const senha = document.getElementById('senha').value;
  const mensagem = document.getElementById('mensagemLogin');

  if (senha === senhaCorreta) {
    localStorage.setItem('logado', 'true');
    mostrarPainel();
  } else {
    mensagem.textContent = 'Senha incorreta!';
  }
}

function mostrarPainel() {
  document.getElementById('telaLogin').style.display = 'none';
  document.getElementById('painel').style.display = 'block';
  carregarProdutos();
  carregarPedidos();
}

function alternarTema() {
  document.body.classList.toggle('dark');
}

function logout() {
  localStorage.removeItem('logado');
  location.reload();
}

function renderizarPedidosFinalizados() {
  listaFinalizados.innerHTML = '';
  const pedidosEntregues = pedidos.filter(p => p.status === 'Entregue');

  pedidosEntregues.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pedido-card';

    const itensTexto = p.itens.map(i => `${i.nome} x${i.quantidade}`).join(', ');

    card.innerHTML = `
      <div>
        <strong>Pedido #${p.id}</strong><br>
        Cliente: ${p.cliente}<br>
        WhatsApp: ${p.whatsapp}<br>
        Endereço: ${p.endereco}<br>
        Itens: ${itensTexto}<br>
        Taxa: R$ ${p.taxaEntrega.toFixed(2)}<br>
        Total: <strong>R$ ${p.total.toFixed(2)}</strong><br>
        Status: ${p.status}
      </div>
    `;

    listaFinalizados.appendChild(card);
  });
}
 function alternarTema() {
      document.body.classList.toggle("dark");
    }
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}

    function mostrarSecao(secao) {
      document.querySelectorAll('.secao').forEach(div => div.classList.add('hidden'));
      document.getElementById(`secao-${secao}`).classList.remove('hidden');
    }
    window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('logado') === 'true') {
    mostrarPainel();
  } else {
    mostrarLogin();
  }
});
