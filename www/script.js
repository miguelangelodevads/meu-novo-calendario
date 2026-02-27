// --- 1. DADOS E ESTADO ---
let events = JSON.parse(localStorage.getItem("my_cal_events")) || [
  {
    id: 1,
    title: "Turatti Rádio Tr",
    date: "2026-01-14",
    isAllDay: false,
    startTime: "21:00",
    endTime: "23:00",
    location: "Vila Galé",
    value: 250,
    colorHex: "#28a745",
  },
];

// Normalização das datas
events = events.map((e) => ({ ...e, dateObj: new Date(e.date + "T12:00:00") }));

let currentDate = new Date();
let selectedDate = new Date();
let editingDate = new Date();
let pickerDisplayDate = new Date();
let editingId = null;
let currentViewingEvent = null;
let isAllDay = false;
let activeTimeField = null;

const colors = [
  "#007bff",
  "#dc3545",
  "#e83e8c",
  "#fd7e14",
  "#ffc107",
  "#28a745",
  "#20c997",
  "#6f42c1",
  "#6c757d",
];
let activeColorHex = colors[0];

const $ = (id) => document.getElementById(id);
const formatMoney = (val) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    val,
  );
const isSameDay = (d1, d2) =>
  d1 &&
  d2 &&
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();
const monthsShort = [
  "JAN.",
  "FEV.",
  "MAR.",
  "ABR.",
  "MAI.",
  "JUN.",
  "JUL.",
  "AGO.",
  "SET.",
  "OUT.",
  "NOV.",
  "DEZ.",
];
const monthsLong = [
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
const weekdaysLong = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// --- 2. SIDEBAR ---
function toggleSidebar() {
  const overlay = $("sidebar-overlay");
  const menu = $("sidebar-menu");
  if (overlay.classList.contains("hidden")) {
    overlay.classList.remove("hidden");
    setTimeout(
      () => menu.classList.replace("-translate-x-full", "translate-x-0"),
      10,
    );
  } else {
    menu.classList.replace("translate-x-0", "-translate-x-full");
    setTimeout(() => overlay.classList.add("hidden"), 300);
  }
}

// --- 3. RENDERIZAÇÃO ---
function renderUI() {
  $("current-month-name").textContent = monthsShort[currentDate.getMonth()];
  // Sincronização do número do mês no quadrado no topo
  $("current-month-number").textContent = currentDate.getMonth() + 1;

  const monthEvents = events.filter((e) => {
    const d = e.dateObj;
    return (
      d.getMonth() === currentDate.getMonth() &&
      d.getFullYear() === currentDate.getFullYear()
    );
  });
  const total = monthEvents.reduce((acc, curr) => acc + (curr.value || 0), 0);
  $("monthly-total-badge").textContent = formatMoney(total);

  renderMonth(
    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    $("month-prev"),
  );
  renderMonth(new Date(currentDate), $("month-curr"));
  renderMonth(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    $("month-next"),
  );

  const toStore = events.map((e) => {
    const { dateObj, ...rest } = e;
    return rest;
  });
  localStorage.setItem("my_cal_events", JSON.stringify(toStore));
  lucide.createIcons();
}

function renderMonth(base, container) {
  container.innerHTML = "";
  const y = base.getFullYear(),
    m = base.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startDay = new Date(y, m, 1).getDay();
  const prevDays = new Date(y, m, 0).getDate();

  for (let i = startDay - 1; i >= 0; i--)
    createDayCell(prevDays - i, true, false, null, container);
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(y, m, i);
    createDayCell(i, false, d.getDay() === 0, d, container);
  }
  for (let i = 1; i <= 42 - (startDay + daysInMonth); i++)
    createDayCell(i, true, false, null, container);
}

