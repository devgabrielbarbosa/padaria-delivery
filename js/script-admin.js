// ===============================
// IMPORTS FIREBASE (modular)
// ===============================
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// ===============================
// CONFIGURAÇÃO FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyAyY14CV-ODcWMSD4tdGkGzh0HlZr_8KvY",
  authDomain: "lanchonete-lj.firebaseapp.com",
  projectId: "lanchonete-lj",
  storageBucket: "lanchonete-lj.firebasestorage.app",
  messagingSenderId: "939172982803",
  appId: "1:939172982803:web:9695ada6d98d4fed858fe6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ===============================
// ELEMENTOS DOM
// ===============================
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
const buscaProdutoInput = document.getElementById('buscaProduto');

let produtos = [];
let pedidos = [];
let editandoProdutoId = null;

buscaProdutoInput?.addEventListener('input', renderizarProdutos);

// ===============================
// PRODUTOS
// ===============================
async function carregarProdutos() {
  try {
    const produtosRef = collection(db, "produtos");
    // Busca todos os produtos, sem filtro
    const snapshot = await getDocs(produtosRef);
    produtos = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderizarProdutos();
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}


function renderizarProdutos() {
  const termo = buscaProdutoInput?.value.toLowerCase() || '';
  listaProdutos.innerHTML = '';

  produtos
    .filter(p => p.nome.toLowerCase().includes(termo) || (p.categoria || '').toLowerCase().includes(termo))
    .forEach(p => {
      const card = document.createElement('div');
      card.className = 'produto-card';
      const statusBtn = p.ativo
        ? `<button class="danger" onclick="alterarStatusProduto('${p.id}', false)">Desativar</button>`
        : `<button class="success" onclick="alterarStatusProduto('${p.id}', true)">Ativar</button>`;

      card.innerHTML = `
        <img src="${p.imagem}" alt="${p.nome}" class="produto-img" />
        <div>
          <strong>${p.nome}</strong><br>
          <small>${p.descricao || ''}</small><br>
          <span><strong>Categoria:</strong> ${p.categoria || 'N/A'}</span><br>
          <span><strong>Preço:</strong> R$ ${p.preco.toFixed(2)}</span><br>
          <span><strong>Status:</strong> ${p.ativo ? 'Ativo ✅' : 'Inativo ❌'}</span>
          <div class="acoes">
            <button onclick="editarProduto('${p.id}')">Editar</button>
            <button onclick="deletarProduto('${p.id}')">Excluir</button>
            ${statusBtn}
          </div>
        </div>
      `;
      listaProdutos.appendChild(card);
    });
}

async function alterarStatusProduto(id, novoStatus) {
  try {
    const produtoRef = doc(db, "produtos", id);
    await updateDoc(produtoRef, { ativo: novoStatus });
    await carregarProdutos();
    alert(`Produto ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
  } catch (err) {
    console.error("Erro ao alterar status:", err);
  }
}

formProduto.addEventListener('submit', async e => {
  e.preventDefault();

  const nome = nomeProdutoInput.value.trim();
  const preco = parseFloat(precoProdutoInput.value);
  const descricao = descricaoProdutoInput.value.trim();
  const categoria = document.getElementById('categoriaProduto').value || '';
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

        const res = await fetch(`https://api.imgbb.com/1/upload?key=5633d7932b72210c398e734ddbc2d8ea`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        imagemUrl = data.data.url;

        await salvarProduto(nome, preco, imagemUrl, descricao, categoria);
      };
      reader.readAsDataURL(imagemFile);
    } else {
      const produto = produtos.find(p => p.id === editandoProdutoId);
      imagemUrl = produto.imagem;
      await salvarProduto(nome, preco, imagemUrl, descricao, categoria);
      alert('Produto adicionado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
  }
});

async function salvarProduto(nome, preco, imagemUrl, descricao, categoria) {
  const produto = { nome, preco, imagem: imagemUrl, descricao, categoria, ativo: true };

  try {
    if (editandoProdutoId) {
      const ref = doc(db, "produtos", editandoProdutoId);
      await updateDoc(ref, produto);
      editandoProdutoId = null;
      cancelarEdicaoBtn.style.display = 'none';
    } else {
      await addDoc(collection(db, "produtos"), produto);
    }
    formProduto.reset();
    preview.src = '';
    await carregarProdutos();
    alert('Produto salvo com sucesso!');
  } catch (err) {
    console.error("Erro ao salvar produto:", err);
  }
}

function editarProduto(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;
  editandoProdutoId = id;
  nomeProdutoInput.value = produto.nome;
  precoProdutoInput.value = produto.preco;
  descricaoProdutoInput.value = produto.descricao;
  document.getElementById('categoriaProduto').value = produto.categoria;
  preview.src = produto.imagem;
  cancelarEdicaoBtn.style.display = 'inline';
  alert('Edite os campos e clique em "Salvar" para atualizar o produto.');
}

cancelarEdicaoBtn.addEventListener('click', () => {
  editandoProdutoId = null;
  formProduto.reset();
  preview.src = '';
  cancelarEdicaoBtn.style.display = 'none';
});

async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja excluir?")) return;
  try {
    const ref = doc(db, "produtos", id);
    await deleteDoc(ref);
    await carregarProdutos();
  } catch (err) {
    console.error("Erro ao deletar:", err);
  }
}

