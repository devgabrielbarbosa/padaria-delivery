import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  getDoc,
  orderBy,
  deleteField,
  writeBatch,
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
const filtroStatus = document.getElementById("filtroStatus");
const listaPedidos = document.getElementById("listaPedidos");
const modalDetalhes = document.getElementById("modalDetalhes");
const listaProdutosDiv = document.getElementById("listaProdutos");
const modal = document.getElementById("modalEditar");
const fecharModalBtn = document.getElementById("fecharModal");
const formEditar = document.getElementById("formEditarProduto");
// Notificação de novo pedido
const notificacao = document.getElementById('notificacao-pedido');
const btnFechar = document.getElementById('fechar-notificacao');
// elementos (pegue do DOM)
const modalEditar = document.getElementById("modalEditar");
const btnFecharModal = document.getElementById("fecharModal");

// Variáveis globais de controle
let produtos = [];         // Array para armazenar os produtos carregados
let pedidos = [];          // Array para armazenar os pedidos carregados
let editandoProdutoId = null; // Guarda o ID do produto que está sendo editado
let unsubscribePedidos = null;

// ===============================
// CONFIGURAÇÕES DE LOJA E HORÁRIOS
// ===============================

// Referência ao documento de configurações da loja no Firestore
// Referência ao documento de configurações da loja no Firestore
const configRef = doc(db, "configuracoes", "loja");

// Botão salvar status da loja
document.getElementById("btnSalvarStatus").addEventListener("click", async () => {
  const statusSelect = document.getElementById("statusLoja");
  if (!statusSelect) {
    console.error("Elemento statusLoja não encontrado.");
    return;
  }

  const statusValue = statusSelect.value;
  const status = statusValue === "true"; // string → boolean

  try {
    await updateDoc(configRef, { status });
    alert(`✅ Status da loja atualizado para: ${status ? "Aberta" : "Fechada"}`);
  } catch (error) {
    console.error("Erro ao atualizar status da loja:", error);
    alert("❌ Ocorreu um erro ao salvar o status.");
  }
});


