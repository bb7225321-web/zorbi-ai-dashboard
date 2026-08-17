// ============================================================================
// MY PHARMACY POS — dependency-free Code39 barcode generator (canvas → dataURL)
// ============================================================================

// Code39: each character is 9 elements (bar, gap, bar, gap ...) with 3 wide.
const C39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn",
  "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
  "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw",
  C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn",
  G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww",
  O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn",
  S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw",
  W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "$": "nwnwnwnnn",
  "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn",
};

export function validCode39(s: string): boolean {
  return /^[A-Z0-9\-\.\ \$\/\+%]+$/.test(s);
}

function encodePattern(text: string): string {
  let out = "nwn"; // start *
  for (const ch of text.toUpperCase()) {
    const pat = C39[ch];
    if (!pat) throw new Error(`Barcode character not supported: ${ch}`);
    out += pat + "n"; // character + narrow inter-character gap
  }
  out += "nwn"; // stop *
  return out;
}

/** Render a Code39 barcode to a data URL. Returns null if the text is invalid. */
export function barcodeDataURL(text: string, height = 44, wideRatio = 2.2, quiet = 10): string | null {
  if (!text || !validCode39(text)) return null;
  const pattern = encodePattern(text);
  const narrow = 1;
  const wide = narrow * wideRatio;
  let widthUnits = 0;
  for (const ch of pattern) widthUnits += ch === "w" ? wide : narrow;
  const pad = quiet * narrow;
  const px = Math.max(2, Math.ceil(widthUnits + pad * 2));
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, px, height);
  ctx.fillStyle = "#000000";
  let x = pad;
  for (let i = 0; i < pattern.length; i++) {
    const w = pattern[i] === "w" ? wide : narrow;
    if (i % 2 === 0) ctx.fillRect(Math.round(x), 0, Math.max(1, Math.round(w)), height);
    x += w;
  }
  return canvas.toDataURL("image/png");
}

/** Printable shelf label: product name, price, batch/expiry, barcode. */
export function labelHTML(
  rows: { name: string; price: string; barcode: string; extra?: string }[],
  symbol = "₨",
): string {
  const cells = rows
    .map((r) => {
      const img = barcodeDataURL(r.barcode, 40, 2.2, 8);
      return `<div class="label">
        <div class="label-name">${escapeHtml(r.name)}</div>
        <div class="label-price">${escapeHtml(r.price)}</div>
        ${r.extra ? `<div class="label-extra">${escapeHtml(r.extra)}</div>` : ""}
        ${img ? `<img src="${img}" alt="barcode" />` : `<div class="label-bc">${escapeHtml(r.barcode)}</div>`}
        <div class="label-bc-text">${escapeHtml(r.barcode)}</div>
      </div>`;
    })
    .join("");
  return `<div class="label-grid">${cells}</div>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
