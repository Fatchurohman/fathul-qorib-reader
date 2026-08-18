let kitabsData = [];

const appState = {
  currentView: "kitabs",
  activeKitabId: null,
  activePasalId: null,
  searchQuery: ""
};

const contentArea = document.getElementById("contentArea");
const breadcrumb = document.getElementById("breadcrumb");
const searchInput = document.getElementById("searchInput");

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function initApp() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      kitabsData = data;
      navigateTo("kitabs");
    } else {
      throw new Error("Format JSON harus berupa Array.");
    }
  } catch (error) {
    console.error("Gagal inisialisasi data:", error);
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <p style="font-size: 1.1rem; color: #ef4444; margin-bottom: 0.5rem;">⚠️ Gagal memuat file database <code>data.json</code></p>
          <small>Jika dijalankan lokal, pastikan menggunakan server lokal (seperti ekstensi VS Code <strong>Live Server</strong> atau via <strong>GitHub Pages</strong>).</small>
        </div>
      `;
    }
  }
}

function getKitabById(kitabId) {
  if (!Array.isArray(kitabsData)) return null;
  return kitabsData.find(k => k && k.id === kitabId) || null;
}

function getPasalById(kitabId, pasalId) {
  const kitab = getKitabById(kitabId);
  if (!kitab || !Array.isArray(kitab.pasals)) return null;
  return kitab.pasals.find(p => p && p.id === pasalId) || null;
}

function renderBreadcrumb() {
  if (!breadcrumb) return;

  if (appState.currentView === "kitabs") {
    breadcrumb.innerHTML = `<span>Daftar Pembagian Kitab</span>`;
    return;
  }

  if (appState.currentView === "search") {
    breadcrumb.innerHTML = `
      <button class="breadcrumb-link" onclick="navigateTo('kitabs')">Daftar Kitab</button>
      <span>/</span>
      <span>Hasil Pencarian</span>
    `;
    return;
  }

  const kitab = getKitabById(appState.activeKitabId);
  if (!kitab) {
    breadcrumb.innerHTML = "";
    return;
  }

  let html = `<button class="breadcrumb-link" onclick="navigateTo('kitabs')">Kitab</button> <span>/</span> `;

  if (appState.currentView === "pasals") {
    html += `<span>${escapeHtml(kitab.titleId)}</span>`;
  } else if (appState.currentView === "detail") {
    const pasal = getPasalById(appState.activeKitabId, appState.activePasalId);
    html += `
      <button class="breadcrumb-link" onclick="navigateTo('pasals', '${kitab.id}')">${escapeHtml(kitab.titleId)}</button>
      <span>/</span>
      <span>${pasal ? escapeHtml(pasal.titleId) : "Pasal"}</span>
    `;
  }

  breadcrumb.innerHTML = html;
}

function renderKitabsView() {
  let html = `
    <div class="view-heading">Level 1 • Pilih Bab Utama</div>
    <div class="grid">
  `;

  kitabsData.forEach(kitab => {
    const totalPasal = Array.isArray(kitab.pasals) ? kitab.pasals.length : 0;
    html += `
      <div class="card" onclick="navigateTo('pasals', '${kitab.id}')">
        <div>
          <div class="card-title-ar">${escapeHtml(kitab.titleAr)}</div>
          <div class="card-title-id">${escapeHtml(kitab.titleId)}</div>
          <p class="card-desc">${escapeHtml(kitab.description)}</p>
        </div>
        <div class="card-footer">
          <span>${totalPasal} Pasal Pembahasan</span>
          <span>Buka &rarr;</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  contentArea.innerHTML = html;
}

function renderPasalsView(kitabId) {
  const kitab = getKitabById(kitabId);
  if (!kitab) {
    navigateTo("kitabs");
    return;
  }

  let html = `
    <div class="view-heading">Level 2 • Pilih Sub-Bab / Pasal</div>
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 1.25rem; color: #fff;">${escapeHtml(kitab.titleId)}</h2>
    <div class="grid">
  `;

  if (Array.isArray(kitab.pasals) && kitab.pasals.length > 0) {
    kitab.pasals.forEach(pasal => {
      html += `
        <div class="card" onclick="navigateTo('detail', '${kitab.id}', '${pasal.id}')">
          <div>
            <div class="card-title-ar">${escapeHtml(pasal.titleAr)}</div>
            <div class="card-title-id">${escapeHtml(pasal.titleId)}</div>
          </div>
          <div class="card-footer">
            <span>Pelajari Teks & Makna</span>
            <span>Baca &rarr;</span>
          </div>
        </div>
      `;
    });
  } else {
    html += `<p class="empty-state">Belum ada pasal terdaftar di bab ini.</p>`;
  }

  html += `</div>`;
  contentArea.innerHTML = html;
}