async function carregarStatusLoja() {
  try {
    const snap = await getDoc(configRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const statusSelect = document.getElementById("statusLoja");
    if (!statusSelect) return;

    if (typeof data.status === "boolean") {
      statusSelect.value = data.status ? "true" : "false";
    }
  } catch (error) {
    console.error("Erro ao carregar status da loja:", error);
  }
}



// Evento submit para salvar as configurações no Firestore
const formHorarios = document.getElementById("formHorarios");
if (formHorarios) {
  formHorarios.addEventListener("submit", async e => {
    e.preventDefault();

    const statusSelect = document.getElementById("statusLoja");
    if (!statusSelect) return;

    const status = statusSelect.value === "true";

    const manhaCategorias = Array.from(document.querySelectorAll('input[name="manhaCategorias"]:checked')).map(el => el.value);
    const tardeCategorias = Array.from(document.querySelectorAll('input[name="tardeCategorias"]:checked')).map(el => el.value);
    const noiteCategorias = Array.from(document.querySelectorAll('input[name="noiteCategorias"]:checked')).map(el => el.value);

    const data = {
      status,
      periodos: [
        {
          nome: "manha",
          abertura: document.getElementById("aberturaManha")?.value || "",
          fechamento: document.getElementById("fechamentoManha")?.value || "",
          categorias: manhaCategorias
        },
        {
          nome: "tarde",
          abertura: document.getElementById("aberturaTarde")?.value || "",
          fechamento: document.getElementById("fechamentoTarde")?.value || "",
          categorias: tardeCategorias
        },
        {
          nome: "noite",
          abertura: document.getElementById("aberturaNoite")?.value || "",
          fechamento: document.getElementById("fechamentoNoite")?.value || "",
          categorias: noiteCategorias
        }
      ]
    };

    try {
      await setDoc(configRef, data, { merge: true });
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações.");
    }
  });
}

// Carrega as configurações do admin
async function carregarConfiguracoesAdmin() {
  try {
    const snap = await getDoc(configRef);
    if (!snap.exists()) return;

    const data = snap.data();

    // Status da loja
    const statusSelect = document.getElementById("statusLoja");
    if (statusSelect && typeof data.status === "boolean") {
      statusSelect.value = data.status ? "true" : "false";
    }

    // Verifica se há períodos
    if (!Array.isArray(data.periodos)) return;

    data.periodos.forEach(periodo => {
      const nome = periodo.nome.toLowerCase();

      const aberturaInput = document.getElementById(`abertura${capitalize(nome)}`);
      if (aberturaInput) aberturaInput.value = periodo.abertura || "";

      const fechamentoInput = document.getElementById(`fechamento${capitalize(nome)}`);
      if (fechamentoInput) fechamentoInput.value = periodo.fechamento || "";

      // Marca/desmarca checkboxes
      const checkboxes = document.querySelectorAll(`input[name="${nome}Categorias"]`);
      checkboxes.forEach(cb => {
        cb.checked = Array.isArray(periodo.categorias) && periodo.categorias.includes(cb.value);
      });
    });
  } catch (error) {
    console.error("Erro ao carregar configurações do admin:", error);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// No DOMContentLoaded ou no carregamento do admin:
document.addEventListener('DOMContentLoaded', () => {
  carregarConfiguracoesAdmin();
});

// Executa a carga do status ao carregar a página
window.addEventListener("DOMContentLoaded", carregarStatusLoja);

// ===============================
// PRODUTOS

// Substitua/insira esta função no lugar da sua carregarProdutos existente
// Função para carregar produtos e montar cards com botões
async function carregarProdutos() {
  const container = document.getElementById("listaProdutos");
  if (!container) return;

  try {
    container.innerHTML = "Carregando...";

    const produtosCol = collection(db, "produtos");
    const produtosSnapshot = await getDocs(produtosCol);

    if (produtosSnapshot.empty) {
      container.innerHTML = "<p>Nenhum produto encontrado.</p>";
      return;
    }

    let html = '<div class="cards-container">';

    produtosSnapshot.forEach(docSnap => {
      const produto = docSnap.data() || {};
      const id = docSnap.id;
      const precoNum = Number(produto.preco ?? 0);
      const ativo = Boolean(produto.ativo);
      const ativoText = ativo ? "Ativo" : "Inativo";
      const btnToggleText = ativo ? "Desativar" : "Ativar";

      const nome = produto.nome ? String(produto.nome) : "";
      const categoria = produto.categoria ? String(produto.categoria) : "";
      const disponibilidade = produto.disponibilidade ? String(produto.disponibilidade) : "";
      const descricao = produto.descricao ? String(produto.descricao) : "";
      const imagem = produto.imagem ? String(produto.imagem) : "";

      html += `
        <div class="card-produto" data-id="${id}">
          <img src="${imagem}" alt="${nome}" class="img-produto" />
          <h3>${nome}</h3>
          <p><strong>Preço:</strong> R$ ${precoNum.toFixed(2)}</p>
          <p><strong>Categoria:</strong> ${categoria}</p>
          <p><strong>Disponibilidade:</strong> ${disponibilidade}</p>
          <p class="descricao"><strong>Descrição:</strong> ${descricao}</p>
          <p class="status ${ativo ? 'ativo' : 'inativo'}"><strong>Status:</strong> ${ativoText}</p>
          <div class="botoes-acoes">
            <button class="btn editar" data-action="editar" data-id="${id}">Editar</button>
            <button class="btn toggle" data-action="toggle" data-id="${id}" data-ativo="${ativo}">${btnToggleText}</button>
            <button class="btn excluir" data-action="excluir" data-id="${id}">Excluir</button>
          </div>
        </div>
      `;
    });

    html += "</div>";
    container.innerHTML = html;

  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    container.innerHTML = "<p>Erro ao carregar produtos.</p>";
  }
}

// Listener único para botões dentro do container de produtos
document.getElementById('listaProdutos').addEventListener('click', (event) => {
  const btn = event.target.closest('button');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!action || !id) return;

  event.preventDefault();

  if (action === 'editar') {
    if (typeof abrirModalEditar === 'function') {
      abrirModalEditar(id);
    } else {
      console.warn('abrirModalEditar não está definida.');
    }
  }
  else if (action === 'toggle') {
    if (typeof toggleAtivo === 'function') {
      const atualAtivo = btn.dataset.ativo === 'true';
      toggleAtivo(id, atualAtivo);
    } else {
      console.warn('toggleAtivo não está definida.');
    }
  }
  else if (action === 'excluir') {
    if (typeof excluirProduto === 'function') {
      excluirProduto(id);
    } else {
      console.warn('excluirProduto não está definida.');
    }
  }
});


document.getElementById("fecharModal").addEventListener("click", () => {
  document.getElementById("modalEditar").classList.add("hidden");
});


// Exemplo básico da função abrirModalEditar (substitua pela sua implementação)
async function  abrirModalEditar(id) {
  try {
    const produtoRef = doc(db, "produtos", id);
    const produtoDoc = await getDoc(produtoRef);

    if (!produtoDoc.exists()) {
      alert("Produto não encontrado.");
      return;
    }

    const produto = produtoDoc.data();

    document.getElementById("editar-id").value = id;
    document.getElementById("editar-nome").value = produto.nome || "";
    document.getElementById("editar-preco").value = Number(produto.preco) || 0;
    document.getElementById("editar-categoria").value = produto.categoria || "";
    document.getElementById("editar-descricao").value = produto.descricao || "";
    document.getElementById("editar-disponibilidade").value = produto.disponibilidade || "manha";
    document.getElementById("editar-imagem").value = produto.imagem || "";

    const modal = document.getElementById("modalEditar");
    modal.classList.remove("hidden");
    document.getElementById("editar-nome").focus();

  } catch (error) {
    console.error("Erro ao abrir modal editar:", error);
    alert("Erro ao abrir modal editar.");
  }
};

//
let timeoutNotificacao;

function mostrarNotificacaoPedido() {
  const notificacao = document.getElementById('notificacao-pedido');
  if (!notificacao) return;

  notificacao.style.display = 'flex';

  if (timeoutNotificacao) clearTimeout(timeoutNotificacao);

  timeoutNotificacao = setTimeout(() => {
    notificacao.style.display = 'none';
    timeoutNotificacao = null;
  }, 6000);
}


if (btnFechar && notificacao) {
  btnFechar.addEventListener('click', () => {
    notificacao.style.display = 'none';
  });
}


// função que fecha o modal (remove/oculta de forma segura)
function fecharModalEditar() {
  if (!modalEditar) return;
  modalEditar.classList.add("hidden");
  modalEditar.style.display = "none";
}

// botão X
btnFecharModal?.addEventListener("click", fecharModalEditar);

// fechar clicando fora do conteúdo do modal
window.addEventListener("click", (e) => {
  if (e.target === modalEditar) fecharModalEditar();
});

// fechar com ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalEditar && !modalEditar.classList.contains("hidden")) {
    fecharModalEditar();
  }
});


