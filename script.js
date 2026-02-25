// ============================================================
// Paleta de cores para eventos (ciclo automático)
// ============================================================
const CORES_EVENTO = [
  "#1a73e8", // azul
  "#e53935", // vermelho
  "#43a047", // verde
  "#fb8c00", // laranja
  "#8e24aa", // roxo
  "#00897b", // teal
  "#d81b60", // rosa
  "#546e7a", // cinza-azul
];

function corEvento(indice) {
  return CORES_EVENTO[indice % CORES_EVENTO.length];
}

// ============================================================
// Estado do calendário
// ============================================================
let mesVisualizado;
let anoVisualizado;
let dataSelecionada = null;
let eventoEmEdicao = null;

// Eventos: chave "YYYY-MM-DD" → array de { titulo, horaInicio, horaFim, nota, cor }
const eventos = {};

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const diasSemanaLabel = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// ============================================================
// Chave única para um dia
// ============================================================
function chaveData(dia, mes, ano) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// ============================================================
// Renderiza o calendário
// ============================================================
function renderCalendario() {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();
  const anoHoje = hoje.getFullYear();

  document.getElementById("mes-display").textContent = meses[mesVisualizado];
  document.getElementById("ano-display").textContent = anoVisualizado;

  const primeiroDia = new Date(anoVisualizado, mesVisualizado, 1).getDay();
  const totalDias = new Date(anoVisualizado, mesVisualizado + 1, 0).getDate();

  const grade = document.getElementById("grade-dias");
  grade.innerHTML = "";

  // Células vazias antes do primeiro dia
  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement("div");
    vazio.classList.add("dia-celula");
    grade.appendChild(vazio);
  }

  // Células dos dias
  for (let dia = 1; dia <= totalDias; dia++) {
    const celula = document.createElement("div");
    celula.classList.add("dia-celula");
    celula.dataset.dia = dia;

    // --- Topo: número do dia ---
    const topo = document.createElement("div");
    topo.classList.add("dia-topo");

    const wrap = document.createElement("div");
    wrap.classList.add("dia-numero-wrap");

    const numero = document.createElement("span");
    numero.classList.add("dia-numero");
    numero.textContent = dia;

    if (
      dia === diaHoje &&
      mesVisualizado === mesHoje &&
      anoVisualizado === anoHoje
    ) {
      celula.classList.add("dia-atual");
    }

    wrap.appendChild(numero);
    topo.appendChild(wrap);
    celula.appendChild(topo);

    // --- Lista de eventos ---
    const chave = chaveData(dia, mesVisualizado, anoVisualizado);
    const lista = eventos[chave] || [];

    const listaEl = document.createElement("div");
    listaEl.classList.add("eventos-lista");

    // Quantos eventos caber visualmente (estimativa: ~3 por célula)
    const MAX_VISIVEIS = 3;
    const visiveis = lista.slice(0, MAX_VISIVEIS);
    const extras = lista.length - MAX_VISIVEIS;

    visiveis.forEach((ev) => {
      const item = document.createElement("div");
      item.classList.add("evento-item");

      const dot = document.createElement("span");
      dot.classList.add("evento-dot");
      dot.style.backgroundColor = ev.cor;

      const texto = document.createElement("span");
      texto.classList.add("evento-texto");
      texto.textContent = ev.titulo;

      item.appendChild(dot);
      item.appendChild(texto);
      listaEl.appendChild(item);
    });

    if (extras > 0) {
      const mais = document.createElement("div");
      mais.classList.add("evento-mais");
      mais.textContent = `+${extras}`;
      listaEl.appendChild(mais);
    }

    celula.appendChild(listaEl);

    // Função de abrir evento/formulário
    const abrirDia = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const chave = chaveData(dia, mesVisualizado, anoVisualizado);
      if (eventos[chave] && eventos[chave].length > 0) {
        abrirSheetVisualizacao(dia);
      } else {
        abrirSheet(dia);
      }
    };

    celula.addEventListener("click", abrirDia);
    celula.addEventListener("touchend", abrirDia, { passive: false });

    grade.appendChild(celula);
  }
}

