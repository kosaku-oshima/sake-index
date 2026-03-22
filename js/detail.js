import {
  findEntryById,
  deleteEntryById,
  upsertEntry,
  parseTags
} from "./storage.js";

function getIdFromQuery() {
  const params = new URLSearchParams(location.search);
  return params.get("id");
}

//お気に入り度の値を取得、なければnullにする
function getRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? Number(checked.value) : null;
}

//画面読み込み時にラジオボタンの選択済み項目をチェック状態にする関数
function setRadioChecked(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`) ?? null;
  if (radio) {
    radio.checked = true;
  }
}

//編集内容確定時にラジオボタンでチェックがついている選択肢のvalueを取得する関数
function getCheckedRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? Number(checked.value) : null;
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

  //nameの初期値をセット
  document.getElementById("name").value = originalEntry.name ?? "";

  //ratingの初期値をセット
  const checkedStar = document.querySelector(`input[name="rating"][value="${originalEntry.rating}"]`);
  if (checkedStar) {
    checkedStar.checked = true;
  }

  //drinkDateの初期値をセット
  const drinkDateEl = document.getElementById("drinkDate");
  if (originalEntry.drinkDate) {
    drinkDateEl.value = originalEntry.drinkDate;
  } else {
    drinkDateEl.value = "";
  }

  //ラジオボタンの項目の初期値をセット
  setRadioChecked("sweetness", originalEntry.sweetness);
  setRadioChecked("acidity", originalEntry.acidity);
  setRadioChecked("umami", originalEntry.umami);
  setRadioChecked("bodyLevel", originalEntry.bodyLevel);
  setRadioChecked("aroma", originalEntry.aroma);
  setRadioChecked("repeatability", originalEntry.repeatability);

  //テキスト形式の項目の初期値をセット
  document.getElementById("memo").value = originalEntry.memo ?? "";
  document.getElementById("tags").value = (originalEntry.tags ?? []).join(", ");
  document.getElementById("notes").value = originalEntry.notes ?? "";

  deleteBtn.addEventListener("click", () => {
    if (!confirm("この記録を削除します。よろしいですか？")) return;
    deleteEntryById(id);
    location.href = "index.html";
  });

  //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（""や0など）を入れてentryというデータの塊を作る。
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (document.getElementById("name")?.value ?? "").trim();
    const drinkDate = document.getElementById("drinkDate")?.value ?? "";
    const sweetness = getCheckedRadioValue("sweetness");
    const acidity = getCheckedRadioValue("acidity");
    const umami = getCheckedRadioValue("umami");
    const bodyLevel = getCheckedRadioValue("bodyLevel");
    const aroma = getCheckedRadioValue("aroma");
    const repeatability = getCheckedRadioValue("repeatability");
    const memo = (document.getElementById("memo")?.value ?? "").trim();
    const tagsText = document.getElementById("tags")?.value ?? "";
    const notes = (document.getElementById("notes")?.value ?? "").trim();

    //入力チェック
    if (!name) {
      alert("日本酒の名前は必須です。");
      return;
    }
    if (name.length > 50) {
      alert("酒名は50文字以内で入力してください。")
      return;
    }
    if (notes.length > 200) {
      alert("備考は200文字以内で入力してください。")
      return;
    }

    const updatedEntry = {
      id: originalEntry.id,
      name,
      rating: getRating(),
      drinkDate,
      sweetness,
      acidity,
      umami,
      bodyLevel,
      aroma,
      repeatability,
      memo,
      tags: parseTags(tagsText),
      notes,
      createdAt: originalEntry.createdAt, // ソート用（登録日時）
    };

    //実行後index.htmlに戻る処理
    upsertEntry(updatedEntry);
    location.href = "index.html";
  });
});