// ===============================
// PEDIDOS
// ===============================
async function carregarPedidos() {
  try {
    const ref = collection(db, "pedidos");
    const snapshot = await getDocs(ref);
    pedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderizarPedidos();
    renderizarPedidosFinalizados();
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
  }
}

function renderizarPedidos() {
  listaPedidos.innerHTML = '';
  const pedidosAtivos = pedidos.filter(p => p.status !== 'Entregue');

  pedidosAtivos.forEach(p => {
    const itensTexto = Array.isArray(p.itens)
      ? p.itens.map(i => `${i.nome} x${i.quantidade}`).join(', ')
      : '(itens não encontrados)';

    const card = document.createElement('div');
    card.className = 'pedido-card';

    card.innerHTML = `
      <div>
        <strong>Pedido #${p.id}</strong><br>
        Cliente: ${p.cliente}<br>
        WhatsApp: <a href="https://wa.me/${p.whatsapp}" target="_blank">${p.whatsapp}</a><br>
        Endereço: ${p.endereco}<br>
        Itens: ${itensTexto}<br>
        Taxa: R$ ${p.taxaEntrega?.toFixed(2) || '0,00'}<br>
        Total: <strong>R$ ${p.total?.toFixed(2) || '0,00'}</strong><br>
        Status: ${p.status}<br>
        <button onclick="atualizarStatus('${p.id}', 'Em preparo')">Em preparo</button>
        <button onclick="atualizarStatus('${p.id}', 'Saiu para entrega')">Saiu para entrega</button>
        <button onclick='enviarWhatsapp(${JSON.stringify(p).replace(/'/g, "\\'")})'>WhatsApp</button>
        <button onclick="atualizarStatus('${p.id}', 'Entregue')">Finalizar</button>
      </div>
    `;

    listaPedidos.appendChild(card);
  });
}

async function atualizarStatus(id, status) {
  try {
    const ref = doc(db, "pedidos", id);
    await updateDoc(ref, { status });
    await carregarPedidos();
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
  }
}

function enviarWhatsapp(pedido) {
  const itensTexto = Array.isArray(pedido.itens)
    ? pedido.itens.map(i => `${i.nome} x${i.quantidade}`).join(', ')
    : '(itens não encontrados)';

  const mensagem = `
🍞 *Padaria Delivery* 🍞
Olá, ${pedido.cliente}! 😄
Seu pedido está *saindo para entrega* 🚗💨
📦 *Itens:*\n${itensTexto}
📍 ${pedido.endereco}
🚚 Entrega: R$ ${pedido.taxaEntrega?.toFixed(2) || '0,00'}
💰 Total: R$ ${pedido.total?.toFixed(2) || '0,00'}
Obrigado pela preferência! ❤️`.trim();

  const msg = encodeURIComponent(mensagem);
  window.open(`https://wa.me/${pedido.whatsapp}?text=${msg}`, '_blank');
}