// ============================================================
// Navegar entre meses
// ============================================================
function mesAnterior() {
  if (mesVisualizado === 0) {
    mesVisualizado = 11;
    anoVisualizado--;
  } else mesVisualizado--;
  renderCalendario();
}

function proximoMes() {
  if (mesVisualizado === 11) {
    mesVisualizado = 0;
    anoVisualizado++;
  } else mesVisualizado++;
  renderCalendario();
}

// ============================================================
// Painel de Estatísticas
// ============================================================
function parseValorDinheiro(valorStr) {
  if (!valorStr) return 0;
  // Remove "R$", espaços, transforma pontos em nada e vírgulas em ponto
  const limpo = valorStr.replace(/[^\d,-]/g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

function formatarDinheiro(num) {
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function atualizarDashboard() {
  let fatAno = 0;
  let fatMes = 0;
  let qtdAno = 0;
  let qtdMes = 0;

  const mesAtualFormatado = String(mesVisualizado + 1).padStart(2, "0");
  const anoAtualFoco = String(anoVisualizado);

  // Varremos todas as chaves "YYYY-MM-DD" salvas em eventos
  Object.keys(eventos).forEach((chave) => {
    const partes = chave.split("-");
    const a = partes[0];
    const m = partes[1];
    const lista = eventos[chave];

    if (a === anoAtualFoco) {
      // Pertence ao ano
      qtdAno += lista.length;
      const somaDia = lista.reduce(
        (acc, ev) => acc + parseValorDinheiro(ev.valor),
        0,
      );
      fatAno += somaDia;

      if (m === mesAtualFormatado) {
        // Pertence especificamente a este mês do ano
        qtdMes += lista.length;
        fatMes += somaDia;
      }
    }
  });

  document.getElementById("stats-label-mes").textContent =
    meses[mesVisualizado];
  document.getElementById("stats-fat-mes").textContent =
    formatarDinheiro(fatMes);
  document.getElementById("stats-fat-ano").textContent =
    formatarDinheiro(fatAno);
  document.getElementById("stats-qtd-mes").textContent = qtdMes;
  document.getElementById("stats-qtd-ano").textContent = qtdAno;
}

function abrirDashboard() {
  atualizarDashboard();
  document.getElementById("top-sheet-stats").classList.add("ativo");
  document.getElementById("overlay").classList.add("ativo");
}

function fecharDashboard() {
  document.getElementById("top-sheet-stats").classList.remove("ativo");
  document.getElementById("overlay").classList.remove("ativo");
}

// ============================================================
// Salvar / Carregar Dados (LocalStorage)
// ============================================================
function salvarDadosApp() {
  localStorage.setItem("eventosCalendario", JSON.stringify(eventos));
}

function carregarDadosApp() {
  const dados = localStorage.getItem("eventosCalendario");
  if (dados) {
    Object.assign(eventos, JSON.parse(dados));
  }
}

// ============================================================
// Bottom Sheet — abrir / fechar
// ============================================================
function abrirSheet(dia) {
  dataSelecionada = { dia, mes: mesVisualizado, ano: anoVisualizado };

  const dataObj = new Date(anoVisualizado, mesVisualizado, dia);
  const diaSemana = diasSemanaLabel[dataObj.getDay()];
  const label = `${diaSemana}, ${dia} de ${meses[mesVisualizado].toLowerCase()} de ${anoVisualizado}`;

  document.getElementById("sheet-data-selecionada").textContent = label;

  if (eventoEmEdicao) {
    document.getElementById("evento-titulo").value =
      eventoEmEdicao.titulo || "";
    document.getElementById("evento-valor").value = eventoEmEdicao.valor || "";
    document.getElementById("evento-local").value = eventoEmEdicao.local || "";
    document.getElementById("evento-nota").value = eventoEmEdicao.nota || "";
    document.getElementById("display-hora-inicio").textContent =
      eventoEmEdicao.horaInicio;
    document.getElementById("display-hora-fim").textContent =
      eventoEmEdicao.horaFim;
  } else {
    document.getElementById("evento-titulo").value = "";
    document.getElementById("evento-valor").value = "";
    document.getElementById("evento-local").value = "";
    document.getElementById("evento-nota").value = "";
    document.getElementById("display-hora-inicio").textContent = "08:00";
    document.getElementById("display-hora-fim").textContent = "09:00";
  }

  document.getElementById("bottom-sheet").classList.add("ativo");
  document.getElementById("overlay").classList.add("ativo");

  setTimeout(() => document.getElementById("evento-titulo").focus(), 300);
}

function fecharSheet() {
  document.getElementById("bottom-sheet").classList.remove("ativo");
  document.getElementById("overlay").classList.remove("ativo");
  dataSelecionada = null;
  eventoEmEdicao = null;
  // Esconde autocomplete
  document.getElementById("autocomplete-sugestoes").classList.remove("visivel");
}

// ============================================================
// Bottom Sheet — Visualização de eventos (quando já existem)
// ============================================================
function abrirSheetVisualizacao(dia) {
  dataSelecionada = { dia, mes: mesVisualizado, ano: anoVisualizado };
  const dataObj = new Date(anoVisualizado, mesVisualizado, dia);
  const diaSemana = diasSemanaLabel[dataObj.getDay()];
  const label = `${diaSemana}, ${dia} de ${meses[mesVisualizado].toLowerCase()} de ${anoVisualizado}`;

  document.getElementById("vis-data-selecionada").textContent = label;

  const chave = chaveData(dia, mesVisualizado, anoVisualizado);
  const lista = eventos[chave] || [];
  const container = document.getElementById("vis-lista-eventos");
  container.innerHTML = "";

  lista.forEach((ev) => {
    const card = document.createElement("div");
    card.classList.add("vis-evento-card");
    card.style.borderLeftColor = ev.cor;

    let wazeBtnHtml = "";
    if (ev.local) {
      const gmapsEncoded = encodeURIComponent(ev.local);
      wazeBtnHtml = `
        <a href="https://waze.com/ul?q=${gmapsEncoded}" target="_blank" class="vis-btn-waze">
          🚗 Ver Rota no Waze
        </a>
      `;
    }

    let valorHtml = "";
    if (ev.valor) {
      valorHtml = `<div class="vis-evento-detalhe">💰 R$ ${ev.valor}</div>`;
    }

    let localHtml = "";
    if (ev.local) {
      localHtml = `<div class="vis-evento-detalhe">📍 ${ev.local}</div>`;
    }

    card.innerHTML = `
      <div class="vis-evento-header">
        <div class="vis-evento-titulo">${ev.titulo || "Sem título"}</div>
        <div class="vis-evento-acoes">
          <button class="vis-btn-acao editar" onclick="editarEvento('${chave}', '${ev.id}')">✏️</button>
          <button class="vis-btn-acao excluir" onclick="excluirEvento('${chave}', '${ev.id}')">🗑️</button>
        </div>
      </div>
      <div class="vis-evento-horario">${ev.horaInicio} – ${ev.horaFim}</div>
      ${valorHtml}
      ${localHtml}
      ${wazeBtnHtml}
    `;
    container.appendChild(card);
  });

  document.getElementById("sheet-visualizacao").classList.add("ativo");
  document.getElementById("overlay").classList.add("ativo");
}

function fecharSheetVisualizacao() {
  document.getElementById("sheet-visualizacao").classList.remove("ativo");
  document.getElementById("overlay").classList.remove("ativo");
}

// ============================================================
// Edição e Exclusão de Eventos
// ============================================================
function editarEvento(chave, idDoEvento) {
  const lista = eventos[chave];
  const index = lista.findIndex((e) => String(e.id) === String(idDoEvento));

  if (index !== -1) {
    eventoEmEdicao = { chave, index, ...lista[index] };
    fecharSheetVisualizacao();

    // Extrai o dia da chave da data (YYYY-MM-DD -> [2])
    const partes = chave.split("-");
    const diaNum = parseInt(partes[2], 10);
    setTimeout(() => abrirSheet(diaNum), 250);
  }
}

function excluirEvento(chave, idDoEvento) {
  if (confirm("Deseja realmente excluir este evento?")) {
    const lista = eventos[chave];
    const index = lista.findIndex((e) => String(e.id) === String(idDoEvento));

    if (index !== -1) {
      lista.splice(index, 1);

      // Se a lista do dia esvaziar, limpa a chave
      if (lista.length === 0) {
        delete eventos[chave];
        fecharSheetVisualizacao();
      } else {
        // Se ainda sobrou eventos no dia, recarrega a visualização listada
        const partes = chave.split("-");
        abrirSheetVisualizacao(parseInt(partes[2], 10));
      }

      salvarDadosApp();
      renderCalendario();
    }
  }
}

// ============================================================
// Salvar / Carregar Dados (LocalStorage)
// ============================================================
function salvarDadosApp() {
  localStorage.setItem("eventosCalendario", JSON.stringify(eventos));
}

function carregarDadosApp() {
  const dados = localStorage.getItem("eventosCalendario");
  if (dados) {
    const parsed = JSON.parse(dados);
    Object.assign(eventos, parsed);
    // Garante que eventos antigos tenham ID
    Object.keys(eventos).forEach((chave) => {
      eventos[chave].forEach((ev) => {
        if (!ev.id)
          ev.id =
            Date.now().toString() + Math.random().toString(36).substr(2, 5);
      });
    });
    salvarDadosApp();
  }
}

// ============================================================
// Painel de Estatísticas
// ============================================================
function parseValorDinheiro(valorStr) {
  if (!valorStr) return 0;
  const limpo = valorStr.replace(/[^\d,-]/g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

function formatarDinheiro(num) {
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function atualizarDashboard() {
  let fatAno = 0;
  let fatMes = 0;
  let qtdAno = 0;
  let qtdMes = 0;

  const mesAtualFormatado = String(mesVisualizado + 1).padStart(2, "0");
  const anoAtualFoco = String(anoVisualizado);

  Object.keys(eventos).forEach((chave) => {
    // chave original: YYYY-MM-DD
    const partes = chave.split("-");
    const a = partes[0];
    const m = partes[1];
    const lista = eventos[chave];

    if (a === anoAtualFoco) {
      qtdAno += lista.length;
      const somaDia = lista.reduce(
        (acc, ev) => acc + parseValorDinheiro(ev.valor),
        0,
      );
      fatAno += somaDia;

      if (m === mesAtualFormatado) {
        qtdMes += lista.length;
        fatMes += somaDia;
      }
    }
  });

  document.getElementById("stats-label-mes").textContent =
    meses[mesVisualizado];
  document.getElementById("stats-fat-mes").textContent =
    formatarDinheiro(fatMes);
  document.getElementById("stats-fat-ano").textContent =
    formatarDinheiro(fatAno);
  document.getElementById("stats-qtd-mes").textContent = qtdMes;
  document.getElementById("stats-qtd-ano").textContent = qtdAno;
}

function abrirDashboard() {
  atualizarDashboard();
  document.getElementById("top-sheet-stats").classList.add("ativo");
  document.getElementById("overlay").classList.add("ativo");
}

function fecharDashboard() {
  document.getElementById("top-sheet-stats").classList.remove("ativo");
  document.getElementById("overlay").classList.remove("ativo");
}

// ============================================================
// Salvar evento
// ============================================================
function salvarEvento() {
  if (!dataSelecionada) return;

  const titulo = document.getElementById("evento-titulo").value.trim();
  const valor = document.getElementById("evento-valor").value.trim();
  const local = document.getElementById("evento-local").value.trim();
  const horaInicio = document.getElementById("display-hora-inicio").textContent;
  const horaFim = document.getElementById("display-hora-fim").textContent;
  const nota = document.getElementById("evento-nota").value.trim();
  const inputTitulo = document.getElementById("evento-titulo");

  if (!titulo) {
    inputTitulo.style.borderBottomColor = "#e53935";
    inputTitulo.focus();
    setTimeout(() => {
      inputTitulo.style.borderBottomColor = "";
    }, 1500);
    return;
  }

  const chave = chaveData(
    dataSelecionada.dia,
    dataSelecionada.mes,
    dataSelecionada.ano,
  );
  if (!eventos[chave]) eventos[chave] = [];

  if (eventoEmEdicao) {
    // Atualiza o evento existente preservando o ID e a Cor originais
    const updateEvent = eventos[eventoEmEdicao.chave][eventoEmEdicao.index];
    updateEvent.titulo = titulo;
    updateEvent.valor = valor;
    updateEvent.local = local;
    updateEvent.horaInicio = horaInicio;
    updateEvent.horaFim = horaFim;
    updateEvent.nota = nota;
  } else {
    // Criando evento novo
    const cor = corEvento(eventos[chave].length);
    const idUnico = Date.now().toString(); // ID baseado em timestamp
    eventos[chave].push({
      id: idUnico,
      titulo,
      valor,
      local,
      horaInicio,
      horaFim,
      nota,
      cor,
    });
  }

  salvarDadosApp();

  fecharSheet();
  renderCalendario();
}

// ============================================================
// Drum Picker Samsung
// ============================================================
const ITEM_H = 56; // altura de cada item em px

const drumState = {
  alvo: null, // "inicio" | "fim"
  hora: 8,
  minuto: 0,
};

function criarItens(track, total, pad) {
  track.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const div = document.createElement("div");
    div.classList.add("drum-item");
    div.textContent = String(i).padStart(pad, "0");
    track.appendChild(div);
  }
}

// O centro visual fica no slot 2 (visível 5 itens, centro = índice 2)
// Adicionamos padding virtual: 2 itens invisíveis acima e abaixo
const PADDING = 2;

// Altura da coluna do drum picker (deve ser igual ao CSS .drum-column height)
const DRUM_COL_H = 200;
// offset translateY quando o item de índice real 0 está centrado na coluna
// centro_coluna = DRUM_COL_H / 2 = 100
// item_i_top + ITEM_H/2 + T = 100  →  T = 100 - ITEM_H/2 - i*ITEM_H
// para i = PADDING (item real 0): DRUM_ORIGIN = 100 - 28 - PADDING*56 = 72 - 112 = -40
const DRUM_ORIGIN = (DRUM_COL_H - ITEM_H) / 2 - PADDING * ITEM_H;

function offsetParaIndice(T, total) {
  // T = DRUM_ORIGIN - idx * ITEM_H  →  idx = (DRUM_ORIGIN - T) / ITEM_H
  let idx = Math.round((DRUM_ORIGIN - T) / ITEM_H);
  return Math.max(0, Math.min(total - 1, idx));
}

function indiceParaOffset(idx) {
  // Offset correto para centrar o item real 'idx' na coluna
  return DRUM_ORIGIN - idx * ITEM_H;
}

function setTrackOffset(track, offset, animated) {
  if (!animated) {
    track.style.transition = "none";
    // force reflow
    track.getBoundingClientRect();
  } else {
    track.style.transition =
      "transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  }
  track.style.transform = `translateY(${offset}px)`;
}

function atualizarClasses(track, selectedIdx) {
  // selectedIdx é o índice real (0-23 ou 0-59);
  // no DOM, o item real fica na posição selectedIdx + PADDING
  const items = track.querySelectorAll(".drum-item");
  const domIdx = selectedIdx + PADDING;
  items.forEach((el, i) => {
    const diff = Math.abs(i - domIdx);
    el.classList.remove("selecionado", "adjacente", "distante");
    if (diff === 0) el.classList.add("selecionado");
    else if (diff === 1) el.classList.add("adjacente");
    else el.classList.add("distante");
  });
}

function snapParaIndice(track, idx, total) {
  const offset = indiceParaOffset(idx); // já inclui DRUM_ORIGIN correto
  setTrackOffset(track, offset, true);
  atualizarClasses(track, idx);
}

function inicializarDrum(track, total, pad, valorInicial) {
  // Cria os itens
  criarItens(track, total, pad);
  // Posiciona no valor inicial
  snapParaIndice(track, valorInicial, total);
}

// ---- Drag/Touch ----
function adicionarDragDrum(column, track, total, onMuda) {
  let startY = 0;
  let startOffset = 0;
  let currentIdx = 0;
  let isDragging = false;
  let velY = 0;
  let lastY = 0;
  let lastT = 0;

  function getOffset() {
    const mat = new WebKitCSSMatrix(getComputedStyle(track).transform);
    return mat.m42;
  }

  function clamp(offset) {
    const minOff = indiceParaOffset(total - 1); // T para último item centrado
    const maxOff = indiceParaOffset(0); // T para item 0 centrado
    return Math.max(minOff, Math.min(maxOff, offset));
  }

  function onStart(y) {
    isDragging = true;
    startY = y;
    startOffset = getOffset();
    velY = 0;
    lastY = y;
    lastT = Date.now();
    track.style.transition = "none";
  }

  function onMove(y) {
    if (!isDragging) return;
    const now = Date.now();
    const dt = now - lastT || 1;
    velY = (y - lastY) / dt;
    lastY = y;
    lastT = now;
    const newOffset = clamp(startOffset + y - startY);
    track.style.transform = `translateY(${newOffset}px)`;
    const idx = offsetParaIndice(newOffset, total);
    atualizarClasses(track, idx);
    currentIdx = idx;
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    // Inércia leve
    let offset = getOffset() + velY * 80;
    offset = clamp(offset);
    let idx = offsetParaIndice(offset, total);
    snapParaIndice(track, idx, total);
    currentIdx = idx;
    onMuda(idx);
  }

  // Mouse
  column.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onStart(e.clientY);
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) onMove(e.clientY);
  });
  document.addEventListener("mouseup", () => {
    if (isDragging) onEnd();
  });

  // Touch
  column.addEventListener(
    "touchstart",
    (e) => {
      onStart(e.touches[0].clientY);
    },
    { passive: true },
  );
  column.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      onMove(e.touches[0].clientY);
    },
    { passive: false },
  );
  column.addEventListener("touchend", onEnd);

  // Scroll roda do mouse
  column.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const offset = getOffset() - Math.sign(e.deltaY) * ITEM_H;
      const clamped = clamp(offset);
      const idx = offsetParaIndice(clamped, total);
      snapParaIndice(track, idx, total);
      currentIdx = idx;
      onMuda(idx);
    },
    { passive: false },
  );
}