function createDayCell(num, dim, sun, fullDate, container) {
  const d = document.createElement("div");
  d.className = `relative p-[2px] flex flex-col cursor-pointer border-t border-white/5 h-full min-h-[70px] ${
    dim ? "opacity-20" : ""
  }`;

  if (fullDate) {
    const today = new Date();
    const isToday = isSameDay(fullDate, today);

    d.onclick = () => {
      // LÓGICA DE CLIQUE CORRIGIDA: 1º Seleciona, 2º Abre SEMPRE o Card de Resumo
      if (selectedDate && isSameDay(selectedDate, fullDate)) {
        openDaySummary(fullDate);
      } else {
        selectedDate = fullDate;
        if (dim) {
          currentDate = new Date(
            fullDate.getFullYear(),
            fullDate.getMonth(),
            1,
          );
        }
        renderUI();
      }
    };

    // Marcador de seleção (Borda Branca)
    if (selectedDate && isSameDay(fullDate, selectedDate) && !dim) {
      d.innerHTML = `<div class="absolute inset-0 border-[1.5px] border-white rounded-[12px] z-10 pointer-events-none"></div>`;
    }

    // Bolinha branca para "Hoje"
    if (isToday && !dim) {
      const dot = document.createElement("div");
      dot.className = "today-dot";
      setTimeout(() => d.appendChild(dot), 0);
    }
  }

  const n = document.createElement("div");
  n.className = `w-full text-center text-[13px] font-normal py-[1px] ${
    sun && !dim ? "text-red-500" : "text-white"
  }`;
  n.textContent = num;
  d.appendChild(n);

  if (fullDate && !dim) {
    const dayEvs = events.filter((e) => isSameDay(e.dateObj, fullDate));
    const list = document.createElement("div");
    list.className = "flex flex-col gap-[2px] overflow-hidden px-[1px]";
    dayEvs.slice(0, 4).forEach((e) => {
      const el = document.createElement("div");
      el.className = `event-word-wrap font-medium ${
        e.isAllDay
          ? "text-white px-1 rounded-[3px]"
          : "text-gray-300 border-l-[3px]"
      }`;
      if (e.isAllDay) el.style.backgroundColor = e.colorHex;
      else el.style.borderColor = e.colorHex;

      // Quebra por palavra (Espaço)
      const words = e.title.split(" ");
      el.innerHTML = words.join("<br>");

      // REMOVIDO: O clique direto no evento foi removido.
      // Agora o clique em cima do evento cai no d.onclick (que seleciona a data ou abre o card)
      // Permitindo ver múltiplos eventos ou adicionar um novo no card de resumo.

      list.appendChild(el);
    });
    d.appendChild(list);
  }
  container.appendChild(d);
}

// --- 4. SWIPE ---
let touchStartX = 0,
  isDragging = false;
const track = $("calendar-track"),
  viewport = $("calendar-viewport");
viewport.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
    track.style.transition = "none";
  },
  { passive: true },
);
viewport.addEventListener(
  "touchmove",
  (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchStartX;
    track.style.transform = `translateX(${
      -33.3333 + (dx / viewport.clientWidth) * 100
    }%)`;
  },
  { passive: true },
);
viewport.addEventListener("touchend", (e) => {
  if (!isDragging) return;
  isDragging = false;
  const dx = e.changedTouches[0].clientX - touchStartX;
  track.style.transition = "transform 0.4s ease-out";
  if (dx > 70) {
    track.style.transform = `translateX(0%)`;
    setTimeout(() => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      track.style.transition = "none";
      track.style.transform = "translateX(-33.3333%)";
      renderUI();
    }, 400);
  } else if (dx < -70) {
    track.style.transform = `translateX(-66.6666%)`;
    setTimeout(() => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      track.style.transition = "none";
      track.style.transform = "translateX(-33.3333%)";
      renderUI();
    }, 400);
  } else track.style.transform = `translateX(-33.3333%)`;
});

