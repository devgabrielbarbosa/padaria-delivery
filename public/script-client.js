// --- Variáveis DOM ---
const menuCategorias = document.getElementById('menuCategorias');
const categoriasList = document.getElementById('categoriasList');

const buscaInput = document.getElementById('busca');
const produtosContainer = document.getElementById('produtosContainer');

const itensCarrinhoDiv = document.getElementById('itensCarrinho');
const taxaEntregaSpan = document.getElementById('taxaEntrega');
const totalPedidoSpan = document.getElementById('totalPedido');
const observacoesCarrinho = document.getElementById('observacoesCarrinho');
const finalizarPedidoBtn = document.getElementById('finalizarPedidoBtn');
const btnCancelarCarrinho = document.getElementById('btnCancelarCarrinho');

const modalDetalhe = document.getElementById('modalDetalhe');
const fecharModal = document.getElementById('fecharModal');
const modalImagem = document.getElementById('modalImagem');
const modalNome = document.getElementById('modalNome');
const modalDescricao = document.getElementById('modalDescricao');
const modalPreco = document.getElementById('modalPreco');
const btnDiminuir = document.getElementById('btnDiminuir');
const btnAumentar = document.getElementById('btnAumentar');
const quantidadeModal = document.getElementById('quantidadeModal');
const btnAdicionarCarrinho = document.getElementById('btnAdicionarCarrinho');

const modalPedido = document.getElementById('modalPedido');
const fecharModalPedido = document.getElementById('fecharModalPedido');

const formPedido = document.getElementById('formPedido');
const clienteNomeInput = document.getElementById('clienteNome');
const clienteTelefoneInput = document.getElementById('clienteTelefone');
const clienteEnderecoInput = document.getElementById('clienteEndereco');
const precisaLigarInput = document.getElementById('precisaLigar');
const observacoesPedidoInput = document.getElementById('observacoesPedido');

const abrirCarrinhoBtn = document.getElementById('abrirCarrinho');
const fecharModalCarrinho = document.getElementById('fecharModalCarrinho');
const modalCarrinho = document.getElementById('modalCarrinho');

const mensagemStatus = document.getElementById('mensagemStatus');

let produtos = [];
let categorias = [];
let carrinho = [];
let produtoSelecionado = null;
let quantidadeSelecionada = 1;
const taxaEntrega = 5.0;

let mapa;
let marcador;
let latitude = null;
let longitude = null;

// -----------------------
// Funções para mostrar e esconder modais
function mostrarModal(modal) {
  modal.classList.add('active');
}

function esconderModal(modal) {
  modal.classList.remove('active');
}

// -----------------------
// Inicialização do mapa para localização
function initMapa() {
  mapa = L.map('mapa').setView([-10.0, -48.0], 5); // Centraliza no Brasil
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapa);

  mapa.on('click', function(e) {
    latitude = e.latlng.lat;
    longitude = e.latlng.lng;

    if (marcador) {
      marcador.setLatLng(e.latlng);
    } else {
      marcador = L.marker(e.latlng).addTo(mapa);
    }
  });
}

// Botão para abrir mapa no modal
document.getElementById('abrirMapaBtn').addEventListener('click', () => {
  document.getElementById('mapa').style.display = 'block';
  if (!mapa) initMapa();
});

// -----------------------
// Função para mostrar mensagens rápidas
function mostrarMensagem(texto, tipo = 'success') {
  mensagemStatus.textContent = texto;
  mensagemStatus.style.backgroundColor = tipo === 'success' ? '#4caf50' : '#f44336';
  mensagemStatus.style.display = 'block';
  setTimeout(() => (mensagemStatus.style.display = 'none'), 3000);
}