// Fecha modal ao clicar fora do conteúdo
fecharModalBtn.onclick = () => {
  modal.classList.add("hidden");
  modal.style.display = "none";
}


// Salva alterações do formulário no Firestore
formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("editar-id").value;
  const nome = document.getElementById("editar-nome").value.trim();
  const preco = parseFloat(document.getElementById("editar-preco").value);
  const categoria = document.getElementById("editar-categoria").value.trim();
  const descricao = document.getElementById("editar-descricao").value.trim();
  const imagem = document.getElementById("editar-imagem").value.trim();
  const disponibilidade = document.getElementById("editar-disponibilidade").value;

  if (!nome || isNaN(preco) || preco < 0 || !categoria || !descricao || !imagem) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  try {
    const produtoRef = doc(db, "produtos", id);
    await updateDoc(produtoRef, {
      nome,
      preco,
      categoria,
      descricao,
      imagem,
      disponibilidade
    });
    alert("Produto atualizado com sucesso!");
    fecharModalEditar(); // usar função padrão para fechar modal
    carregarProdutos();
  } catch (error) {
    console.error("Erro ao salvar produto: ", error);
    alert("Erro ao atualizar produto.");
  }
});


// Ativa ou desativa produto no Firestore
window.toggleAtivo = async function(id, atualAtivo) {
  try {
    const produtoRef = doc(db, "produtos", id);
    await updateDoc(produtoRef, { ativo: !atualAtivo });
    alert(`Produto ${!atualAtivo ? "ativado" : "desativado"} com sucesso!`);
    carregarProdutos();
  } catch (error) {
    console.error("Erro ao atualizar ativo: ", error);
    alert("Erro ao atualizar status do produto.");
  }
}

