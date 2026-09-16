document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("reader-container");
  
  if (!container) {
    console.error("Elemen container reader ora ditemokake ing DOM.");
    return;
  }

  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`Gagal ngedum data: ${response.statusText}`);
    }
    
    const data = await response.json();
    renderFathulQorib(data, container);

  } catch (error) {
    console.error("Error ngakses utawa parsing data.json:", error);
    container.innerHTML = `<p class="error-msg">Nyuwun pangapunten, data gagal dimuat.</p>`;
  }
});

function renderFathulQorib(data, container) {
  // Validasi keamanan struktur data
  if (!data || !Array.isArray(data.content_items)) {
    container.innerHTML = "<p class='error-msg'>Format data JSON ora valid.</p>";
    return;
  }

  let htmlContent = `<h2 class="chapter-title">${escapeHTML(data.fashl_title)}</h2>`;

  data.content_items.forEach(item => {
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

// Fungsi bantu kanggo nyegah XSS / sanitasi string sederhana
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
