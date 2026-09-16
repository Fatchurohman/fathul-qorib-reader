document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("reader-container");
  const chapterListEl = document.getElementById("chapter-list");
  
  if (!container || !chapterListEl) {
    console.error("Elemen utama DOM ora ditemokake.");
    return;
  }

  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`Gagal ngedum data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validasi data aman (mendukung multiple chapters utawa single chapter)
    const chapters = Array.isArray(data) ? data : [data];

    renderSidebar(chapters, chapterListEl, container);
    
    // Render bab pertama minangka default landing
    if (chapters.length > 0) {
      renderFathulQorib(chapters[0], container);
    }

  } catch (error) {
    console.error("Error ngakses utawa parsing data.json:", error);
    container.innerHTML = `<p class="error-msg">Nyuwun pangapunten, data gagal dimuat.</p>`;
  }
});

function renderSidebar(chapters, listEl, container) {
  listEl.innerHTML = ""; // Resiki dhisik

  chapters.forEach((chap, index) => {
    const title = chap.fashl_title ?? `Bab ${index + 1}`;
    const li = document.createElement("li");
    li.textContent = title;
    
    // Set active ing bab pertama
    if (index === 0) li.classList.add("active");

    li.addEventListener("click", () => {
      // Ganti kelas aktif visual
      document.querySelectorAll(".sidebar li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");

      // Tampilkan konten bab sing diklik
      renderFathulQorib(chap, container);
    });

    listEl.appendChild(li); // Otomatis nambah lan urut mudhun menyang ngisor
  });
}

function renderFathulQorib(chapterData, container) {
  if (!chapterData || !Array.isArray(chapterData.content_items)) {
    container.innerHTML = "<p class='error-msg'>Format data bab ora valid.</p>";
    return;
  }

  let htmlContent = `<h2 class="chapter-title">${escapeHTML(chapterData.fashl_title ?? "Bab Utama")}</h2>`;

  chapterData.content_items.forEach(item => {
    const arabic = item.arabic ?? "";
    const makna = item.makna_gandul ?? "";
    const translation = item.translation ?? "";

    htmlContent += `
      <div class="kitab-card">
        <p class="arabic-text" dir="rtl">${escapeHTML(arabic)}</p>
        <p class="makna-gandul"><strong>Makna Gandul:</strong> ${escapeHTML(makna)}</p>
        <p class="translation"><strong>Terjemahan:</strong> ${escapeHTML(translation)}</p>
      </div>
    `;
  });

  container.innerHTML = htmlContent;
}

// Fungsi sanitasi aman cegah XSS
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