// Exclui produto no Firestore
window.excluirProduto = async function(id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;

  try {
    const produtoRef = doc(db, "produtos", id);
    await deleteDoc(produtoRef);
    alert("Produto excluído com sucesso!");
    carregarProdutos();
  } catch (error) {
    console.error("Erro ao excluir produto: ", error);
    alert("Erro ao excluir o produto.");
  }
}
// -----------------------------
// Inicializador convencional do modalEditar
// -----------------------------
function setupModalEditar() {
  const modalEditar = document.getElementById("modalEditar");
  const btnFecharModal = document.getElementById("fecharModal");

  if (!modalEditar || !btnFecharModal) {
    console.warn("Elementos do modal editar não encontrados.");
    return;
  }

  btnFecharModal.addEventListener("click", () => {
    modalEditar.classList.add("hidden");
    modalEditar.style.display = "none";
  });

  // Fecha modal ao clicar fora da área do modal
  window.addEventListener("click", (e) => {
    if (e.target === modalEditar) {
      modalEditar.classList.add("hidden");
      modalEditar.style.display = "none";
    }
  });

  // Fecha modal ao pressionar ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalEditar.classList.contains("hidden")) {
      modalEditar.classList.add("hidden");
      modalEditar.style.display = "none";
    }
  });
}

function setupFecharModalDetalhes() {
  const modal = document.getElementById("modalDetalhes");
  const btnFechar = document.getElementById("btnFecharModal");

  if (!modal) {
    console.warn("ModalDetalhes não encontrado.");
    return;
  }
  if (!btnFechar) {
    console.warn("Botão btnFecharModal não encontrado.");
    return;
  }

  btnFechar.addEventListener("click", function(e) {
    e.preventDefault();
    modal.style.display = "none";       // esconde o modal
    modal.classList.add("hidden");       // adiciona classe para esconder (se estiver usando)
    modal.setAttribute("aria-hidden", "true");
  });
}

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", setupFecharModalDetalhes);

// Executa a inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", setupModalEditar);


// Chama a função para carregar os produtos assim que a página carregar
carregarProdutos();

// ===============================
// Referência para a coleção
// ===============================

// Função para corrigir
async function corrigirCampoStatusComEspaco() {
  try {
    const pedidosRef = collection(db, "pedidos");
    const snap = await getDocs(pedidosRef);
    const updates = [];

    snap.forEach(d => {
      const data = d.data();
      if (Object.prototype.hasOwnProperty.call(data, "status ")) {
        const valorComEspaco = data["status "];
        const docRef = doc(db, "pedidos", d.id);
        updates.push(updateDoc(docRef, { status: valorComEspaco, "status ": deleteField() }));
      }
    });

    if (updates.length === 0) {
      console.log("Nenhum documento com 'status ' encontrado.");
      return;
    }

    await Promise.all(updates);
    console.log(`Corrigidos ${updates.length} documentos.`);
  } catch (error) {
    console.error("Erro ao corrigir documentos:", error);
  }
}

async function normalizarStatusEmPedidos() {
  const snap = await getDocs(collection(db, "pedidos"));
  const batchSize = 300;
  let batch = writeBatch(db);
  let ops = 0;
  let count = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data && data.status) {
      const novo = String(data.status)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
      const ref = doc(db, "pedidos", docSnap.id);
      batch.update(ref, { status: novo });
      ops++;
      count++;

      if (ops === batchSize) {
        await batch.commit(); // envia o lote atual
        batch = writeBatch(db); // cria novo batch
        ops = 0;
      }
    }
  }

  // Comita o batch final se houver operações pendentes
  if (ops > 0) {
    await batch.commit();
  }

  console.log(`Normalizados: ${count}`);
}


const pedidosRef = collection(db, "pedidos");

// ===============================
// Carregar pedidos com filtro
// ===============================
const pedidosVisualizados = new Set();

