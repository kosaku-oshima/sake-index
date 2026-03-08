import {
  findEntryById,
  deleteEntryById,
  upsertEntry,
  parseTags
} from "./storage.js";

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getIdFromQuery() {
  const params = new URLSearchParams(location.search);
  return params.get("id");
}

//お気に入り度の値を取得、なければ★3にする
function getRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? Number(checked.value) : 3;
}

document.addEventListener("DOMContentLoaded", () => {
  const id = getIdFromQuery();
  const detailEl = document.getElementById("detail");
  const deleteBtn = document.getElementById("deleteBtn");
  const form = document.getElementById("editForm");

  if (!id) {
    detailEl.textContent = "idが指定されていません。";
    deleteBtn.style.display = "none";
    return;
  }

  const originalEntry = findEntryById(id);
  if (!originalEntry) {
    detailEl.textContent = "データが見つかりませんでした。";
    deleteBtn.style.display = "none";
    return;
  }

  document.getElementById("name").value = originalEntry.name;

  const checkedStar = document.querySelector(`input[name="rating"][value="${originalEntry.rating}"]`);
  if (checkedStar) {
    checkedStar.checked = true;
  }

  // Dateオブジェクトに変換（もし文字列で保存されていてもこれで安定します）
  const dateObj = new Date(originalEntry.drinkDate);
  // input type="date" が認識できる "YYYY-MM-DD" 形式に変換
  const yyyy = String(dateObj.getFullYear());
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;
  document.getElementById("drinkDate").value = dateString;
  document.getElementById("memo").value = originalEntry.memo;
  document.getElementById("tags").value = (originalEntry.tags ?? []).join(", ");
  document.getElementById("sweetness").value = originalEntry.sweetness;
  document.getElementById("bodyLevel").value = originalEntry.bodyLevel;

  deleteBtn.addEventListener("click", () => {
    if (!confirm("この記録を削除します。よろしいですか？")) return;
    deleteEntryById(id);
    location.href = "index.html";
  });

  //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（""や0など）を入れてentryというデータの塊を作る。
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (document.getElementById("name")?.value ?? "").trim();
    const memo = (document.getElementById("memo")?.value ?? "").trim();
    const tagsText = document.getElementById("tags")?.value ?? "";
    const sweetness = Number(document.getElementById("sweetness")?.value ?? 0);
    const bodyLevel = Number(document.getElementById("bodyLevel")?.value ?? 0);
    const drinkDate = document.getElementById("drinkDate")?.value ?? "";

　//入力チェック
    if (!name) {
      alert("日本酒の名前は必須です。");
      return;
    }
    if (!memo) {
      alert("ひとことメモは必須です。");
      return;
    }

    const updatedEntry = {
      id: originalEntry.id,
      name,
      memo,
      rating: getRating(),
      tags: parseTags(tagsText),
      sweetness,   // 甘い(-2) ←→ 辛い(+2)
      bodyLevel,   // 軽い(-2) ←→ 重い(+2)
      drinkDate,   // 任意（今日が初期）
      createdAt: originalEntry.createdAt, // ソート用（登録日時）
    };

    //実行後index.htmlに戻る処理
    upsertEntry(updatedEntry);
    location.href = "index.html";
  });
});
