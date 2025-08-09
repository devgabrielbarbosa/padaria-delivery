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
const sidebar = document.getElementById('sidebar');
const btnAbrirSidebar = document.getElementById('abrirSidebar');
const btnFecharSidebar = document.getElementById('closeSidebar');
const botoesCategoria = document.querySelectorAll('.categoria-btn');
const containerProdutos = document.getElementById("produtos");
const filtroCategoria = document.getElementById("filtro-categoria");








// --- Import Firebase (v9 modular) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import { getFirestore, collection, addDoc, getDocs, doc, getDoc, onSnapshot,} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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

// --- Inicialização Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const configRef = doc(db, "configuracoes", "loja");

// --- Variáveis globais ---
let produtos = [];
let categorias = [];
let carrinho = [];
let listaCompleta = []; 
let produtoAtual = '';
let quantidadeAtual = 1;
const taxaEntrega = 5.0;
let latitude = '';
let longitude = '';

// --- Funções de Overlay e Mensagens ---
// --- Funções de Overlay e Mensagens ---
function criarOverlay(mensagemHTML, corTexto = "#b30000", tempoFechar = null) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
  `;

  const caixa = document.createElement("div");
  caixa.style.cssText = `
    background: white; padding: 2rem; border-radius: 12px;
    max-width: 400px; text-align: center; color: ${corTexto};
    font-size: 1.1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    position: relative;
  `;
  caixa.innerHTML = mensagemHTML;

  // Botão de fechar
  const btnFechar = document.createElement("button");
  btnFechar.innerHTML = "&times;";
  btnFechar.style.cssText = `
    position: absolute; top: 8px; right: 12px;
    background: none; border: none; font-size: 1.5rem;
    cursor: pointer; color: #666;
  `;
  btnFechar.onclick = () => overlay.remove();

  // Fechar clicando fora da caixa
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Fechar automaticamente se tempo for definido
  if (tempoFechar) {
    setTimeout(() => {
      overlay.remove();
    }, tempoFechar);
  }

  caixa.appendChild(btnFechar);
  overlay.appendChild(caixa);
  document.body.appendChild(overlay);
}


function mostrarMensagemManutencao() {
  criarOverlay(`
    🚧 A loja está em manutenção no momento.<br><br>
    <strong>Logo estaremos online! ❤️</strong>
  `);
}

function mostrarMensagemForaDoHorario(horariosTexto) {
  criarOverlay(`
    💤 A loja está fechada no momento.<br><br>
    Horários de funcionamento:<br>
    <strong>${horariosTexto}</strong><br><br>
    <strong>Obrigado pela compreensão! ❤️</strong>
  `);
}

function mostrarMensagem(msg) {
  criarOverlay(`<strong>${msg}</strong>`, "#008000");
  setTimeout(() => {
    document.querySelectorAll("body > div[style*='z-index: 9999']").forEach(el => el.remove());
  }, 2500);
}

// --- Status da Loja ---
async function verificarStatusOuHorario() {
  try {
    const docSnap = await getDoc(configRef);
    if (!docSnap.exists()) {
      console.warn("⚠️ Configuração da loja não encontrada.");
      return { aberta: false, periodo: null };
    }
    const data = docSnap.data();
    if (!data.status || !Array.isArray(data.periodos)) {
      mostrarMensagemManutencao();
      return { aberta: false, periodo: null };
    }
    const agora = new Date();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const periodoAtual = data.periodos.find(periodo => {
      const [hIni, mIni] = periodo.abertura.split(":").map(Number);
      const [hFim, mFim] = periodo.fechamento.split(":").map(Number);
      const inicioMin = hIni * 60 + mIni;
      const fimMin = hFim * 60 + mFim;
      return minutosAgora >= inicioMin && minutosAgora < fimMin;
    });
    if (!periodoAtual) {
      const horariosTexto = data.periodos.map(p => `${p.abertura} às ${p.fechamento}`).join(", ");
      mostrarMensagemForaDoHorario(horariosTexto);
      return { aberta: false, periodo: null };
    }
    return { aberta: true, periodo: periodoAtual };
  } catch (error) {
    console.error("Erro ao verificar status da loja:", error);
    return { aberta: false, periodo: null };
  }
}

// --- Produtos ---
async function buscarProdutosFirebase() {
  try {
    const produtosQuery = query(
      collection(db, "produtos"),
      where("ativo", "==", true)
    );
    const snapshot = await getDocs(produtosQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}

//
//
///////////////////////////////////////////////////////////////////////////

async function carregarProdutos(categoriaSelecionada = "todos") {
  try {
    const docSnap = await getDoc(configRef);
    if (!docSnap.exists()) {
      produtosContainer.innerHTML = '<p>⚠️ Configurações da loja não encontradas.</p>';
      return;
    }

    const data = docSnap.data();

    if (!data.status) {
      produtosContainer.innerHTML = '<p>💤 Loja fechada no momento.</p>';
      return;
    }

    const agora = new Date();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    let periodoAtual = null;

    for (const periodo of data.periodos) {
      const [hIni, mIni] = periodo.abertura.split(":").map(Number);
      const [hFim, mFim] = periodo.fechamento.split(":").map(Number);
      const minInicio = hIni * 60 + mIni;
      const minFim = hFim * 60 + mFim;

      if (minutosAgora >= minInicio && minutosAgora < minFim) {
        periodoAtual = periodo;
        break;
      }
    }

    if (!periodoAtual) {
      produtosContainer.innerHTML = '<p>⏰ Nenhum produto disponível neste horário.</p>';
      return;
    }

    const produtosRef = collection(db, "produtos");
    const snapshot = await getDocs(produtosRef);

    // Atualiza a lista global completa com todos os produtos
    listaCompleta = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filtra produtos ativos, dentro do período e da categoria (se não for "todos")
  const categoriasPermitidas = periodoAtual.categorias.map(c => c.toLowerCase().trim());

  const produtosPermitidos = listaCompleta.filter(p => {
  const categoriaProduto = (p.categoria ?? "").toLowerCase().trim();
  const categoriaFiltro = (categoriaSelecionada ?? "todos").toLowerCase().trim();

  const ativo = p.ativo === true;
  const periodoOk = categoriasPermitidas.includes(categoriaProduto);
  const categoriaOk = categoriaFiltro === "todos" || categoriaProduto === categoriaFiltro;

  return ativo && periodoOk && categoriaOk;
});


    if (produtosPermitidos.length === 0) {
  // Verifica se existe produto da categoria, mas fora do horário
  const temProdutoForaHorario = listaCompleta.some(p => {
    const categoriaProduto = (p.categoria ?? "").toLowerCase().trim();
    const categoriaFiltro = (categoriaSelecionada ?? "todos").toLowerCase().trim();
    const ativo = p.ativo === true;

    // Produto ativo, categoria bate, mas categoria NÃO está no periodoAtual.categorias
    const foraHorario = ativo && categoriaProduto === categoriaFiltro && !categoriasPermitidas.includes(categoriaProduto);
    return foraHorario;
  });

  if (temProdutoForaHorario) {
    produtosContainer.innerHTML = `
      <p>😔 Ops, os produtos da categoria <strong>${categoriaSelecionada}</strong> ainda não estão disponíveis no horário atual.</p>
      <p>⏰ Eles estarão disponíveis nos seguintes horários:</p>
      <ul>
        ${data.periodos
          .filter(p => p.categorias.map(c => c.toLowerCase().trim()).includes(categoriaSelecionada.toLowerCase().trim()))
          .map(p => `<li><strong>${p.nome}</strong>:${p.abertura} - ${p.fechamento} e de ${p.abertura} - ${p.fechamento}</li>`)
          .join('')}
      </ul>
      <p>Obrigado pela compreensão! ❤️</p>
    `;
  } else {
    produtosContainer.innerHTML = '<p>⚠️ Nenhum produto ativo encontrado para o período atual e categoria selecionada.</p>';
  }
  return;
}

    produtosContainer.innerHTML = ''; // limpar container

    produtosPermitidos.forEach(p => {
      const produtoDiv = document.createElement("div");
      produtoDiv.classList.add("produto");

      produtoDiv.setAttribute("data-id", p.id);
      produtoDiv.setAttribute("data-nome", p.nome);
      produtoDiv.setAttribute("data-descricao", p.descricao || "");
      produtoDiv.setAttribute("data-imagem", p.imagem);
      produtoDiv.setAttribute("data-preco", p.preco);
      produtoDiv.setAttribute("data-categoria", p.categoria || "Outros");
      produtoDiv.setAttribute("data-button", p.detalhe);

      produtoDiv.innerHTML = `
        <img src="${p.imagem}" alt="${p.nome}" />
        <div class="produto-info">
          <div class="produto-nome">${p.nome}</div>
          <div class="produto-preco">R$ ${parseFloat(p.preco).toFixed(2)}</div>
          <div class="produto-descricao">${p.descricao || "Sem descrição"}</div>
          <button class="ver-detalhes-produto">Ver detalhes</button>
        </div>
      `;

      produtoDiv.addEventListener("click", () => {
        mostrarModalDetalhe(p);
      });

      produtosContainer.appendChild(produtoDiv);
    });

    extrairCategorias();
    atualizarMenusCategorias();
    atualizarResumoPedido();

  } catch (error) {
    produtosContainer.innerHTML = '<p>Erro ao carregar produtos.</p>';
    console.error("❌ Erro ao carregar produtos:", error);
  }
}

botoesCategoria.forEach(botao => {
  botao.addEventListener('click', () => {
    const categoria = botao.dataset.categoria;

    if (categoria === "todos") {
      carregarProdutos("todos"); // passar "todos" explicitamente
    } else {
      carregarProdutos(categoria);
    }

    botoesCategoria.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');
  });
});


function extrairCategorias() {
  if (!listaCompleta || listaCompleta.length === 0) {
    categorias = [];
    return;
  }
  categorias = [...new Set(listaCompleta.map(p => (p.categoria || 'Outros').toLowerCase().trim()))];
}
// --- Menus de Categorias ---
function montarMenuCategorias() {
  if (!menuCategorias) return;
  menuCategorias.innerHTML = '';

  // Botão TODOS
  const btnTodos = document.createElement('button');
  btnTodos.textContent = 'Todos';
  btnTodos.classList.add('active');
  btnTodos.onclick = () => {
    marcarCategoria(btnTodos);
    mostrarProdutos(listaCompleta); // usar listaCompleta aqui
  };
  menuCategorias.appendChild(btnTodos);

  // Botões das categorias
  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.onclick = () => {
      marcarCategoria(btn);
      mostrarProdutos(
        listaCompleta.filter(p => 
          (p.categoria || 'outros').toLowerCase().trim() === cat.toLowerCase().trim()
        )
      );
    };
    menuCategorias.appendChild(btn);
  });
}


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
      mostrarProdutos(produtos.filter(p => (p.categoria || 'Todos') === cat));
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
  const botoes = menuCategorias.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('active'));
  botao.classList.add('active');
}

function mostrarProdutos() {
  const produtosRef = collection(db, "produtos");

  onSnapshot(produtosRef, (snapshot) => {
    let produtos = [];

    snapshot.forEach((doc) => {
      const produto = doc.data();
      produto.id = doc.id;
      if (produto.ativo) {
        produtos.push(produto);
      }
    });

    // Pega o botão ativo para saber a categoria
    const botaoAtivo = menuCategorias.querySelector('button.active');
    const categoriaSelecionada = botaoAtivo ? botaoAtivo.textContent.toLowerCase() : "todos";

    if (categoriaSelecionada !== "todos") {
      produtos = produtos.filter(p => (p.categoria || '').toLowerCase() === categoriaSelecionada);
    }

    renderizarProdutos(produtos);
  }, (error) => {
    console.error("❌ Erro ao carregar produtos:", error);
  });
}

// === Renderiza os produtos na página ===
function renderizarProdutos(produtos) {
  const container = document.getElementById("produtosContainer");
  if (!container) {
    console.error("Elemento com id 'produtosContainer' não encontrado!");
    return;
  }

  container.innerHTML = "";

  if (produtos.length === 0) {
    container.innerHTML = "<p>Nenhum produto disponível nesta categoria.</p>";
    return;
  }

  produtos.forEach((produto) => {
    const card = document.createElement("div");
    card.classList.add("produto");

    card.innerHTML = `
      <img src="${produto.imagem || ''}" alt="${produto.nome}">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao || ''}</p>
      <span>R$ ${(Number(produto.preco) || 0).toFixed(2)}</span>
    `;

    container.appendChild(card);
  });
}

// --- Filtro de Categorias Desktop ---
// Função para configurar o filtro das categorias
function configurarFiltroCategorias() {
  const botoesCategoria = document.querySelectorAll('.categoria-btn');
  
  botoesCategoria.forEach(botao => {
    botao.addEventListener('click', () => {
      const categoria = botao.dataset.categoria || 'todos';
      aplicarFiltroCategoria(categoria);  // Sua função que filtra e mostra produtos

      // Atualiza botão ativo visualmente
      botoesCategoria.forEach(b => b.classList.remove('active'));
      botao.classList.add('active');
    });
  });
}

// Inicialização ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  configurarFiltroCategorias();  // Configura os eventos dos botões
  aplicarFiltroCategoria('todos'); // Carrega todos os produtos inicialmente
});


const botoes = document.querySelectorAll('.categoria-btn');
  botoes.forEach(botao => {
  botao.addEventListener('click', () => {
    const categoria = botao.getAttribute('data-categoria');
    carregarProdutos(categoria);

    // Atualiza botão ativo
    botoes.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');
  });
});


// Mostra os produtos do Firebase

botoesCategoria.forEach(botao => {
  botao.addEventListener('click', () => {
    const categoria = botao.dataset.categoria;
    aplicarFiltroCategoria(categoria);

    // Atualiza o botão ativo
    botoesCategoria.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');
  });
});

function aplicarFiltroCategoria(categoria) {
  categoria = (categoria || "todos").toLowerCase();
  const produtosRef = collection(db, "produtos");

  onSnapshot(produtosRef, (snapshot) => {
    let produtos = [];

    snapshot.forEach((doc) => {
      const produto = doc.data();
      produto.id = doc.id;

      if (produto.ativo) {
        produtos.push(produto);
      }
    });

    if (categoria !== "todos") {
      produtos = produtos.filter(p => (p.categoria || '').toLowerCase() === categoria);
    }

    renderizarProdutos(produtos);
  }, (error) => {
    console.error("Erro ao buscar produtos:", error);
    // Você pode mostrar uma mensagem de erro na UI, se quiser
  });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// --- Evento para abrir modal detalhe ao clicar no produto ---
if (produtosContainer) {
  produtosContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.produto');
    if (!card) return;
    const produto = {
      id: card.dataset.id,
      nome: card.dataset.nome,
      descricao: card.dataset.descricao,
      imagem: card.dataset.imagem,
      preco: parseFloat(card.dataset.preco),
      categoria: card.dataset.categoria
    };
    mostrarModal(produto);
  });
}


function mostrarModal(produto) {
  if (!produto) {
    console.warn("Produto inválido ou indefinido.");
    return;
  }
  if (!modalDetalhe) {
    console.error("Elemento modalDetalhe não encontrado no DOM.");
    return;
  }

  modalDetalhe.classList.remove("hidden");
  modalDetalhe.style.display = "block";
}


// --- Modal Detalhe Produto ---
function mostrarModalDetalhe(produto) {
  if (!produto) return;

  // Verifica horário atual
  const agora = new Date();
  const hora = agora.getHours();
  const periodoAtual =
    hora >= 4 && hora < 12 ? "manha" :
    hora >= 12 && hora < 18 ? "tarde" : "noite";

  // Verifica se o produto tem restrição de horário
  if (
    produto.disponibilidade &&
    produto.disponibilidade !== "diaTodo" &&
    produto.disponibilidade !== periodoAtual
  ) {
    // Emoji personalizado conforme categoria
    let emoji = "⏰";
    if (produto.categoria?.toLowerCase().includes("pizza")) emoji = "🍕";
    else if (produto.categoria?.toLowerCase().includes("salgado")) emoji = "🥐";
    else if (produto.categoria?.toLowerCase().includes("refrigerante") || produto.categoria?.toLowerCase().includes("suco")) emoji = "🥤";
    else if (produto.categoria?.toLowerCase().includes("tapioca")) emoji = "🌮";
    else if (produto.categoria?.toLowerCase().includes("hamburguer")) emoji = "🍔";

    // Nome do período com ícones
    const nomePeriodo = {
      manha: "manhã ☀️",
      tarde: "tarde 🌤️",
      noite: "noite 🌙"
    };

    const mensagem = `${emoji} Este item delicioso estará disponível somente à *${nomePeriodo[produto.disponibilidade]}*. Que tal dar uma olhadinha em outras delícias por agora? 🥰`;

    mostrarMensagem(mensagem); // Função que você já usa
    return; // Não abre o modal se não for o horário
  }

  // Produto liberado ✔️
  produtoAtual = { ...produto };
  quantidadeAtual = 1;

  modalImagem.src = produto.imagem;
  modalNome.textContent = produto.nome;
  modalDescricao.textContent = produto.descricao || "Sem descrição.";
  modalPreco.textContent = parseFloat(produto.preco).toFixed(2);
  quantidadeModal.textContent = quantidadeAtual;

  modalDetalhe.classList.remove("hidden");
  modalDetalhe.style.display = "block";
}


function esconderModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
}


// Corrigido: botão de fechar modal
fecharModal.addEventListener("click", () => esconderModal(modalDetalhe)); 


btnAumentar.addEventListener("click", () => {
  quantidadeAtual++;
  quantidadeModal.textContent = quantidadeAtual;
});
btnDiminuir.addEventListener("click", () => {
  if (quantidadeAtual > 1) {
    quantidadeAtual--;
    quantidadeModal.textContent = quantidadeAtual;
  }
});
fecharModal.addEventListener("click", () => {
  modalDetalhe.classList.add("hidden");
});

// --- Adicionar ao carrinho ---
btnAdicionarCarrinho.addEventListener("click", () => {
  if (!produtoAtual) return;
  const existente = carrinho.find(p => p.id === produtoAtual.id);
  if (existente) {
    existente.quantidade += quantidadeAtual;
  } else {
    carrinho.push({ ...produtoAtual, quantidade: quantidadeAtual });
  }
  atualizarResumoPedido();
  atualizarIconeCarrinho();
  modalDetalhe.classList.add("hidden");
  modalCarrinho.classList.remove("hidden");
});

btnCancelarCarrinho.onclick = () => {
  carrinho = [];
  atualizarResumoPedido();
  atualizarIconeCarrinho();
  esconderModal(modalCarrinho);
};
if (abrirCarrinhoBtn) {
  abrirCarrinhoBtn.onclick = () => {
    modalCarrinho.classList.remove("hidden");
    atualizarResumoPedido();
    observacoesCarrinho.value = '';
  };
}
fecharModalCarrinho.addEventListener('click', () => esconderModal(modalCarrinho));
fecharModalPedido.addEventListener('click', () => esconderModal(modalPedido));

// --- Atualiza o resumo do pedido no modal carrinho ---
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

// --- Atualiza o ícone do carrinho com badge ---
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

// --- Finalizar Pedido ---
const observacoesCarrinhoInput = document.getElementById('observacoesCarrinho');

finalizarPedidoBtn.addEventListener('click', () => {
  if (carrinho.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  // Fecha modal do carrinho
  esconderModal(modalCarrinho);

  // Copia observações (só se ambos existirem)
  if (observacoesCarrinhoInput && observacoesPedidoInput) {
    observacoesPedidoInput.value = observacoesCarrinhoInput.value.trim();
  } else {
    console.warn('Textarea de observações não encontrado no DOM.');
  }

  // Abre modal de pedido
  modalPedido.classList.remove('hidden');
  modalPedido.style.display = 'block';
});


////
// --- Aguarda o DOM ficar pronto ---
window.addEventListener('DOMContentLoaded', async () => {
  // === Captura de DOM ===
  const formPedido = document.getElementById('form-pedido');
  const clienteNomeInput = document.getElementById('cliente-nome');
  const clienteTelefoneInput = document.getElementById('cliente-telefone');
  const clienteEnderecoInput = document.getElementById('cliente-endereco');
  const precisaLigarInput = document.getElementById('precisa-ligar');
  const observacoesPedidoInput = document.getElementById('observacoes-pedido');
  const finalizarPedidoBtn = document.getElementById('finalizarPedidoBtn'); // se ainda usar
  const modalPedido = document.getElementById('modalPedido');
  const fecharModalPedido = document.getElementById('fecharModalPedido');
  const urlImagemGerada = "https://i.ibb.co/RT2MX9NQ/f96eb7cad5c5.jpg";


  // === Validação de existência ===
  if (!formPedido ||
      !clienteNomeInput ||
      !clienteTelefoneInput ||
      !clienteEnderecoInput ||
      !precisaLigarInput ||
      !observacoesPedidoInput) {
    console.error('Campos do formulário não encontrados — verifique os IDs.');
    return;
  }

  // Listener para abrir o modal do pedido (botão "Finalizar Pedido")
  finalizarPedidoBtn?.addEventListener('click', () => {
    if (!carrinho.length) {
      alert('Seu carrinho está vazio!');
      return;
    }
    // passa as observações do carrinho para dentro do formulário
    observacoesPedidoInput.value = observacoesCarrinho.value.trim();
    modalPedido.classList.remove('hidden');
    modalPedido.style.display = 'block';
  });

  // Botão de fechar o modal
  fecharModalPedido?.addEventListener('click', () => {
    modalPedido.classList.add('hidden');
    modalPedido.style.display = 'none';
  });

  // === Submit do formulário ===
formPedido.onsubmit = async (e) => {
  e.preventDefault();

  // Captura e validação
  const nome  = clienteNomeInput.value.trim();
  const fone  = clienteTelefoneInput.value.trim();
  const end   = clienteEnderecoInput.value.trim();
  const liga  = precisaLigarInput.checked;
  const obs   = observacoesPedidoInput.value.trim();

  if (!nome || !fone || !end) {
    alert('Preencha nome, telefone e endereço.');
    return;
  }
  if (!carrinho.length) {
    alert('Carrinho vazio.');
    return;
  }

  // Atualiza visual do resumo antes da captura
  atualizarResumoPedido();

  try {
    // Aguarda o DOM renderizar visual do resumo
    await new Promise(resolve => setTimeout(resolve, 100));

    // Gera imagem do resumo
    const imagemUrl = await gerarImagemResumoPedido();

    // Monta objeto do pedido com a imagem
    const pedido = {
      cliente:      nome,
      whatsapp:     fone,
      endereco:     end,
      precisaLigar: liga,
      observacoes:  obs,
      itens:        carrinho.map(i => ({ nome: i.nome, preco: i.preco, quantidade: i.quantidade })),
      taxaEntrega,
      status:       'Pendente',
      total:        carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0) + taxaEntrega,
      id:           Date.now(),
      criadoEm:     new Date().toISOString(),
      latitude,
      longitude,
      imagemUrl
    };

    // Monta a mensagem para o WhatsApp
    const maps  = encodeURIComponent(pedido.endereco);
    const texto = [
      `📦 *Pedido Nº ${pedido.id}*`,
      ``,
      `👤 *Cliente:* ${pedido.cliente}`,
      `📞 *Telefone:* ${pedido.whatsapp}`,
      `🏠 *Endereço:* ${pedido.endereco}`,
      `📍 *Mapa:* https://www.google.com/maps/search/?api=1&query=${maps}`,
      ``,
      `🛒 *Itens:*`,
      ...pedido.itens.map(i => `- ${i.quantidade} x ${i.nome} (R$ ${i.preco.toFixed(2)})`),
      ``,
      `🚚 *Taxa:* R$ ${pedido.taxaEntrega.toFixed(2)}`,
      `💵 *Total:* R$ ${pedido.total.toFixed(2)}`,
      `📝 *Obs:* ${pedido.observacoes || 'Nenhuma'}`,
      `🖼️ *Imagem do pedido:* ${imagemUrl}`
    ].join('\n');

    // Envia pro WhatsApp
    window.open(`https://wa.me/5563991300213?text=${encodeURIComponent(texto)}`, '_blank');

    // Envia para o Firestore
    await enviarPedidoFirestore(pedido);

    // Limpa interface DEPOIS de enviar tudo
    modalPedido.classList.add('hidden');
    modalPedido.style.display = 'none';
    carrinho = [];
    atualizarResumoPedido();
    atualizarIconeCarrinho();
    formPedido.reset();
    mostrarMensagem('Pedido enviado com sucesso!');

  } catch (err) {
    console.error("Erro ao gerar imagem ou enviar pedido:", err);
    alert("Erro ao gerar imagem ou enviar pedido.");
  }
};


  // === Resto da inicialização (produtos, categorias, status…) ===
  await carregarProdutos();
  atualizarIconeCarrinho();
  configurarFiltroCategorias();
  const status = await verificarStatusOuHorario();
  if (!status.aberta) return;
});