// -----------------------
async function carregarProdutos() {
  try {
    // 1) Chama a API
    const res = await fetch('/api/produtos');
    if (!res.ok) throw new Error(`Erro ao carregar produtos: ${res.status} ${res.statusText}`);

    // 2) Converte em JSON
    const lista = await res.json();

    // 3) Filtra só os ativos
    produtos = lista.filter(p => p.ativo);

    // 4) Inicializa UI
    extrairCategorias();
    mostrarProdutos(produtos);
    atualizarMenusCategorias();
    atualizarResumoPedido();

  } catch (err) {
    // Em caso de erro exibe mensagem na tela
    produtosContainer.innerHTML = '<p>Erro ao carregar produtos.</p>';
    console.error(err);
  }
}

// -----------------------
// Extrair categorias únicas dos produtos
function extrairCategorias() {
  categorias = [...new Set(produtos.map(p => p.categoria || 'Outros'))];
}

// -----------------------
// Montar menu categorias (desktop)
function montarMenuCategorias() {
  if (!menuCategorias) return;
  menuCategorias.innerHTML = '';

  const btnTodos = document.createElement('button');
  btnTodos.textContent = 'Todos';
  btnTodos.classList.add('active');
  btnTodos.onclick = () => {
    marcarCategoria(btnTodos);
    mostrarProdutos(produtos);
  };
  menuCategorias.appendChild(btnTodos);

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.onclick = () => {
      marcarCategoria(btn);
      mostrarProdutos(produtos.filter(p => (p.categoria || 'Outros') === cat));
    };
    menuCategorias.appendChild(btn);
  });
}

// -----------------------
// Montar menu categorias (mobile)
function montarMenuCategoriasMobile() {
  if (!categoriasList) return;
  categoriasList.innerHTML = '';

  const btnTodos = document.createElement('button');
  btnTodos.textContent = 'Todos';
  btnTodos.classList.add('active');
  btnTodos.onclick = () => {
    marcarCategoria(btnTodos);
    mostrarProdutos(produtos);
    if (window.innerWidth <= 768) categoriasList.classList.remove('show');
  };
  categoriasList.appendChild(btnTodos);

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.onclick = () => {
      marcarCategoria(btn);
      mostrarProdutos(produtos.filter(p => (p.categoria || 'Outros') === cat));
      if (window.innerWidth <= 768) categoriasList.classList.remove('show');
    };
    categoriasList.appendChild(btn);
  });
}

document.querySelectorAll('.categoria-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const categoria = btn.dataset.categoria;
    filtrarPorCategoria(categoria);
  });
});

function filtrarPorCategoria(categoria) {
  if (categoria === 'todos') {
    mostrarProdutos(produtos);
  } else {
    const filtrados = produtos.filter(p =>
  p.categoria?.toLowerCase() === categoria.toLowerCase() && p.ativo
);
    mostrarProdutos(filtrados);
  }
}


// -----------------------
// Atualizar ambos menus após carregar categorias
function atualizarMenusCategorias() {
  montarMenuCategorias();
  montarMenuCategoriasMobile();
}

// -----------------------
// Marca categoria ativa visualmente
function marcarCategoria(botao) {
  if (menuCategorias) {
    menuCategorias.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  }
  if (categoriasList) {
    categoriasList.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  }
  botao.classList.add('active');
}

// -----------------------
// Mostrar produtos na tela
function mostrarProdutos(lista) {
  if (!produtosContainer) return;
  if (lista.length === 0) {
    produtosContainer.innerHTML = '<p>Nenhum produto encontrado.</p>';
    return;
  }
  produtosContainer.innerHTML = lista.map(p => `
    <div class="produto"
         data-id="${p.id}"
         data-nome="${p.nome}"
         data-descricao="${p.descricao || ''}"
         data-imagem="${p.imagem}"
         data-preco="${p.preco}"
         data-categoria="${p.categoria || 'Outros'}"
    >
      <img src="${p.imagem}" alt="${p.nome}" />
      <div class="produto-info">
        <div class="produto-nome">${p.nome}</div>
        <div class="produto-preco">R$ ${parseFloat(p.preco).toFixed(2)}</div>
        <div class="produto-descricao">${p.descricao || 'Sem descrição'}</div>
      </div>
    </div>
  `).join('');

  // Adicionar evento de clique para abrir modal de detalhe
  const cards = produtosContainer.querySelectorAll('.produto');
  cards.forEach(card => {
    card.onclick = () => abrirModalDetalhe(card);
  });
}