function renderDetailView(kitabId, pasalId) {
  const pasal = getPasalById(kitabId, pasalId);
  if (!pasal) {
    navigateTo("pasals", kitabId);
    return;
  }

  let keypointsHtml = "";
  if (Array.isArray(pasal.keypoints) && pasal.keypoints.length > 0) {
    keypointsHtml = `
      <div class="keypoints-block">
        <div class="keypoints-title">💡 Kaidah & Intisari Hukum:</div>
        <ul class="keypoints-list">
          ${pasal.keypoints.map(pt => `<li>${escapeHtml(pt)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  const html = `
    <div class="view-heading">Level 3 • Tampilan Fokus Baca</div>
    <div class="reader-card">
      <div class="reader-header">
        <div class="reader-title-ar">${escapeHtml(pasal.titleAr)}</div>
        <h2 class="reader-title-id">${escapeHtml(pasal.titleId)}</h2>
      </div>

      <div class="arabic-block">
        ${escapeHtml(pasal.arabic)}
      </div>

      <div class="translation-block">
        <span class="translation-label">Terjemahan Matan</span>
        <p>${escapeHtml(pasal.translation)}</p>
      </div>

      ${keypointsHtml}
    </div>
  `;

  contentArea.innerHTML = html;
}

function renderSearchResults(query) {
  const cleanQuery = query.toLowerCase().trim();
  let matches = [];

  kitabsData.forEach(kitab => {
    if (!kitab || !Array.isArray(kitab.pasals)) return;
    kitab.pasals.forEach(pasal => {
      if (!pasal) return;
      const inTitle = (pasal.titleId || "").toLowerCase().includes(cleanQuery);
      const inTrans = (pasal.translation || "").toLowerCase().includes(cleanQuery);
      const inPoints = Array.isArray(pasal.keypoints) && pasal.keypoints.some(kp => kp.toLowerCase().includes(cleanQuery));

      if (inTitle || inTrans || inPoints) {
        matches.push({ kitab, pasal });
      }
    });
  });

  if (matches.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <p>Tidak ada pasal yang cocok dengan kata kunci "<strong>${escapeHtml(query)}</strong>".</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="view-heading">Ditemukan ${matches.length} Pembahasan untuk "${escapeHtml(query)}"</div>
    <div class="grid">
  `;

  matches.forEach(({ kitab, pasal }) => {
    html += `
      <div class="card" onclick="navigateTo('detail', '${kitab.id}', '${pasal.id}')">
        <div>
          <span style="font-size: 0.75rem; color: var(--emerald-base); font-weight: 700; text-transform: uppercase;">${escapeHtml(kitab.titleId)}</span>
          <div class="card-title-id" style="margin-top: 0.25rem;">${escapeHtml(pasal.titleId)}</div>
          <div class="card-title-ar" style="font-size: 1.15rem; margin-top: 0.25rem;">${escapeHtml(pasal.titleAr)}</div>
        </div>
        <div class="card-footer">
          <span>Lihat Hasil</span>
          <span>Buka &rarr;</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  contentArea.innerHTML = html;
}

function navigateTo(view, kitabId = null, pasalId = null) {
  appState.currentView = view;
  appState.activeKitabId = kitabId;
  appState.activePasalId = pasalId;

  if (view !== "search" && searchInput) {
    searchInput.value = "";
  }

  renderBreadcrumb();

  switch (view) {
    case "kitabs":
      renderKitabsView();
      break;
    case "pasals":
      renderPasalsView(kitabId);
      break;
    case "detail":
      renderDetailView(kitabId, pasalId);
      break;
    case "search":
      renderSearchResults(appState.searchQuery);
      break;
    default:
      renderKitabsView();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.navigateTo = navigateTo;

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      appState.searchQuery = query;
      navigateTo("search");
    } else {
      navigateTo("kitabs");
    }
  });
}

document.addEventListener("DOMContentLoaded", initApp);
