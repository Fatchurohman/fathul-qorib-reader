let allChapters = [];
let currentChapterIndex = 0;
let showGandul = true;
let showTranslation = true;
let arabicFontSize = parseFloat(localStorage.getItem("fq_fontSize")) || 1.75;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("reader-container");
  const chapterListEl = document.getElementById("chapter-list");
  const searchInput = document.getElementById("search-chapter");

  if (!container || !chapterListEl) {
    console.error("Elemen utama DOM ora ditemokake.");
    return;
  }

  applySavedPreferences();
  setupToolbar();

  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`Gagal ngedum data: ${response.statusText}`);
    }

    const data = await response.json();
    allChapters = Array.isArray(data) ? data : [data];

    renderSidebar(allChapters, chapterListEl);

    const savedIndex = parseInt(localStorage.getItem("fq_lastChapter")) || 0;
    const startIndex = savedIndex < allChapters.length ? savedIndex : 0;
    if (allChapters.length > 0) {
      selectChapter(startIndex);
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase();
        const items = chapterListEl.querySelectorAll("li");
        items.forEach((li) => {
          const match = li.textContent.toLowerCase().includes(keyword);
          li.style.display = match ? "block" : "none";
        });
      });
    }
  } catch (error) {
    console.error("Error ngakses utawa parsing data.json:", error);
    container.innerHTML = `<p class="error-msg">Nyuwun pangapunten, data.json gagal dimuat. Pastikan dijalankan lewat server lokal / GitHub Pages.</p>`;
  }
});

function applySavedPreferences() {
  document.documentElement.style.setProperty("--arabic-size", `${arabicFontSize}rem`);
  const savedTheme = localStorage.getItem("fq_theme");
  const btnTheme = document.getElementById("btn-theme");
  if (savedTheme === "kuning") {
    document.body.classList.add("theme-kuning");
    if (btnTheme) btnTheme.textContent = "🌙 Tema Luxury Dark";
  }
}