// -----------------------
// Abrir modal detalhe produto
function abrirModalDetalhe(card) {
  const nome = card.dataset.nome;
  const descricao = card.dataset.descricao;
  const imagem = card.dataset.imagem;
  const preco = parseFloat(card.dataset.preco);

  modalNome.textContent = nome;
  modalDescricao.textContent = descricao;
  modalImagem.src = imagem;
  modalPreco.textContent = preco.toFixed(2);
  quantidadeModal.textContent = '1';

  produtoSelecionado = {
    id: card.dataset.id || Math.floor(Math.random() * 1000000),
    nome,
    descricao,
    imagem,
    preco
  };
  quantidadeSelecionada = 1;

  mostrarModal(modalDetalhe);
}

// Fechar modal detalhe
fecharModal.addEventListener('click', () => {
  esconderModal(modalDetalhe);
});

// -----------------------
// Controles quantidade modal detalhe
btnDiminuir.onclick = () => {
  if (quantidadeSelecionada > 1) {
    quantidadeSelecionada--;
    quantidadeModal.textContent = quantidadeSelecionada;
  }
};
btnAumentar.onclick = () => {
  quantidadeSelecionada++;
  quantidadeModal.textContent = quantidadeSelecionada;
};

// -----------------------
// Botão adicionar ao carrinho no modal detalhe
btnAdicionarCarrinho.addEventListener('click', () => {
  if (!produtoSelecionado) return;

  // Verifica se produto já está no carrinho
  const itemExistente = carrinho.find(p => p.id === produtoSelecionado.id);
  if (itemExistente) {
    itemExistente.quantidade += quantidadeSelecionada;
  } else {
    carrinho.push({ ...produtoSelecionado, quantidade: quantidadeSelecionada });
  }

  atualizarResumoPedido();
  atualizarIconeCarrinho();

  esconderModal(modalDetalhe);
  mostrarModal(modalCarrinho);
});

