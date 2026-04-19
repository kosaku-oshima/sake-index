import { setupNavLinks } from "./nav.js";
import { loadEntries } from "./storage.js";
import { buildPageUrl } from "./query.js";

// 日時を yyyy/MM/dd HH:mm 形式に変換
function formatDateTime(value) {
  if (value === null || value === undefined || value === "") return "";

  const date = new Date(value);

  // 不正な日付対策
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

// CSV用に値を安全な文字列へ変換する
function escapeCsv(value) {
  const str = String(value ?? "");

  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

//ラジオボタンの項目の値とラベルの対応表
const radioLabelMap = {
  sweetness: {
    [-2]: "甘い",
    [-1]: "やや甘い",
    0: "中間",
    1: "やや辛い",
    2: "辛い"
  },
  acidity: {
    0: "なし",
    1: "やや酸味あり",
    2: "酸味あり",
  },
  umami: {
    [-2]: "すっきり",
    [-1]: "ややすっきり",
    0: "中間",
    1: "やや旨みあり",
    2: "旨みが強い"
  },
  bodyLevel: {
    [-2]: "軽い",
    [-1]: "やや軽い",
    0: "中間",
    1: "やや重い",
    2: "重い"
  },
  aroma: {
    0: "穏やか",
    1: "やや華やか",
    2: "華やか"
  },
  repeatability: {
    1: "また飲みたい",
    0: "普通",
    [-1]: "あまり好みではない"
  }
};

//値を元に対応するラベルを取得する関数
function getRadioLabel(fieldName, value) {
  if (value === null || value === undefined || value === "") return "";
  return radioLabelMap[fieldName]?.[Number(value)] ?? "";
}

// entries配列をCSV文字列に変換する
function toCsv(entries) {
  const header = [
    "id",
    "name",
    "rating",
    "drinkDate",

    "sweetness",
    "sweetnessLabel",
    "acidity",
    "acidityLabel",
    "umami",
    "umamiLabel",
    "bodyLevel",
    "bodyLevelLabel",
    "aroma",
    "aromaLabel",
    "repeatability",
    "repeatabilityLabel",

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
    getRadioLabel("sweetness", entry.sweetness),

    entry.acidity,
    getRadioLabel("acidity", entry.acidity),

    entry.umami,
    getRadioLabel("umami", entry.umami),

    entry.bodyLevel,
    getRadioLabel("bodyLevel", entry.bodyLevel),

    entry.aroma,
    getRadioLabel("aroma", entry.aroma),

    entry.repeatability,
    getRadioLabel("repeatability", entry.repeatability),

    entry.memo,
    (entry.tags ?? []).join("|"),
    entry.notes,
    formatDateTime(entry.createdAt),
    formatDateTime(entry.updatedAt)
  ]);

  const lines = [
    header.map(escapeCsv).join(","),
    ...rows.map(row => row.map(escapeCsv).join(","))
  ];

  return lines.join("\n");
}

// // CSVをダウンロードさせる
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

// // YYYY-MM-DD_HHMMSS 形式の時刻文字列を作る
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
  const messageEl = document.getElementById("exportMessage");
  //キャンセルボタンのリンク先を設定
  const backToListLink = document.getElementById("backToList");
  if (backToListLink) {
    const backUrl = buildPageUrl("index.html", window.location.search, {id: null});
    backToListLink.href = backUrl;
  }

  //ナブバーのリンク先を設定（全画面共通で入れる）
  setupNavLinks();

  const btn = document.getElementById("exportCsvBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      const entries = await loadEntries();

      if (!entries.length) {
        if (messageEl) {
          messageEl.textContent = "エクスポートできるデータがありません。";
        }
        return;
      }

      const csvText = toCsv(entries);
      const filename = `sake-index-export_${makeTimestamp()}.csv`;

      downloadCsv(filename, csvText);

      if (messageEl) {
        messageEl.textContent = `${entries.length}件のデータをCSVとして出力しました。`;
      }
    } catch (error) {
      console.error("データのエクスポートに失敗しました", error);
    }
  });
});