// Funções inicializarDrum e criarItens mantidas mas não mais usadas diretamente
function criarItens(track, total, pad) {
  track.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const div = document.createElement("div");
    div.classList.add("drum-item");
    div.textContent = String(i).padStart(pad, "0");
    track.appendChild(div);
  }
}

function inicializarDrum(track, total, pad, valorInicial) {
  criarItens(track, total, pad);
  snapParaIndice(track, valorInicial, total);
}

// ---- Abrir/Fechar ----
function abrirDrum(alvo, hh, mm) {
  drumState.alvo = alvo;
  drumState.hora = hh;
  drumState.minuto = mm;

  const titleEl = document.getElementById("drum-title");
  titleEl.textContent =
    alvo === "inicio" ? "Horário de início" : "Horário de fim";

  const colH = document.getElementById("drum-horas");
  const colM = document.getElementById("drum-minutos");

  // Remove listeners antigos clonando os elementos
  const newColH = colH.cloneNode(false);
  newColH.id = "drum-horas";
  const newTrackH = document.createElement("div");
  newTrackH.classList.add("drum-track");
  newTrackH.id = "drum-track-horas";
  newColH.appendChild(newTrackH);

  const newColM = colM.cloneNode(false);
  newColM.id = "drum-minutos";
  const newTrackM = document.createElement("div");
  newTrackM.classList.add("drum-track");
  newTrackM.id = "drum-track-minutos";
  newColM.appendChild(newTrackM);

  colH.replaceWith(newColH);
  colM.replaceWith(newColM);

  // Cria itens com padding: PADDING slots vazios no topo e fim para centrar
  function construirTrack(track, total, digits) {
    track.innerHTML = "";
    // pads do topo
    for (let p = 0; p < PADDING; p++) {
      const d = document.createElement("div");
      d.classList.add("drum-item");
      track.appendChild(d);
    }
    // itens reais
    for (let i = 0; i < total; i++) {
      const d = document.createElement("div");
      d.classList.add("drum-item");
      d.textContent = String(i).padStart(digits, "0");
      d.dataset.value = i;
      track.appendChild(d);
    }
    // pads do fim
    for (let p = 0; p < PADDING; p++) {
      const d = document.createElement("div");
      d.classList.add("drum-item");
      track.appendChild(d);
    }
  }

  construirTrack(newTrackH, 24, 2);
  construirTrack(newTrackM, 60, 2);

  // Snap inicial (PADDING offset já embutido na estrutura de itens)
  snapParaIndice(newTrackH, hh, 24);
  snapParaIndice(newTrackM, mm, 60);

  adicionarDragDrum(newColH, newTrackH, 24, (idx) => {
    drumState.hora = idx;
  });
  adicionarDragDrum(newColM, newTrackM, 60, (idx) => {
    drumState.minuto = idx;
  });

  document.getElementById("drum-overlay").classList.add("ativo");
  document.getElementById("drum-overlay").setAttribute("aria-hidden", "false");
}