// --- 5. FORMULÁRIO & SUGESTÕES ---
function openForm(data = null, isDup = false) {
  $("time-spinner-container").classList.add("hidden");
  activeTimeField = null;
  $("suggestion-box").style.display = "none";
  $("color-picker").classList.add("hidden");

  if (data && (data.id || data.title)) {
    // EDIÇÃO OU DUPLICAÇÃO - CARREGA TODOS OS DADOS
    editingId = isDup ? null : data.id;
    editingDate = data.dateObj
      ? new Date(data.dateObj)
      : new Date(selectedDate);
    $("modal-title").value = data.title || "";
    $("modal-value").value = data.value || "";
    $("modal-location").value = data.location || "";
    $("label-time-start").textContent = data.startTime || "08:00";
    $("label-time-end").textContent = data.endTime || "09:00";
    isAllDay = !!data.isAllDay;
    activeColorHex = data.colorHex || colors[0];
    $("color-trigger").style.backgroundColor = activeColorHex;
  } else {
    // NOVO
    editingId = null;
    editingDate = new Date(selectedDate);
    $("modal-title").value = "";
    $("modal-value").value = "";
    $("modal-location").value = "";
    $("label-time-start").textContent = "08:00";
    $("label-time-end").textContent = "09:00";
    isAllDay = false;
    activeColorHex = colors[0];
    $("color-trigger").style.backgroundColor = colors[0];
  }
  updateFormDateDisplay();
  updateToggleUI();
  checkSaveBtn();
  $("add-modal").classList.remove("hidden");
}

