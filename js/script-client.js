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

  // --- Import Firebase (v9 modular) ---
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
  import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

  // --- Config Firebase ---
  const firebaseConfig = {
    apiKey: "AIzaSyAyY14CV-ODcWMSD4tdGkGzh0HlZr_8KvY",
    authDomain: "lanchonete-lj.firebaseapp.com",
    projectId: "lanchonete-lj",
    storageBucket: "lanchonete-lj.firebasestorage.app",
    messagingSenderId: "939172982803",
    appId: "1:939172982803:web:9695ada6d98d4fed858fe6"
  };

  // Inicializa Firebase App
  const app = initializeApp(firebaseConfig);

  // Inicializa Firestore e Auth
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Variáveis globais
  let produtos = [];
  let categorias = [];
  let carrinho = [];
  let produtoSelecionado = null;
  let quantidadeSelecionada = 1;
  const taxaEntrega = 5.0;

  let latitude = null;
  let longitude = null;

  // --- Funções modais ---
  function mostrarModal(modal) { modal.classList.add('active'); }
  function esconderModal(modal) { modal.classList.remove('active'); }

  // --- Mensagem temporária ---
  function mostrarMensagem(texto, tipo = 'success') {
    mensagemStatus.textContent = texto;
    mensagemStatus.style.backgroundColor = tipo === 'success' ? '#4caf50' : '#f44336';
    mensagemStatus.style.display = 'block';
    setTimeout(() => (mensagemStatus.style.display = 'none'), 3000);
  }

  // --- Carregar produtos do Firestore ---
  async function carregarProdutos() {
    try {
      const produtosRef = collection(db, "produtos");
      const snapshot = await getDocs(produtosRef);
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      produtos = lista.filter(p => p.ativo);

      extrairCategorias();
      mostrarProdutos(produtos);
      atualizarMenusCategorias();
      atualizarResumoPedido();
    } catch (err) {
      produtosContainer.innerHTML = '<p>Erro ao carregar produtos.</p>';
      console.error('Erro ao carregar produtos:', err);
    }
  }

  function extrairCategorias() {
    categorias = [...new Set(produtos.map(p => p.categoria || 'Outros'))];
  }

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