function fecharDrum() {
  document.getElementById("drum-overlay").classList.remove("ativo");
  document.getElementById("drum-overlay").setAttribute("aria-hidden", "true");
}

function confirmarDrum() {
  const h = String(drumState.hora).padStart(2, "0");
  const m = String(drumState.minuto).padStart(2, "0");
  const valor = `${h}:${m}`;
  if (drumState.alvo === "inicio") {
    document.getElementById("display-hora-inicio").textContent = valor;
  } else {
    document.getElementById("display-hora-fim").textContent = valor;
  }
  fecharDrum();
}

// ============================================================
// Autocomplete: Sugestões de Eventos Anteriores
// ============================================================
function obterEventosUnicos() {
  const map = new Map();
  Object.values(eventos).forEach((lista) => {
    lista.forEach((ev) => {
      if (!ev.titulo) return;
      const chave = ev.titulo.toLowerCase();
      const existente = map.get(chave);
      if (!existente) {
        map.set(chave, ev);
      } else {
        // Prefere a versão mais completa (com mais campos preenchidos)
        const camposNovo = [ev.valor, ev.local, ev.nota].filter(Boolean).length;
        const camposAntigo = [
          existente.valor,
          existente.local,
          existente.nota,
        ].filter(Boolean).length;
        if (camposNovo > camposAntigo) {
          map.set(chave, ev);
        }
      }
    });
  });
  return Array.from(map.values());
}