function handleTitleInput() {
  checkSaveBtn();
  const val = $("modal-title").value.toLowerCase();
  const box = $("suggestion-box");
  if (val.length < 2) {
    box.style.display = "none";
    return;
  }

  const unique = [...new Set(events.map((e) => e.title))];
  const filtered = unique
    .filter((t) => t.toLowerCase().includes(val))
    .slice(0, 3);

  if (filtered.length > 0) {
    box.innerHTML = filtered
      .map(
        (t) =>
          `<div class="suggestion-item" onclick="applySuggestion('${t}')">${t}</div>`,
      )
      .join("");
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function applySuggestion(t) {
  const last = [...events].reverse().find((e) => e.title === t);
  if (last) {
    $("modal-title").value = last.title;
    $("modal-value").value = last.value || "";
    $("modal-location").value = last.location || "";
    $("label-time-start").textContent = last.startTime || "08:00";
    $("label-time-end").textContent = last.endTime || "09:00";
    activeColorHex = last.colorHex || colors[0];
    $("color-trigger").style.backgroundColor = activeColorHex;
  }
  $("suggestion-box").style.display = "none";
  checkSaveBtn();
}

function saveEvent() {
  const iso = editingDate.toISOString().split("T")[0];
  const obj = {
    title: $("modal-title").value,
    date: iso,
    dateObj: new Date(iso + "T12:00:00"),
    startTime: $("label-time-start").textContent,
    endTime: $("label-time-end").textContent,
    value: parseFloat($("modal-value").value) || 0,
    location: $("modal-location").value,
    isAllDay: isAllDay,
    colorHex: activeColorHex,
    isPaid: false,
  };
  if (editingId) {
    const i = events.findIndex((e) => e.id === editingId);
    if (i > -1) {
      obj.isPaid = events[i].isPaid || false;
      events[i] = { ...events[i], ...obj };
    }
  } else {
    events.push({ id: Date.now(), ...obj });
  }
  renderUI();
  closeForm();
}

// --- BUSCA ---
function toggleSearch(show) {
  $("search-modal").classList.toggle("hidden", !show);
  if (show) {
    $("search-input").value = "";
    $("search-results").innerHTML = "";
    $("search-input").focus();
  }
}

function clearSearch() {
  $("search-input").value = "";
  handleSearch();
}

function handleSearch() {
  const val = $("search-input").value.toLowerCase();
  const results = $("search-results");
  results.innerHTML = "";
  if (!val) return;

  const filtered = events.filter((e) => e.title.toLowerCase().includes(val));
  filtered.forEach((e) => {
    const d = document.createElement("div");
    d.className =
      "p-4 bg-[#2c2c2e] rounded-3xl flex justify-between items-center mb-2 active:bg-[#3a3a3c]";
    d.onclick = () => {
      toggleSearch(false);
      openView(e);
    };
    d.innerHTML = `
            <div class="flex-1">
                <div class="text-white font-medium text-lg">${e.title}</div>
                <div class="text-gray-500 text-sm">${new Date(
                  e.date + "T12:00:00",
                ).toLocaleDateString()} • ${e.startTime}</div>
            </div>
            <i data-lucide="chevron-right" class="text-gray-700"></i>
        `;
    results.appendChild(d);
  });
  lucide.createIcons();
}

// --- OUTROS ---
function openDaySummary(date) {
  $("summary-day-number").textContent = date.getDate();
  $("summary-weekday").textContent = weekdaysLong[date.getDay()];
  const list = $("summary-events-list");
  list.innerHTML = "";
  const dayEvs = events.filter((e) => isSameDay(e.dateObj, date));
  if (!dayEvs.length)
    list.innerHTML =
      '<div class="text-gray-500 text-center py-12 italic text-sm">Sem eventos</div>';
  else
    dayEvs.forEach((e) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center gap-5 p-4 active:bg-white/5 rounded-2xl cursor-pointer";
      row.onclick = () => {
        closeSummary();
        openView(e);
      };
      row.innerHTML = `<span class="text-xs text-gray-500 w-10 text-right font-medium">${e.startTime}</span><div class="w-1.5 h-4 rounded-full" style="background:${e.colorHex}"></div><span class="flex-1 truncate text-white text-[17px] font-medium">${e.title}</span>`;
      list.appendChild(row);
    });
  $("day-summary-overlay").classList.remove("hidden");
}
function closeSummary(e) {
  if (e && e.target !== $("day-summary-overlay")) return;
  $("day-summary-overlay").classList.add("hidden");
}
function openFormFromSummary() {
  const t = $("summary-input").value;
  closeSummary();
  openForm(t ? { title: t } : null);
}

function openView(e) {
  currentViewingEvent = e;
  $("view-title").textContent = e.title;
  $("view-color-dot").style.backgroundColor = e.colorHex;
  const ds = e.dateObj.toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  $("view-start-date").textContent = ds;
  $("view-end-date").textContent = ds;
  $("view-start-time").textContent = e.startTime;
  $("view-end-time").textContent = e.endTime;
  if (e.location) {
    $("view-location-container").classList.remove("hidden");
    $("view-location-text").textContent = e.location;
  } else $("view-location-container").classList.add("hidden");
  if (e.value) {
    $("view-value-container").classList.remove("hidden");
    $("view-value-text").textContent = formatMoney(e.value);
    updateViewStatusUI(e.isPaid);
  } else $("view-value-container").classList.add("hidden");
  $("event-details-view").classList.remove("hidden");
  lucide.createIcons();
}

function updateViewStatusUI(isPaid) {
  const btn = $("view-status-toggle");
  const iconBox = $("view-status-icon");
  const checkIcon = $("view-status-check");
  const label = $("view-status-label");

  if (isPaid) {
    btn.className =
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border border-green-500 bg-green-900/30 text-green-400";
    iconBox.className =
      "w-4 h-4 rounded-full bg-green-500 flex items-center justify-center";
    checkIcon.classList.remove("hidden");
    label.textContent = "Recebido";
  } else {
    btn.className =
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border border-red-500 bg-red-900/30 text-red-400";
    iconBox.className =
      "w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center";
    checkIcon.classList.add("hidden");
    label.textContent = "Não Pago";
  }
}

function toggleCurrentEventStatus() {
  if (!currentViewingEvent) return;
  currentViewingEvent.isPaid = !currentViewingEvent.isPaid;
  updateViewStatusUI(currentViewingEvent.isPaid);

  const i = events.findIndex((ev) => ev.id === currentViewingEvent.id);
  if (i > -1) {
    events[i] = { ...events[i], isPaid: currentViewingEvent.isPaid };
    renderUI();
  }
}

function closeEventDetails() {
  $("event-details-view").classList.add("hidden");
}
function duplicateEvent() {
  closeEventDetails();
  openForm(currentViewingEvent, true);
}
function editEvent() {
  closeEventDetails();
  openForm(currentViewingEvent);
}
function deleteEvent() {
  if (confirm("Excluir?")) {
    events = events.filter((e) => e.id !== currentViewingEvent.id);
    renderUI();
    closeEventDetails();
  }
}
function openWaze() {
  if (currentViewingEvent?.location)
    window.open(
      `https://waze.com/ul?q=${encodeURIComponent(
        currentViewingEvent.location,
      )}&navigate=yes`,
    );
}

function openCustomDatePicker() {
  pickerDisplayDate = new Date(editingDate);
  renderPickerGrid();
  $("custom-date-picker").classList.remove("hidden");
}
function closeCustomDatePicker(e) {
  if (e && e.target !== $("custom-date-picker")) return;
  $("custom-date-picker").classList.add("hidden");
}
function changePickerMonth(off) {
  pickerDisplayDate.setMonth(pickerDisplayDate.getMonth() + off);
  renderPickerGrid();
}
function renderPickerGrid() {
  $("picker-month-year").textContent = `${
    monthsLong[pickerDisplayDate.getMonth()]
  } ${pickerDisplayDate.getFullYear()}`;
  const grid = $("picker-grid");
  grid.innerHTML = "";
  const start = new Date(
    pickerDisplayDate.getFullYear(),
    pickerDisplayDate.getMonth(),
    1,
  ).getDay();
  const total = new Date(
    pickerDisplayDate.getFullYear(),
    pickerDisplayDate.getMonth() + 1,
    0,
  ).getDate();
  for (let i = 0; i < start; i++)
    grid.appendChild(document.createElement("div"));
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("div");
    const isS =
      i === editingDate.getDate() &&
      pickerDisplayDate.getMonth() === editingDate.getMonth();
    btn.className = `h-14 w-14 flex items-center justify-center rounded-full m-auto text-lg cursor-pointer ${
      isS
        ? "bg-blue-600 text-white font-bold shadow-lg scale-105"
        : "text-gray-300 active:bg-white/10"
    }`;
    btn.textContent = i;
    btn.onclick = () => {
      editingDate = new Date(
        pickerDisplayDate.getFullYear(),
        pickerDisplayDate.getMonth(),
        i,
      );
      updateFormDateDisplay();
      $("custom-date-picker").classList.add("hidden");
    };
    grid.appendChild(btn);
  }
}
function updateFormDateDisplay() {
  const s = editingDate.toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  $("label-date-start").textContent = s;
  $("label-date-end").textContent = s;
}
function toggleAllDay() {
  isAllDay = !isAllDay;
  updateToggleUI();
}
function updateToggleUI() {
  $("toggle-circle").style.transform = isAllDay
    ? "translateX(22px)"
    : "translateX(0)";
  $("toggle-allday").style.backgroundColor = isAllDay ? "#3b82f6" : "#4b5563";
}
function closeForm() {
  $("add-modal").classList.add("hidden");
}
function checkSaveBtn() {
  $("btn-save").disabled = !$("modal-title").value.trim();
}
function toggleTimeSpinner(type) {
  if (
    activeTimeField === type &&
    !$("time-spinner-container").classList.contains("hidden")
  ) {
    $("time-spinner-container").classList.add("hidden");
    activeTimeField = null;
  } else {
    activeTimeField = type;
    $("time-spinner-container").classList.remove("hidden");
    const timeText =
      type === "start"
        ? $("label-time-start").textContent
        : $("label-time-end").textContent;
    if (timeText) {
      const parts = timeText.split(":");
      if (parts.length === 2) {
        $("spinner-hours").scrollTop = parseInt(parts[0], 10) * 50;
        $("spinner-minutes").scrollTop = (parseInt(parts[1], 10) / 5) * 50;
      }
    }
  }
}
function updateTimeFromSpinner() {
  const h = Math.round($("spinner-hours").scrollTop / 50),
    m = Math.round($("spinner-minutes").scrollTop / 50) * 5;
  const t = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  if (activeTimeField === "start") $("label-time-start").textContent = t;
  else $("label-time-end").textContent = t;
}