function configurarFiltroCategorias() {
  const botoesCategorias = document.querySelectorAll(".categoria-btn");

  botoesCategorias.forEach(botao => {
    botao.addEventListener("click", () => {
      console.log('Botão clicado:', botao.textContent.trim());  // loga o clique

      const categoria = botao.textContent.trim();

      if (categoria === "Todos") {
        mostrarProdutos(produtos);
      } else {
        const filtrados = produtos.filter(p => (p.categoria || 'Outros') === categoria);
        mostrarProdutos(filtrados);
      }

      botoesCategorias.forEach(b => b.classList.remove('active'));
      botao.classList.add('active');
    });
  });
}
configurarFiltroCategorias();


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

  function atualizarMenusCategorias() {
    montarMenuCategorias();
    montarMenuCategoriasMobile();
  }

  function marcarCategoria(botao) {
    if (menuCategorias) {
      menuCategorias.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    }
    if (categoriasList) {
      categoriasList.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    }
    botao.classList.add('active');
  }

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

    const cards = produtosContainer.querySelectorAll('.produto');
    cards.forEach(card => {
      card.onclick = () => abrirModalDetalhe(card);
    });
  }

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

  fecharModal.addEventListener('click', () => esconderModal(modalDetalhe));

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

  btnAdicionarCarrinho.addEventListener('click', () => {
    if (!produtoSelecionado) return;

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
    badge.style.display = totalItens === 0 ? 'none' : 'flex';
  }

  abrirCarrinhoBtn.onclick = () => {
    mostrarModal(modalCarrinho);
    atualizarResumoPedido();
    observacoesCarrinho.value = '';
  };

  fecharModalCarrinho.addEventListener('click', () => esconderModal(modalCarrinho));
  fecharModalPedido.addEventListener('click', () => esconderModal(modalPedido));

  btnCancelarCarrinho.onclick = () => {
    carrinho = [];
    atualizarResumoPedido();
    atualizarIconeCarrinho();
    esconderModal(modalCarrinho);
  };

  // --- Montar objeto pedido para envio ---
  function montarObjetoPedido() {
    const cliente = clienteNomeInput.value.trim() || 'Cliente não informado';
    const whatsapp = clienteTelefoneInput.value.trim() || 'Telefone não informado';
    const endereco = clienteEnderecoInput.value.trim() || 'Endereço não informado';
    const observacoes = observacoesCarrinho.value.trim();

    const itens = carrinho.map(item => ({
      nome: item.nome,
      quantidade: item.quantidade,
      preco: item.preco
    }));

    const taxa = parseFloat(taxaEntregaSpan.textContent) || 0;
    const total = parseFloat(totalPedidoSpan.textContent) || 0;

    return {
      cliente,
      whatsapp,
      endereco,
      observacoes,
      itens,
      taxaEntrega: taxa,
      total,
      id: Math.floor(Math.random() * 1000000) // Número aleatório para pedido
    };
  }

  // --- Gerar imagem do modal resumo do pedido ---

  // --- Finalizar pedido: gerar imagem e enviar ---
  async function finalizarPedido(pedido) {
    try {
      const imagemUrl = await gerarImagemResumoPedido();
      enviarParaWhatsApp(pedido, imagemUrl);
    } catch (error) {
      alert("Erro ao gerar o print do pedido!");
      console.error(error);
    }
  }
finalizarPedidoBtn.addEventListener('click', () => {
  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  // 👉 SOMENTE ABRE O MODAL DE DADOS!
  esconderModal(modalCarrinho);
  mostrarModal(modalPedido);

  // Copia as observações do modal carrinho para o de pedido
  observacoesPedidoInput.value = observacoesCarrinho.value.trim();
});

// --- Evento submit do formulário de pedido (modal de dados) ---
formPedido.onsubmit = async (e) => {
  e.preventDefault();

  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  const pedido = {
    cliente: clienteNomeInput.value.trim(),
    whatsapp: clienteTelefoneInput.value.trim(),
    endereco: clienteEnderecoInput.value.trim(),
    latitude,
    longitude,
    linkGoogleMaps: latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '',
    precisaLigar: precisaLigarInput.checked,
    observacoes: observacoesPedidoInput.value.trim(),
    itens: carrinho,
    taxaEntrega,
    total: carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0) + taxaEntrega,
    status: 'Pendente',
    criadoEm: new Date(),
    id: Math.floor(Math.random() * 1000000)
  };

  if (!pedido.cliente || !pedido.endereco || !pedido.whatsapp) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  try {
    const imagemUrl = await gerarImagemResumoPedido();
    await enviarPedidoFirestore(pedido);
    enviarParaWhatsApp(pedido, imagemUrl);

    esconderModal(modalPedido);
    carrinho = [];
    atualizarResumoPedido();
    atualizarIconeCarrinho();
    formPedido.reset();
    mostrarMensagem('Pedido enviado com sucesso!');
  } catch (err) {
    console.error('Erro ao finalizar o pedido:', err);
    alert('Erro ao enviar o pedido. Tente novamente.');
  }
};
async function enviarPedidoFirestore(pedido) {
  try {
    const pedidosRef = collection(db, "pedidos");
    await addDoc(pedidosRef, pedido);
    console.log("Pedido enviado com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
    throw error;
  }
}
// --- Gerar imagem do modal resumo do pedido ---
async function gerarImagemResumoPedido() {
  try {
    const modalContainer = document.getElementById("modalCarrinho");
    const modalContent = modalContainer?.querySelector(".modal-content");

    if (!modalContainer || !modalContent) throw new Error("Modal não encontrada");

    const estavaEscondido = modalContainer.classList.contains("hidden");
    if (estavaEscondido) {
      modalContainer.classList.remove("hidden");
      modalContainer.style.display = "block";
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(modalContent, {
      backgroundColor: '#fff',
      scale: 1,
      useCORS: true
    });

    if (estavaEscondido) {
      modalContainer.classList.add("hidden");
      modalContainer.style.display = "none";
    }

    const base64Full = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = base64Full.split(",")[1];
    if (!base64) throw new Error("Imagem base64 vazia");

    const formData = new FormData();
    formData.append("key", "5633d7932b72210c398e734ddbc2d8ea");
    formData.append("image", base64);

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error("Erro ao enviar imagem: " + result.error?.message);
    }

    return result.data.url;
  } catch (error) {
    console.error("Erro ao gerar imagem do pedido:", error);
    throw error;
  }
}

// --- Enviar para WhatsApp ---
function enviarParaWhatsApp(pedido, imagemUrl) {
  const numeroPedido = pedido.id || Math.floor(Math.random() * 1000000);
  const enderecoEncoded = encodeURIComponent(pedido.endereco);
  const linkMaps = `https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`;

  const mensagem = [
    `\uD83D\uDCE6 *Novo Pedido N\u00BA: ${numeroPedido}*`,
    ``,
    `\uD83D\uDC64 *Cliente:* ${pedido.cliente}`,
    `\uD83D\uDCDE *Telefone:* ${pedido.whatsapp}`,
    `\uD83C\uDFE0 *Endere\u00E7o:* ${pedido.endereco}`,
    `\uD83D\uDCCD *Ver no mapa:* ${linkMaps}`,
    ``,
    `\uD83D\uDED2 *Itens do pedido:*`,
    ...pedido.itens.map(i => `- ${i.quantidade} x ${i.nome} (R$ ${i.preco.toFixed(2)})`),
    ``,
    `\uD83D\uDE9A *Taxa de entrega:* R$ ${pedido.taxaEntrega.toFixed(2)}`,
    `\uD83D\uDCB5 *Total:* R$ ${pedido.total.toFixed(2)}`,
    `\uD83D\uDCDD *Observa\u00E7\u00F5es:* ${pedido.observacoes || 'Nenhuma'}`,
    ``,
    `\uD83D\uDDBC️ *Imagem do pedido:* ${imagemUrl || 'N\u00E3o dispon\u00EDvel'}`
  ].join('\n');

  const numeroWhats = '5563991300213';
  const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}


  // --- Inicialização ---
  window.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    atualizarIconeCarrinho();
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalCarrinho) {
      esconderModal(modalCarrinho);
    }
  });

  // --- Evento botão finalizar pedido no modal carrinho ---
  finalizarPedidoBtn.addEventListener('click', async () => {
    if (carrinho.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }
    // Preencher os inputs de nome, telefone e endereço caso ainda não tenham sido preenchidos
    clienteNomeInput.value = clienteNomeInput.value.trim() || '';
    clienteTelefoneInput.value = clienteTelefoneInput.value.trim() || '';
    clienteEnderecoInput.value = clienteEnderecoInput.value.trim() || '';

    // Monta o objeto do pedido com os dados atuais
    const pedido = montarObjetoPedido();

    try {
      esconderModal(modalCarrinho);
      mostrarModal(modalPedido);

      // Copia observações para o modal pedido
      observacoesPedidoInput.value = observacoesCarrinho.value.trim();
    } catch (error) {
      alert('Erro ao finalizar o pedido, tente novamente.');
      console.error(error);
    }
  });
const sidebar = document.getElementById('sidebar');  // seu menu lateral
const btnAbrirSidebar = document.getElementById('abrirSidebar');  // botão ☰
const btnFecharSidebar = document.getElementById('closeSidebar'); // botão ×

btnAbrirSidebar.addEventListener('click', () => {
  sidebar.classList.add('active'); // abre o sidebar
});

btnFecharSidebar.addEventListener('click', () => {
  sidebar.classList.remove('active'); // fecha o sidebar
});