function carregarPedidos(status = "todos") {
  const listaPedidos = document.getElementById("listaPedidos");
  listaPedidos.innerHTML = "Carregando...";

  let q;
  if (status === "todos") {
    q = query(pedidosRef, orderBy("criadoEm", "desc"));
  } else {
    q = query(
      pedidosRef,
      where("status", "==", status),
      orderBy("criadoEm", "desc")
    );
  }

  if (typeof unsubscribePedidos === "function") {
    unsubscribePedidos();
  }

  unsubscribePedidos = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      listaPedidos.innerHTML = "<p>Nenhum pedido encontrado para esse filtro.</p>";
      return;
    }

    listaPedidos.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const docId = docSnap.id;
      const data = docSnap.data();

      // Dispara notificação para pedidos novos
      if (!pedidosVisualizados.has(docId)) {
        pedidosVisualizados.add(docId);
        mostrarNotificacaoPedido();
      }

      const statusRaw = data.status || "Pendente";
      const statusClass = statusRaw.toLowerCase().replace(/\s+/g, "-");

      // Formata criadoEm para data legível, se possível
      let criadoEmFormatado = "-";
      if (data.criadoEm && typeof data.criadoEm.toDate === "function") {
        criadoEmFormatado = data.criadoEm.toDate().toLocaleString();
      } else if (typeof data.criadoEm === "string") {
        criadoEmFormatado = data.criadoEm;
      }

      const div = document.createElement("div");
      div.classList.add("pedido");

      div.innerHTML = `
        <div class="pedido status-${statusClass}">
           <p>
    <strong>Cliente:</strong> #${data.id ?? "-"} <br>
    <strong>Criado em:</strong> ${criadoEmFormatado} <br>
    <strong>Valor:</strong> R$ ${data.total ?? "-"},00 <br>
    <strong>Descrição:</strong> ${data.descricao ?? "Sem nenhuma observação"} <br>
    <strong>Endereço:</strong> ${data.endereco ?? "-"} <br>
    <strong>Telefone:</strong> ${data.whatsapp ?? "-"} <br>
    <strong>Nome do cliente:</strong> ${data.cliente ?? "Cliente não informado"}<br>
    <span class="status-label status-${statusClass}">${statusRaw}</span>
  </p>
  <p class="total">Total: R$ ${data.total !== undefined ? Number(data.total).toFixed(2) : "0.00"}</p>
        </div>
      `;
const btnWhats = div.querySelector(`#btnWhatsApp-${docId}`);
if (btnWhats) {
  btnWhats.addEventListener("click", () => enviarWhatsApp(docId));
}
      const acoes = document.createElement("div");
      acoes.classList.add("acoes");

      // Botão ver detalhes
      const btnDetalhes = document.createElement("button");
      btnDetalhes.classList.add("ver-detalhes");
      btnDetalhes.textContent = "Ver detalhes";
      btnDetalhes.dataset.id = docId;
      btnDetalhes.addEventListener("click", () => mostrarDetalhesPedido(docId));
      acoes.appendChild(btnDetalhes);

      // Botão WhatsApp se saiu para entrega
      const isSairParaEntrega = statusClass === "saiu-para-entrega";
      if (isSairParaEntrega) {
        const btnWhats = document.createElement("button");
        btnWhats.classList.add("whatsapp");
        btnWhats.textContent = "Enviar WhatsApp";
        btnWhats.dataset.id = docId;
        btnWhats.addEventListener("click", () => enviarWhatsApp(docId));
        acoes.appendChild(btnWhats);
      }

      // Botão marcar como entregue
      const btnEntregue = document.createElement("button");
      btnEntregue.classList.add("ver-detalhes");
      btnEntregue.textContent = "Marcar Entregue";
      btnEntregue.addEventListener("click", async () => {
        await alterarStatus(docId, "Entregue");
      });
      acoes.appendChild(btnEntregue);

      div.appendChild(acoes);
      listaPedidos.appendChild(div);
    });
  }, (err) => {
    console.error("Erro no onSnapshot de pedidos:", err);
    listaPedidos.innerHTML = "<p>Erro ao carregar pedidos.</p>";
  });
}
// Após gerar toda a lista...
document.querySelectorAll(".btn.whatsapp").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.id.replace("btnWhatsApp-", "");
    enviarWhatsApp(id);
  });
});


async function mostrarDetalhesPedido(pedidoId) {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    const pedidoSnap = await getDoc(pedidoRef);

    if (!pedidoSnap.exists()) {
      alert("Pedido não encontrado.");
      return;
    }
    document.getElementById("pedidoIdEditar").value = pedidoId;

    const pedido = pedidoSnap.data();

    // Preencher os elementos do modal com os dados do pedido
    document.querySelector("#modalDetalhes .numeroPedido").textContent = pedido.id || pedidoId;
    document.querySelector("#modalDetalhes .clienteNome").textContent = pedido.cliente || "Não informado";
    document.querySelector("#modalDetalhes .clienteTelefone").textContent = pedido.whatsapp || "-";
    document.querySelector("#modalDetalhes .clienteEndereco").textContent = pedido.endereco || "-";
    document.querySelector("#modalDetalhes .dataPedido").textContent = pedido.criadoEm || "-";
    document.querySelector("#modalDetalhes .taxaEntrega").textContent = `R$ ${Number(pedido.taxaEntrega || 0).toFixed(2)}`;
    document.querySelector("#modalDetalhes .totalPedido").textContent = `Total: R$ ${Number(pedido.total || 0).toFixed(2)}`;


    // Exemplo: exibir itens do pedido
    const listaItens = document.querySelector("#modalDetalhes .itensPedido");
    if (listaItens) {
      listaItens.innerHTML = "";
      if (Array.isArray(pedido.itens)) {
        pedido.itens.forEach(item => {
          const li = document.createElement("li");
          li.textContent = `${item.quantidade}x ${item.nome} — R$ ${Number(item.preco).toFixed(2)}`;
          listaItens.appendChild(li);
        });
      } else {
        listaItens.innerHTML = "<li>Nenhum item encontrado.</li>";
      }
    }

    // Mostrar o modal
    const modal = document.getElementById("modalDetalhes");
    if (modal) {
      modal.style.display = "block";
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    }

  } catch (error) {
    console.error("Erro ao mostrar detalhes do pedido:", error);
    alert("Erro ao carregar detalhes do pedido.");
  }
}