// --- COLOR GRID ---
function toggleColorPicker(e) {
  e.stopPropagation();
  $("color-picker").classList.toggle("hidden");
}
function initColorGrid() {
  const cp = $("color-picker");
  colors.forEach((c) => {
    const b = document.createElement("div");
    b.className = `w-10 h-10 rounded-full border border-black/20 cursor-pointer active:scale-90 shadow-sm`;
    b.style.backgroundColor = c;
    b.onclick = () => {
      activeColorHex = c;
      $("color-trigger").style.backgroundColor = c;
      cp.classList.add("hidden");
    };
    cp.appendChild(b);
  });
  document.addEventListener("click", (e) => {
    if (!$("color-trigger").contains(e.target) && !cp.contains(e.target))
      cp.classList.add("hidden");
  });
}

window.onload = () => {
  const hS = $("spinner-hours"),
    mS = $("spinner-minutes");
  for (let i = 0; i < 24; i++) {
    const d = document.createElement("div");
    d.className =
      "h-[50px] flex items-center justify-center snap-center text-gray-500 text-xl font-light";
    d.textContent = i.toString().padStart(2, "0");
    hS.appendChild(d);
  }
  for (let i = 0; i < 60; i += 5) {
    const d = document.createElement("div");
    d.className =
      "h-[50px] flex items-center justify-center snap-center text-gray-500 text-xl font-light";
    d.textContent = i.toString().padStart(2, "0");
    mS.appendChild(d);
  }
  initColorGrid();
  renderUI();
};