function buscarSugestoes(texto) {
  if (!texto || texto.length < 2) return [];
  const lower = texto.toLowerCase();
  return obterEventosUnicos()
    .filter(
      (ev) =>
        ev.titulo.toLowerCase().includes(lower) ||
        (ev.local && ev.local.toLowerCase().includes(lower)),
    )
    .slice(0, 5);
}

function renderizarSugestoes(sugestoes) {
  const container = document.getElementById("autocomplete-sugestoes");
  container.innerHTML = "";

  if (sugestoes.length === 0) {
    container.classList.remove("visivel");
    return;
  }

  sugestoes.forEach((ev) => {
    const item = document.createElement("div");
    item.classList.add("autocomplete-item");

    let infoParts = [];
    if (ev.valor) infoParts.push(`R$ ${ev.valor}`);
    if (ev.local) infoParts.push(ev.local);

    item.innerHTML = `
      <div class="autocomplete-item-titulo">${ev.titulo}</div>
      ${infoParts.length ? `<div class="autocomplete-item-info">${infoParts.join(" • ")}</div>` : ""}
    `;

    item.addEventListener("click", () => {
      document.getElementById("evento-titulo").value = ev.titulo;
      document.getElementById("evento-valor").value = ev.valor || "";
      document.getElementById("evento-local").value = ev.local || "";
      document.getElementById("evento-nota").value = ev.nota || "";
      if (ev.horaInicio)
        document.getElementById("display-hora-inicio").textContent =
          ev.horaInicio;
      if (ev.horaFim)
        document.getElementById("display-hora-fim").textContent = ev.horaFim;
      container.classList.remove("visivel");
    });

    container.appendChild(item);
  });

  container.classList.add("visivel");
}

