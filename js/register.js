// storage.jsから関数を読み込み
import { upsertEntry, uuid, parseTags } from "./storage.js";

//お気に入り度の値を取得、なければ★3にする
function getRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? Number(checked.value) : 3;
}

//ページ読み込み時に現在日付をセットする関数
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const dateInput = document.getElementById("drinkDate");

  // 日付の初期値を今日に
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

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
      alert("酒名は入力必須です。");
      return;
    }
    if (name > 50) {
      alert("酒名は50文字以内で入力してください。")
    }

    const entry = {
      id: uuid(),
      name,
      memo,
      rating: getRating(),
      tags: parseTags(tagsText),
      sweetness,   // 甘い(-2) ←→ 辛い(+2)
      bodyLevel,   // 軽い(-2) ←→ 重い(+2)
      drinkDate,   // 任意（今日が初期）
      createdAt: Date.now(), // ソート用（登録日時）
    };

    //実行後index.htmlに戻る処理
    upsertEntry(entry);
    location.href = "index.html";
  });
});