// -----------------------
// Atualizar resumo pedido modal carrinho
function atualizarResumoPedido() {
  itensCarrinhoDiv.innerHTML = '';

  if (carrinho.length === 0) {
    itensCarrinhoDiv.innerHTML = '<p>Carrinho vazio.</p>';
    finalizarPedidoBtn.disabled = true;
    taxaEntregaSpan.textContent = taxaEntrega.toFixed(2);
    totalPedidoSpan.textContent = '0.00';
    atualizarIconeCarrinho();
    return;
  }

  let subtotal = 0;
  carrinho.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.nome} x${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}`;
    itensCarrinhoDiv.appendChild(div);
    subtotal += item.preco * item.quantidade;
  });

  taxaEntregaSpan.textContent = taxaEntrega.toFixed(2);
  totalPedidoSpan.textContent = (subtotal + taxaEntrega).toFixed(2);
  finalizarPedidoBtn.disabled = false;
  atualizarIconeCarrinho();
}

// -----------------------
// Atualizar ícone do carrinho no header
function atualizarIconeCarrinho() {
  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const btn = document.getElementById('abrirCarrinho');
  let badge = btn.querySelector('.badge');

  if (!badge) {
    badge = document.createElement('span');
    badge.classList.add('badge');
    btn.appendChild(badge);
  }

  badge.textContent = totalItens;

  if (totalItens === 0) {
    badge.style.display = 'none';
  } else {
    badge.style.display = 'flex';
  }
}


// -----------------------
// Abrir modal carrinho ao clicar no botão
abrirCarrinhoBtn.onclick = () => {
  mostrarModal(modalCarrinho);
  atualizarResumoPedido();
  observacoesCarrinho.value = '';
};

// -----------------------
// Fechar modais
fecharModalCarrinho.addEventListener('click', () => {
  esconderModal(modalCarrinho);
});
fecharModalPedido.addEventListener('click', () => {
  esconderModal(modalPedido);
});

// -----------------------
// Cancelar pedido, limpar carrinho e fechar modal
btnCancelarCarrinho.onclick = () => {
  carrinho = [];
  atualizarResumoPedido();
  atualizarIconeCarrinho();
  esconderModal(modalCarrinho);
};

// -----------------------
// Botão finalizar pedido no modal carrinho abre modal pedido
finalizarPedidoBtn.onclick = () => {
  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
  esconderModal(modalCarrinho);
  mostrarModal(modalPedido);

  // Passa observações para modal pedido
  observacoesPedidoInput.value = observacoesCarrinho.value.trim();
};

// -----------------------
// Envio do formulário do pedido
formPedido.onsubmit = async e => {
  e.preventDefault();

  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }
const pedido = {
  id: Math.floor(Math.random() * 1000000),
  cliente: clienteNomeInput.value.trim(),
  whatsapp: clienteTelefoneInput.value.trim(), // ✅ alterado
  endereco: clienteEnderecoInput.value.trim(),
  latitude,
  longitude,
  linkGoogleMaps: latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '',
  precisaLigar: precisaLigarInput.checked,
  observacoes: observacoesPedidoInput.value.trim(),
  itens: carrinho,
  taxaEntrega,
  total: carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0) + taxaEntrega,
  status: 'Pendente'
};

  if (!pedido.cliente || !pedido.endereco) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  try {
    await fetch('http://localhost:3000/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    });

    enviarParaWhatsApp(pedido);

    esconderModal(modalPedido);
    carrinho = [];
    atualizarResumoPedido();
    atualizarIconeCarrinho();
    formPedido.reset();
    mostrarMensagem('Pedido enviado com sucesso!');
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar pedido.');
  }
};

// -----------------------
// Enviar pedido para WhatsApp
function enviarParaWhatsApp(pedido) {
  const numeroPedido = pedido.id || Math.floor(Math.random() * 1000000);
  const enderecoEncoded = encodeURIComponent(pedido.endereco);
  const linkMaps = `https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`;

  const mensagem = [
    `📦 *Novo Pedido Nº: ${numeroPedido}*`,
    ``,
    `👤 *Cliente:* ${pedido.cliente}`,
    `📞 *Telefone:* ${pedido.telefone}`,
    `🏠 *Endereço:* ${pedido.endereco}`,
    `📍 *Ver no mapa:* ${linkMaps}`,
    ``,
    `🛒 *Itens do pedido:*`,
    ...pedido.itens.map(i => `- ${i.quantidade} x ${i.nome} (R$ ${i.preco.toFixed(2)})`),
    ``,
    `🚚 *Taxa de entrega:* R$ ${pedido.taxaEntrega.toFixed(2)}`,
    `💵 *Total:* R$ ${pedido.total.toFixed(2)}`,
    `📝 *Observações:* ${pedido.observacoes || 'Nenhuma'}`
  ].join('\n');

  const numeroWhats = '5563991300213';
  const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, '_blank');
}

// -----------------------
// Eventos para menu mobile toggle e sidebar
document.addEventListener('DOMContentLoaded', () => {
  const btnToggleMenu = document.getElementById('btnToggleMenu');
  if (btnToggleMenu && categoriasList) {
    btnToggleMenu.addEventListener('click', () => {
      categoriasList.classList.toggle('show');
    });
  }

  const abrirSidebar = document.getElementById('abrirSidebar');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const closeSidebar = document.getElementById('closeSidebar');

  if (abrirSidebar && sidebar && overlay && closeSidebar) {
    abrirSidebar.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
});

// -----------------------
// Inicializar sistema após carregar DOM
window.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  atualizarIconeCarrinho();
});

// -----------------------
// Fechar modal carrinho ao clicar fora dele
window.addEventListener('click', (e) => {
  if (e.target === modalCarrinho) {
    esconderModal(modalCarrinho);
  }
});