// ============================================================
// Inicialização
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosApp(); // Restaura dados do LocalStorage (se existirem)

  const hoje = new Date();
  mesVisualizado = hoje.getMonth();
  anoVisualizado = hoje.getFullYear();

  document
    .getElementById("btn-anterior")
    .addEventListener("click", mesAnterior);
  document.getElementById("btn-proximo").addEventListener("click", proximoMes);
  // Botões do formulário
  document
    .getElementById("btn-cancelar")
    .addEventListener("click", fecharSheet);
  document.getElementById("btn-salvar").addEventListener("click", salvarEvento);
  document
    .getElementById("btn-adicionar-novo-evento")
    .addEventListener("click", () => {
      const diaBackup = dataSelecionada ? dataSelecionada.dia : null;
      fecharSheetVisualizacao();
      if (diaBackup !== null) {
        setTimeout(() => abrirSheet(diaBackup), 250);
      }
    });

  // Fecha qualquer sheet clicando no overlay
  document.getElementById("overlay").addEventListener("click", () => {
    fecharSheet();
    fecharSheetVisualizacao();
    fecharDashboard();
  });

  // Botões do Dashboard
  document
    .getElementById("btn-stats")
    .addEventListener("click", abrirDashboard);
  document
    .getElementById("btn-fechar-stats")
    .addEventListener("click", fecharDashboard);

  // Botões de horário
  document.getElementById("btn-hora-inicio").addEventListener("click", () => {
    const [h, m] = document
      .getElementById("display-hora-inicio")
      .textContent.split(":")
      .map(Number);
    abrirDrum("inicio", h, m);
  });
  document.getElementById("btn-hora-fim").addEventListener("click", () => {
    const [h, m] = document
      .getElementById("display-hora-fim")
      .textContent.split(":")
      .map(Number);
    abrirDrum("fim", h, m);
  });

  // Drum picker actions
  document.getElementById("drum-cancel").addEventListener("click", fecharDrum);
  document.getElementById("drum-ok").addEventListener("click", confirmarDrum);

  // Autocomplete no campo de título
  const inputTituloAC = document.getElementById("evento-titulo");
  inputTituloAC.addEventListener("input", (e) => {
    if (eventoEmEdicao) return; // Não mostra sugestões ao editar
    const sugestoes = buscarSugestoes(e.target.value);
    renderizarSugestoes(sugestoes);
  });

  // Fecha autocomplete ao clicar fora
  document.addEventListener("click", (e) => {
    const container = document.getElementById("autocomplete-sugestoes");
    if (!e.target.closest(".sheet-campo")) {
      container.classList.remove("visivel");
    }
  });

  renderCalendario();
});