async function alterarStatus(pedidoId, novoStatus) {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    await updateDoc(pedidoRef, { status: novoStatus });
    
    // Atualizar visual do pedido na tela
    const pedidoElem = document.querySelector(`.pedido[data-id="${pedidoId}"]`);
    if (pedidoElem) {
      // Remove classes antigas de status que controlam a cor de fundo
      for (const c of pedidoElem.classList) {
        if (c.startsWith("status-bg-")) {
          pedidoElem.classList.remove(c);
        }
      }
      
      // Cria a classe nova baseada no novoStatus (ex: "entregue" vira "status-bg-entregue")
      const statusClass = novoStatus.toLowerCase().replace(/\s+/g, "-");
      pedidoElem.classList.add(`status-bg-${statusClass}`);
      
      // Atualiza o texto do label do status, se tiver
      const statusLabel = pedidoElem.querySelector(".status-label");
      if (statusLabel) {
        statusLabel.textContent = novoStatus;
        statusLabel.className = "status-label"; // reset class
        statusLabel.classList.add(`status-${statusClass}`);
      }
    }

    alert(`Status do pedido atualizado para: ${novoStatus}`);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    alert("Erro ao atualizar status do pedido.");
  }
}

document.getElementById("formEditarStatus").addEventListener("submit", async (e) => {
  e.preventDefault(); // Impede o reload da página

  const pedidoId = document.getElementById("pedidoIdEditar").value;
  const novoStatus = document.getElementById("selectStatusPedido").value;

  try {
    await alterarStatus(pedidoId, novoStatus); // Função que atualiza no Firebase
    
    // Atualiza visualmente no modal
    alert("Status atualizado com sucesso!");

    // Fecha o modal sem recarregar a página
    document.getElementById("modalDetalhes").classList.add("hidden");
  } catch (error) {
    console.error(error);
    alert("Erro ao atualizar status.");
  }
});



document.getElementById("modalImprimir").addEventListener("submit", async (e) => {
  e.preventDefault();

  const pedidoId = document.getElementById("pedidoIdEditar").value;
  const novoStatus = document.getElementById("selectStatusPedido").value;

  try {
    await alterarStatus(pedidoId, novoStatus);

    // Fecha o modal
    document.getElementById("modalDetalhes").classList.add("hidden");
  } catch (error) {
    alert("Erro ao atualizar status.");
  }
});

document.getElementById("btnFecharModal").addEventListener("click", () => {
  document.getElementById("modalDetalhes").classList.add("hidden");
});

window.mostrarDetalhesPedido = mostrarDetalhesPedido; // torna global

/*
        IMPRESSÃO DO PEDIDO 
*/

// Abrir modal de impressão
document.getElementById("btnAbrirModalImprimir").addEventListener("click", () => {
  document.getElementById("modalImprimir").classList.remove("hidden");
});

// Fechar modal de impressão
document.getElementById("btnFecharModalImprimir").addEventListener("click", () => {
  document.getElementById("modalImprimir").classList.add("hidden");
});

// Botão dentro do modal que chama a impressão
document.getElementById("btnImprimir").addEventListener("click", () => {
  window.print();
});