function renderizarPedidosFinalizados() {
  listaFinalizados.innerHTML = '';
  pedidos
    .filter(p => p.status === 'Entregue')
    .forEach(p => {
      const card = document.createElement('div');
      card.className = 'pedido-card';

      const itensTexto = Array.isArray(p.itens)
        ? p.itens.map(i => `${i.nome} x${i.quantidade}`).join(', ')
        : '(itens não disponíveis)';

      card.innerHTML = `
        <div>
          <strong>Pedido #${p.id}</strong><br>
          Cliente: ${p.cliente}<br>
          WhatsApp: ${p.whatsapp}<br>
          Endereço: ${p.endereco}<br>
          Itens: ${itensTexto}<br>
          Taxa: R$ ${p.taxaEntrega?.toFixed(2) || '0,00'}<br>
          Total: R$ ${p.total?.toFixed(2) || '0,00'}<br>
          Status: ${p.status}
        </div>
      `;
      listaFinalizados.appendChild(card);
    });
}

// ===============================
// LOGIN / PAINEL / MODO ESCURO
// ===============================

const senhaCorreta = 'admin1234';

function verificarLogin() {
  const senhaInput = document.getElementById('senha');
  const mensagemLogin = document.getElementById('mensagemLogin');

  if (senhaInput.value === senhaCorreta) {
    // Marca como logado
    localStorage.setItem('logado', 'true');

    // Esconde tela de login
    document.getElementById('telaLogin').classList.add('hidden');

    // Mostra painel, sidebar e header
    document.getElementById('painel').classList.remove('hidden');
    document.querySelector('.sidebar').classList.remove('hidden');
    document.querySelector('header').classList.remove('hidden');

    // Carrega dados
    carregarProdutos();
    carregarPedidos();

    // Limpa inputs e mensagens
    mensagemLogin.textContent = '';
    senhaInput.value = '';
  } else {
    mensagemLogin.textContent = 'Senha incorreta. Tente novamente.';
  }
}

function mostrarLogin() {
  document.getElementById('telaLogin').classList.remove('hidden');
  document.getElementById('painel').classList.add('hidden');
  document.querySelector('.sidebar').classList.add('hidden');
  document.querySelector('header').classList.add('hidden');
}

function logout() {
  localStorage.removeItem('logado');
  location.reload();
}

function mostrarSecao(secao) {
  const secoes = document.querySelectorAll('.secao');
  secoes.forEach(s => s.classList.add('hidden'));
  const secaoMostrar = document.getElementById(`secao-${secao}`);
  if (secaoMostrar) secaoMostrar.classList.remove('hidden');
}

function alternarTema() {
  document.body.classList.toggle('dark');
}

// ===============================
// SIDEBAR TOGGLE
// ===============================
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}

// ===============================
// INICIALIZAÇÃO AO CARREGAR A PÁGINA
// ===============================
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('logado') === 'true') {
    // Usuário logado: mostra painel e carrega dados
    document.getElementById('telaLogin').classList.add('hidden');
    document.getElementById('painel').classList.remove('hidden');
    document.querySelector('.sidebar').classList.remove('hidden');
    document.querySelector('header').classList.remove('hidden');
    carregarProdutos();
    carregarPedidos();
  } else {
    // Mostra só login
    mostrarLogin();
  }
});

// ===============================
// EXPÕE FUNÇÕES PARA O HTML
// ===============================
window.verificarLogin = verificarLogin;
window.logout = logout;
window.mostrarSecao = mostrarSecao;
window.editarProduto = editarProduto;
window.deletarProduto = deletarProduto;
window.alterarStatusProduto = alterarStatusProduto;
window.atualizarStatus = atualizarStatus;
window.enviarWhatsapp = enviarWhatsapp;
window.toggleSidebar = toggleSidebar;
window.alternarTema = alternarTema;
