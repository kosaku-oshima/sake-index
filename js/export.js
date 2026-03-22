import { loadEntries } from "./storage.js";

// CSV用に値を安全な文字列へ変換する
function escapeCsv(value) {
  const str = String(value ?? "");

  // カンマ、改行、ダブルクォートが含まれる場合はCSVルールに従って囲む
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

// entries配列をCSV文字列に変換する
function toCsv(entries) {
  const header = [
    "id",
    "name",
    "rating",
    "drinkDate",
    "sweetness",
    "acidity",
    "umami",
    "bodyLevel",
    "aroma",
    "repeatability",
    "memo",
    "tags",
    "notes",
    "createdAt",
    "updatedAt"
  ];

  const rows = entries.map(entry => [
    entry.id,
    entry.name,
    entry.rating,
    entry.drinkDate,
    entry.sweetness,
    entry.acidity,
    entry.umami,
    entry.bodyLevel,
    entry.aroma,
    entry.repeatability,
    entry.memo,
    (entry.tags ?? []).join("|"),
    entry.notes,
    entry.createdAt,
    entry.updatedAt
  ]);

  const lines = [
    header.map(escapeCsv).join(","),
    ...rows.map(row => row.map(escapeCsv).join(","))
  ];

  return lines.join("\n");
}

// CSVをダウンロードさせる
function downloadCsv(filename, csvText) {
  // Excelで文字化けしにくくするためBOMを付ける
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// YYYY-MM-DD_HHMMSS 形式の時刻文字列を作る
function makeTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}_${hh}${mi}${ss}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("exportCsvBtn");
  const messageEl = document.getElementById("exportMessage");

  if (!btn) return;

  btn.addEventListener("click", () => {
    const entries = loadEntries();

    if (!entries.length) {
      messageEl.textContent = "エクスポートできるデータがありません。";
      return;
    }

    const csvText = toCsv(entries);
    const filename = `sake-index-export_${makeTimestamp()}.csv`;

    downloadCsv(filename, csvText);
    messageEl.textContent = `${entries.length}件のデータをCSVとして出力しました。`;
  });
});