// Função para calcular total do carrinho
function calcularTotalCarrinho() {
  return carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
}

// Função para enviar pedido para Firestore
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

// Função para gerar imagem do resumo do pedido (html2canvas + ImgBB)
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
    await new Promise(resolve => setTimeout(resolve, 1000)); // espera para renderizar
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
    if (!result.success) throw new Error("Erro ao enviar imagem: " + result.error?.message);
    return result.data.url;
  } catch (error) {
    console.error("Erro ao gerar imagem do pedido:", error);
    throw error;
  }
}


// Evento de fechamento do modal do pedido
fecharModalPedido.addEventListener('click', () => {
  esconderModal(modalPedido);
});


// --- Inicialização ---

window.addEventListener('DOMContentLoaded', async () => {
  await carregarProdutos();
  atualizarIconeCarrinho();
  configurarFiltroCategorias();

  const status = await verificarStatusOuHorario();
  if (!status.aberta) return;

  if (abrirCarrinhoBtn) {
    abrirCarrinhoBtn.onclick = () => {
      modalCarrinho.classList.remove("hidden");
      modalCarrinho.style.display = "block";
      atualizarResumoPedido();
      observacoesCarrinho.value = '';
    };
  }
});

// --- Esconder modal clicando fora ---
window.addEventListener('click', (e) => {
  if (e.target === modalCarrinho) {
    esconderModal(modalCarrinho);
  }
});

// --- Controle do sidebar ---
btnAbrirSidebar.addEventListener('click', () => {
  sidebar.classList.add('active');
});
btnFecharSidebar.addEventListener('click', () => {
  sidebar.classList.remove('active');
});
// === Espera o DOM carregar antes de executar qualquer coisa ===
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa o filtro de categorias (botões)
  configurarFiltroCategorias();

  // Carrega todos os produtos ao iniciar
  carregarProdutos('todos');
});