function openStatsModal() {
  $("stats-modal").classList.remove("hidden");
  const total = events
    .filter((e) => e.dateObj.getFullYear() === currentDate.getFullYear())
    .reduce((a, c) => a + (c.value || 0), 0);
  $("stats-total-year").textContent = formatMoney(total);
  const list = $("stats-month-list");
  list.innerHTML = "";
  monthsLong.forEach((m, i) => {
    const val = events
      .filter(
        (e) =>
          e.dateObj.getMonth() === i &&
          e.dateObj.getFullYear() === currentDate.getFullYear(),
      )
      .reduce((a, c) => a + (c.value || 0), 0);
    list.innerHTML += `<div class="flex justify-between p-6 border-b border-white/5 last:border-none text-white font-medium"><span class="${
      i === currentDate.getMonth() ? "text-white font-bold" : "text-gray-400"
    }">${m}</span><span class="${
      val > 0 ? "text-green-400 font-bold" : "text-gray-600"
    }">${formatMoney(val)}</span></div>`;
  });
}
function closeStatsModal() {
  $("stats-modal").classList.add("hidden");
}

function getStartOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
}
function getEndOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() + (6 - day);
  return new Date(date.setDate(diff)).setHours(23, 59, 59, 999);
}

function openFinancialSummaryModal() {
  $("financial-summary-modal").classList.remove("hidden");
  updateFinancialSummary();
}

function closeFinancialSummaryModal() {
  $("financial-summary-modal").classList.add("hidden");
}

function toggleEventStatusFromSummary(id) {
  const i = events.findIndex((ev) => ev.id === id);
  if (i > -1) {
    events[i].isPaid = !events[i].isPaid;
    renderUI();
    updateFinancialSummary();
  }
}