async function mostrarModalImprimir(pedidoId) {
  const pedidoRef = doc(db, "pedidos", pedidoId);
  const pedidoSnap = await getDoc(pedidoRef);

  if (!pedidoSnap.exists()) {
    alert("Pedido não encontrado.");
    return;
  }

  const pedido = pedidoSnap.data();
  
  const modal = document.getElementById("modalImprimir");

  modal.querySelector(".clienteNome").textContent = pedido.cliente || "-";
  modal.querySelector(".pedidoData").textContent = new Date(pedido.data?.seconds * 1000).toLocaleString() || "-";
  modal.querySelector(".clienteEndereco").textContent = pedido.endereco || "-";
  modal.querySelector(".clienteTelefone").textContent = pedido.tel || "-";
  modal.querySelector(".totalPedido").textContent = `R$ ${Number(pedido.total || 0).toFixed(2)}`;
  modal.querySelector(".observacoesPedido").textContent = pedido.descricao || "-";

  const listaItens = modal.querySelector(".itensPedido");
  listaItens.innerHTML = "";
  if (Array.isArray(pedido.itens)) {
    pedido.itens.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.quantidade}x ${item.nome} — R$ ${Number(item.preco).toFixed(2)}`;
      listaItens.appendChild(li);
    });
  } else {
    listaItens.innerHTML = "<li>Nenhum item encontrado.</li>";
  }

  modal.classList.remove("hidden");
}

// ===============================
// FUNÇÕES PARA WHATSAPP
// ===============================

/**
 * Envia mensagem WhatsApp para cliente
 * @param {string} pedidoId - ID do pedido no Firestore
 * @param {string} tipoMensagem - Tipo de mensagem ("carinhosa" ou "direta")
 */

/**
 * Normaliza número de telefone para formato internacional (Brasil)
 * @param {string} raw - Número de telefone bruto
 * @returns {string|null} - Número normalizado ou null se inválido
 */
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");   // Remove tudo que não é número
  digits = digits.replace(/^0+/, "");             // Remove zeros à esquerda

  // Se não começa com código Brasil (55), adiciona se possível
  if (!digits.startsWith("55")) {
    if (digits.length === 10 || digits.length === 11) {
      digits = "55" + digits;
    }
  }

  // Valida se só tem números
  if (!/^\d+$/.test(digits)) return null;

  // Número mínimo válido: 11 dígitos (ex: DDD + número)
  if (digits.length < 11) return null;

  return digits;
}

async function enviarWhatsApp(pedidoId, tipoMensagem = "carinhosa") {
  try {
    const docRef = doc(db, "pedidos", pedidoId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      alert("Pedido não encontrado.");
      return;
    }

    const p = snap.data();

    // Normaliza telefone
    const rawPhone = p.whatsapp || p.telefone || p.celular || "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      alert("Número de WhatsApp inválido para este pedido: " + (rawPhone || "vazio"));
      return;
    }

    // Formata valores monetários em BRL
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });

    // Formata itens do pedido
    const itens = Array.isArray(p.itens) ? p.itens : [];
    const itensTexto = itens.length
      ? itens.map(it => {
          const quantidade = Number(it.quantidade || 1);
          const precoNum = Number(it.preco || 0);
          const precoFmt = formatter.format(precoNum);
          const nomeItem = it.nome || "Produto";
          return `${quantidade}x ${nomeItem} — ${precoFmt}`;
        }).join("\n")
      : "-";

    // Calcula valores
    let subtotalNum = itens.length
      ? itens.reduce((acc, it) => acc + (Number(it.quantidade || 1) * Number(it.preco || 0)), 0)
      : Number(p.total || 0);

    const taxaNum = Number(p.taxaEntrega ?? p.taxa ?? 0);
    const totalComTaxaNum = subtotalNum + taxaNum;

    // Formata valores monetários
    const subtotal = formatter.format(subtotalNum);
    const taxaEntrega = formatter.format(taxaNum);
    const totalComTaxa = formatter.format(totalComTaxaNum);

    // Templates de mensagem
    const nomeCliente = p.cliente ? ` ${p.cliente}` : "";
    const templates = {
  direta: `Olá${nomeCliente}! 👋\n\nSeu pedido saiu para entrega.\n\nItens:\n${itensTexto}\n\nTaxa de entrega: R$ ${taxaEntrega}\nTotal a pagar: R$ ${totalComTaxa}\n\nQualquer dúvida, responda aqui. Obrigado! 🙌`,
  carinhosa: `Olá${nomeCliente}! 💖🌟\n\nSeu pedido está a caminho com muito amor e cuidado, feito especialmente para você! 🛵✨\n\nItens:\n${itensTexto}\n\nSubtotal: R$ ${subtotal}\nTaxa de entrega: R$ ${taxaEntrega}\nTotal (com entrega): R$ ${totalComTaxa}\n\nAgradecemos de coração pela sua escolha. Esperamos que seu dia fique ainda mais doce com nossos produtos! Qualquer coisa, estamos por aqui. ❤️🍞`
    };


    const mensagem = templates[tipoMensagem] || templates.carinhosa;

    // Log para ajudar na depuração
    console.log(`Enviando WhatsApp para ${phone} com a mensagem:\n${mensagem}`);

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
  } catch (err) {
    console.error("Erro ao enviar WhatsApp:", err);
    alert("Erro ao tentar enviar WhatsApp. Veja console.");
  }
}

// ===============================
// FUNÇÕES DE LOGIN E PAINEL
// ===============================

// Senha fixa para login (substituir por Firebase Auth em produção)
// Senha fixa para login (substituir por Firebase Auth em produção)
const SENHA_ADMIN = 'admin1234';

/**
 * Verifica credenciais de login
 */
function verificarLogin() {
  const senhaInput = document.getElementById('senha');
  const senha = senhaInput.value.trim();
  const mensagem = document.getElementById('mensagemLogin');

  if (senha === SENHA_ADMIN) {
    localStorage.setItem('logado', 'true');
    mostrarPainel();
    mensagem.textContent = '';
    senhaInput.value = ''; // limpa campo senha após sucesso
  } else {
    mensagem.textContent = 'Senha incorreta. Tente novamente.';
    senhaInput.value = ''; // limpa campo para tentar novamente
    senhaInput.focus();    // foca o input para melhor usabilidade
  }
}


/**
 * Mostra painel administrativo
 */
function mostrarPainel() {
  // Esconde tela de login
  document.getElementById('telaLogin').classList.add('hidden');
  // Mostra painel principal
  document.getElementById('painel').classList.remove('hidden');
  // Exibe sidebar e header
  document.querySelector('.sidebar').classList.remove('hidden');
  document.querySelector('header').classList.remove('hidden');

  // Carrega produtos e pedidos se as funções estiverem definidas
  if (typeof carregarProdutos === 'function') carregarProdutos();
  if (typeof carregarPedidos === 'function') carregarPedidos();
}

/**
 * Mostra tela de login
 */
function mostrarLogin() {
  document.getElementById('telaLogin').classList.remove('hidden');
  document.getElementById('painel').classList.add('hidden');
  document.querySelector('.sidebar').classList.add('hidden');
  document.querySelector('header').classList.add('hidden');
}

/**
 * Finaliza sessão do admin
 */
function logout() {
  localStorage.removeItem('logado');
  mostrarLogin();
}

/**
 * Alterna entre temas claro/escuro
 */
document.addEventListener('DOMContentLoaded', () => {
  const temaEscuro = localStorage.getItem('temaEscuro') === 'true';
  if (temaEscuro) {
    document.body.classList.add('dark');
  }
});


/**
 * Mostra a seção com o ID especificado e esconde as outras
 * @param {string} secao - ID da seção a ser mostrada (sem o prefixo "secao-")
 */
function mostrarSecao(secao) {
  if (!secao) return; // evita esconder tudo se parâmetro vazio ou indefinido

  // Esconde todas as seções
  document.querySelectorAll('.secao').forEach(s => s.classList.add('hidden'));

  // Mostra a seção alvo
  const secaoAlvo = document.getElementById(`secao-${secao}`);
  if (secaoAlvo) secaoAlvo.classList.remove('hidden');
}


// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  // Se o usuário estiver logado, mostra o painel
  if (localStorage.getItem('logado') === 'true') {
    mostrarPainel();
  } else {
    // Caso contrário, mostra a tela de login (caso você tenha essa função)
    mostrarLogin?.();
  }

  // Aplica o tema escuro se estiver salvo como ativo
  if (localStorage.getItem('temaEscuro') === 'true') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Carrega as configurações da loja para o admin
  carregarConfiguracoesAdmin();
});

// Expõe funções globais para o HTML
window.verificarLogin = verificarLogin || (() => console.warn("verificarLogin não definida"));
window.logout = logout || (() => console.warn("logout não definida"));
window.mostrarSecao = mostrarSecao || (() => console.warn("mostrarSecao não definida"));
window.toggleAtivo = toggleAtivo || (() => console.warn("toggleAtivo não definida"));
window.abrirModalEditar = abrirModalEditar || (() => console.warn("abrirModalEditar não definida"));
window.excluirProduto = excluirProduto || (() => console.warn("excluirProduto não definida"));
window.carregarProdutos = carregarProdutos || (() => console.warn("carregarProdutos não foi definida "));
window.alterarStatus = alterarStatus;