function setupToolbar() {
  const btnTheme = document.getElementById("btn-theme");
  const btnGandul = document.getElementById("btn-toggle-gandul");
  const btnTrans = document.getElementById("btn-toggle-trans");
  const btnFontDec = document.getElementById("btn-font-dec");
  const btnFontInc = document.getElementById("btn-font-inc");

  btnTheme?.addEventListener("click", () => {
    const isKuning = document.body.classList.toggle("theme-kuning");
    btnTheme.textContent = isKuning ? "🌙 Tema Luxury Dark" : "📜 Tema Kitab Kuning";
    localStorage.setItem("fq_theme", isKuning ? "kuning" : "dark");
  });

  btnGandul?.addEventListener("click", () => {
    showGandul = !showGandul;
    btnGandul.classList.toggle("active", showGandul);
    document.querySelectorAll(".makna-gandul").forEach((el) => {
      el.classList.toggle("hidden", !showGandul);
    });
  });

  btnTrans?.addEventListener("click", () => {
    showTranslation = !showTranslation;
    btnTrans.classList.toggle("active", showTranslation);
    document.querySelectorAll(".translation").forEach((el) => {
      el.classList.toggle("hidden", !showTranslation);
    });
  });

  btnFontInc?.addEventListener("click", () => {
    if (arabicFontSize < 2.8) {
      arabicFontSize = +(arabicFontSize + 0.15).toFixed(2);
      document.documentElement.style.setProperty("--arabic-size", `${arabicFontSize}rem`);
      localStorage.setItem("fq_fontSize", arabicFontSize);
    }
  });

  btnFontDec?.addEventListener("click", () => {
    if (arabicFontSize > 1.2) {
      arabicFontSize = +(arabicFontSize - 0.15).toFixed(2);
      document.documentElement.style.setProperty("--arabic-size", `${arabicFontSize}rem`);
      localStorage.setItem("fq_fontSize", arabicFontSize);
    }
  });

  // Kontrol Modal Panduan Makna Gandul
  const btnGuide = document.getElementById("btn-guide");
  const guideModal = document.getElementById("guide-modal");
  const btnCloseGuide = document.getElementById("btn-close-guide");

  const closeModal = () => guideModal?.classList.add("hidden");

  btnGuide?.addEventListener("click", () => {
    guideModal?.classList.remove("hidden");
  });

  btnCloseGuide?.addEventListener("click", closeModal);

  guideModal?.addEventListener("click", (e) => {
    if (e.target === guideModal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && guideModal && !guideModal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

function renderSidebar(chapters, listEl) {
  listEl.innerHTML = "";
  chapters.forEach((chap, index) => {
    const title = chap.fashl_title ?? `Bab ${index + 1}`;
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${title}`;
    li.dataset.index = index;
    li.addEventListener("click", () => selectChapter(index));
    listEl.appendChild(li);
  });
}

function selectChapter(index) {
  currentChapterIndex = index;
  localStorage.setItem("fq_lastChapter", index);

  document.querySelectorAll("#chapter-list li").forEach((el) => {
    el.classList.toggle("active", parseInt(el.dataset.index) === index);
  });

  const container = document.getElementById("reader-container");
  renderFathulQorib(allChapters[index], container);
  renderChapterNav();

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFathulQorib(chapterData, container) {
  if (!chapterData || !Array.isArray(chapterData.content_items)) {
    container.innerHTML = "<p class='error-msg'>Format data bab ora valid.</p>";
    return;
  }

  let htmlContent = `<h2 class="chapter-title">${escapeHTML(chapterData.fashl_title ?? "Bab Utama")}</h2>`;

  chapterData.content_items.forEach((item, idx) => {
    const arabic = formatMatan(item.arabic ?? "");
    const makna = escapeHTML(item.makna_gandul ?? "");
    const translation = escapeHTML(item.translation ?? "");
    const gandulClass = showGandul ? "" : "hidden";
    const transClass = showTranslation ? "" : "hidden";

    htmlContent += `
      <div class="kitab-card">
        <div class="card-header-meta">
          <span class="item-badge">Pasal #${item.id ?? idx + 1}</span>
          <button class="copy-btn" onclick="copyCardText(${idx}, this)">📋 Salin</button>
        </div>
        <p class="arabic-text" dir="rtl">${arabic}</p>
        <p class="makna-gandul ${gandulClass}"><strong>Makna Gandul:</strong> ${makna}</p>
        <p class="translation ${transClass}"><strong>Terjemahan:</strong> ${translation}</p>
      </div>
    `;
  });

  container.innerHTML = htmlContent;
}

function renderChapterNav() {
  const navEl = document.getElementById("chapter-nav");
  if (!navEl) return;

  const prevDisabled = currentChapterIndex === 0 ? "disabled" : "";
  const nextDisabled = currentChapterIndex === allChapters.length - 1 ? "disabled" : "";

  navEl.innerHTML = `
    <button class="nav-btn" ${prevDisabled} onclick="selectChapter(${currentChapterIndex - 1})">⬅️ Bab Sebelumnya</button>
    <button class="nav-btn" ${nextDisabled} onclick="selectChapter(${currentChapterIndex + 1})">Bab Selanjutnya ➡️</button>
  `;
}

function formatMatan(text) {
  const safeText = escapeHTML(text);
  return safeText.replace(/\(([^)]+)\)/g, '<span class="matan-highlight">($1)</span>');
}

function copyCardText(itemIndex, btnEl) {
  const item = allChapters[currentChapterIndex]?.content_items[itemIndex];
  if (!item) return;

  const textToCopy = `${item.arabic}\n\nMakna Gandul:\n${item.makna_gandul}\n\nTerjemahan:\n${item.translation}\n\n— Fathul Qorib Reader`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const oldText = btnEl.textContent;
    btnEl.textContent = "✅ Tersalin";
    setTimeout(() => (btnEl.textContent = oldText), 1500);
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