function updateFinancialSummary() {
  const startMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getTime();
  const endMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  ).getTime();

  const today = new Date();
  const startWeek = getStartOfWeek(today);
  const endWeek = getEndOfWeek(today);

  let monthPending = 0;
  let monthPaid = 0;
  let weekPending = 0;
  let weekPaid = 0;

  const pendingMonthEvents = [];
  const pendingWeekEvents = [];

  events.forEach((e) => {
    const time = e.dateObj.getTime();
    const val = e.value || 0;

    if (time >= startMonth && time <= endMonth) {
      if (e.isPaid) {
        monthPaid += val;
      } else {
        monthPending += val;
        if (val > 0) pendingMonthEvents.push(e);
      }
    }

    if (time >= startWeek && time <= endWeek) {
      if (e.isPaid) {
        weekPaid += val;
      } else {
        weekPending += val;
        if (val > 0) pendingWeekEvents.push(e);
      }
    }
  });

  $("fin-month-pending").textContent = formatMoney(monthPending);
  $("fin-month-paid").textContent = formatMoney(monthPaid);
  $("fin-week-pending").textContent = formatMoney(weekPending);
  $("fin-week-paid").textContent = formatMoney(weekPaid);

  const listMonth = $("fin-pending-month-list");
  if (listMonth) {
    listMonth.innerHTML = "";

    if (pendingMonthEvents.length === 0) {
      listMonth.innerHTML =
        '<div class="text-gray-500 text-center py-8 italic text-sm">Nenhum valor a receber</div>';
    } else {
      pendingMonthEvents.sort((a, b) => a.dateObj - b.dateObj);

      pendingMonthEvents.forEach((e) => {
        const ds = e.dateObj.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
        });

        const row = document.createElement("div");
        row.className =
          "flex justify-between items-center p-5 border-b border-white/5 last:border-none";

        row.innerHTML = `
                <div class="flex-1 overflow-hidden pr-3">
                    <div class="text-white font-medium truncate">${
                      e.title
                    }</div>
                    <div class="text-gray-500 text-sm mt-0.5">${ds} • ${formatMoney(
          e.value,
        )}</div>
                </div>
                <button
                  onclick="toggleEventStatusFromSummary(${e.id})"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border border-red-500 bg-red-900/30 text-red-400 active:scale-95 transition-transform shrink-0"
                >
                  <div class="w-3.5 h-3.5 rounded-full border-2 border-red-500 flex items-center justify-center"></div>
                  Não Pago
                </button>
              `;
        listMonth.appendChild(row);
      });
    }
  }

  const listWeek = $("fin-pending-week-list");
  if (listWeek) {
    listWeek.innerHTML = "";

    if (pendingWeekEvents.length === 0) {
      listWeek.innerHTML =
        '<div class="text-gray-500 text-center py-8 italic text-sm">Nenhum valor a receber</div>';
    } else {
      pendingWeekEvents.sort((a, b) => a.dateObj - b.dateObj);

      pendingWeekEvents.forEach((e) => {
        const ds = e.dateObj
          .toLocaleDateString("pt-PT", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          })
          .replace(".", "");

        const row = document.createElement("div");
        row.className =
          "flex justify-between items-center p-5 border-b border-white/5 last:border-none";

        row.innerHTML = `
                <div class="flex-1 overflow-hidden pr-3">
                    <div class="text-white font-medium truncate">${
                      e.title
                    }</div>
                    <div class="text-gray-500 text-sm mt-0.5 capitalize">${ds} • ${formatMoney(
          e.value,
        )}</div>
                </div>
                <button
                  onclick="toggleEventStatusFromSummary(${e.id})"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border border-red-500 bg-red-900/30 text-red-400 active:scale-95 transition-transform shrink-0"
                >
                  <div class="w-3.5 h-3.5 rounded-full border-2 border-red-500 flex items-center justify-center"></div>
                  Não Pago
                </button>
              `;
        listWeek.appendChild(row);
      });
    }
  }
}

// --- SHARE ---
function shareEvent() {
  if (!currentViewingEvent) return;
  const e = currentViewingEvent;
  const ds = e.dateObj.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const text = `Evento: ${e.title}\nData: ${ds}\nHora: ${e.startTime} às ${
    e.endTime
  }${e.location ? "\nLocal: " + e.location : ""}`;

  const payload = {
    title: e.title,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
    location: e.location,
    value: e.value,
    colorHex: e.colorHex,
    isAllDay: e.isAllDay,
  };
  const b64 = btoa(encodeURIComponent(JSON.stringify(payload)));
  const appLink = `https://agendapro.app/share?data=${b64}`;

  const callbackName = "isgd_" + Math.round(100000 * Math.random());
  const script = document.createElement("script");

  window[callbackName] = function (data) {
    cleanup();
    const finalLink = data.shorturl ? data.shorturl : appLink;
    const shareText = `${text}\n\nSalvar no app:\n${finalLink}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      "_blank",
    );
  };

  script.onerror = function () {
    cleanup();
    const shareText = `${text}\n\nSalvar no app:\n${appLink}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      "_blank",
    );
  };

  function cleanup() {
    delete window[callbackName];
    if (script.parentNode) document.body.removeChild(script);
  }

  script.src = `https://is.gd/create.php?format=json&url=${encodeURIComponent(
    appLink,
  )}&callback=${callbackName}`;
  document.body.appendChild(script);
}

// --- BACKUP / RESTORE ---
function exportBackup() {
  const data = localStorage.getItem("my_cal_events");
  const blob = new Blob([data || "[]"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calendario_backup_${
    new Date().toISOString().split("T")[0]
  }.json`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toggleSidebar();
}

function importBackup() {
  $("backup-input").click();
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedEvents = JSON.parse(e.target.result);
      if (Array.isArray(importedEvents)) {
        localStorage.setItem("my_cal_events", JSON.stringify(importedEvents));
        events = importedEvents.map((ev) => ({
          ...ev,
          dateObj: new Date(ev.date + "T12:00:00"),
        }));
        renderUI();
        alert("Backup restaurado com sucesso!");
      } else {
        alert("Arquivo de backup inválido.");
      }
    } catch (err) {
      alert("Erro ao ler o arquivo de backup: " + err);
    }
  };
  reader.readAsText(file);
  toggleSidebar();
  event.target.value = ""; // clean up input file value
}

// --- DEEP LINK / SHARE IMPORT ---
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const dataB64 = params.get("data");
  if (dataB64) {
    try {
      const dataStr = decodeURIComponent(atob(dataB64));
      const payload = JSON.parse(dataStr);
      payload.dateObj = new Date(payload.date + "T12:00:00");
      setTimeout(() => openForm(payload, true), 500); // true for duplicate (creates new, doesn't edit existing)
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error("Invalid share data:", err);
    }
  }
});

// --- ANDROID BACK BUTTON ---
function handleAppBackButton() {
  let handled = false;
  if (!$("custom-date-picker").classList.contains("hidden")) {
    closeCustomDatePicker(null);
    handled = true;
  } else if (!$("color-picker").classList.contains("hidden")) {
    $("color-picker").classList.add("hidden");
    handled = true;
  } else if (!$("add-modal").classList.contains("hidden")) {
    closeForm();
    handled = true;
  } else if (!$("event-details-view").classList.contains("hidden")) {
    closeEventDetails();
    handled = true;
  } else if (!$("day-summary-overlay").classList.contains("hidden")) {
    closeSummary();
    handled = true;
  } else if (!$("search-modal").classList.contains("hidden")) {
    toggleSearch(false);
    handled = true;
  } else if (!$("stats-modal").classList.contains("hidden")) {
    closeStatsModal();
    handled = true;
  } else if (!$("financial-summary-modal").classList.contains("hidden")) {
    closeFinancialSummaryModal();
    handled = true;
  } else if (!$("sidebar-overlay").classList.contains("hidden")) {
    toggleSidebar();
    handled = true;
  }
  return handled;
}

document.addEventListener("backbutton", (e) => {
  if (handleAppBackButton()) {
    e.preventDefault();
  }
});

if (
  window.Capacitor &&
  window.Capacitor.Plugins &&
  window.Capacitor.Plugins.App
) {
  window.Capacitor.Plugins.App.addListener("backButton", () => {
    if (!handleAppBackButton()) {
      window.Capacitor.Plugins.App.exitApp();
    }
  });
}
