import {
  findEntryById,
  deleteEntryById,
  upsertEntry,
  parseTags
} from "./storage.js";

//選択されたデータを取得する関数
function getIdFromQuery() {
  const params = new URLSearchParams(location.search);
  return params.get("id");
}

//お気に入り度の値を取得、なければnullにする関数
function getRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? Number(checked.value) : null;
}

//閲覧表示用のお気に入り度を表す★★★★★のDOM要素を返す関数
function renderViewRating(value) {
  const rating = Number(value) || 0;
  let html = "";

  for (let i = 1; i <= 5; i++) {
    html += i <= rating    //「条件式 ? trueの時に実行 : falseの時に実行」という書き方
      ? '<span class="star filled">★</span>'
      : '<span class="star">★</span>';
  }

  return html;
}

//画面読み込み時にラジオボタンの選択済み項目をチェック状態にする関数
function setRadioChecked(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`) ?? null;
  if (radio) {
    radio.checked = true;
  }
}

//画面読み込み時に閲覧表示用の<div>に値をセットする関数、テキスト系の項目用
function setViewText(id, text) {
  const viewElement = document.getElementById(`${id}`);
  if (viewElement) {
    viewElement.textContent = text ?? "";
  }
}

//getRadioLabel()関数で使うラジオボタンのvalueとラベルの対応表
const radioLabelMap = {
  sweetness: {
    "-2": "甘い",
    "-1": "やや甘い",
    "0": "中間",
    "1": "やや辛い",
    "2": "辛い"
  },
  acidity: {
    "0": "なし",
    "1": "やや酸味あり",
    "2": "酸味あり"
  },
  umami: {
    "-2": "すっきり",
    "-1": "ややすっきり",
    "0": "中間",
    "1": "やや旨みあり",
    "2": "旨みが強い"
  },
  bodyLevel: {
    "-2": "軽い",
    "-1": "やや軽い",
    "0": "中間",
    "1": "やや重い",
    "2": "重い"
  },
  aroma: {
    "0": "穏やか",
    "1": "やや華やか",
    "2": "華やか"
  },
  repeatability: {
    "1": "また飲みたい",
    "0": "普通",
    "-1": "あまり好みではない"
  }
};

//画面読み込み時に選択済みのラジオボタンのラベルを取得する関数
function getRadioLabel(name, value) {
  if (value === null || value === undefined) {
    return "";
  }
  const groupMap = radioLabelMap[name];
  if (!groupMap) {
    return "";
  }
  const stringValue = String(value);
  return groupMap[stringValue] || "";//A || B;は「AがなければBを使う」という意味
}

//編集内容確定時にラジオボタンでチェックがついている選択肢のvalueを取得する関数
function getCheckedRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? Number(checked.value) : null;
}

//編集モードかどうかを引数に渡すと各要素の表示非表示を切り替えてくれる関数
function setEditMode(editMode) {
  const editModeFields = document.querySelectorAll('.edit-mode');
  editModeFields.forEach(el => {
    el.classList.toggle('hidden', !editMode);  //.toggle(token, force) forceがFALSEだとクラスの削除のみ行う
  })
  const viewModeFields = document.querySelectorAll('.view-mode');
  viewModeFields.forEach(el => {
    el.classList.toggle('hidden', editMode);  //.toggle(token, force) forceがTRUEだとクラスの追加のみ行う
  })
}

//閲覧用に初期値をセットする関数
function fillViewFromEntry(originalEntry) {
  setViewText("nameText", originalEntry.name);
  setViewText("drinkDateText", originalEntry.drinkDate);

  document.getElementById("ratingText").innerHTML = renderViewRating(originalEntry.rating);

  const sweetnessText = getRadioLabel("sweetness", originalEntry.sweetness);
  setViewText("sweetnessText", sweetnessText);

  const acidityText = getRadioLabel("acidity", originalEntry.acidity);
  setViewText("acidityText", acidityText);

  const umamiText = getRadioLabel("umami", originalEntry.umami);
  setViewText("umamiText", umamiText);

  const bodyLevelText = getRadioLabel("bodyLevel", originalEntry.bodyLevel);
  setViewText("bodyLevelText", bodyLevelText);

  const aromaText = getRadioLabel("aroma", originalEntry.aroma);
  setViewText("aromaText", aromaText);

  const repeatabilityText = getRadioLabel("repeatability", originalEntry.repeatability);
  setViewText("repeatabilityText", repeatabilityText);
  
  setViewText("memoText", originalEntry.memo);
  setViewText("tagsText", (originalEntry.tags ?? []).join(", "));
  setViewText("notesText", originalEntry.notes);
}

//ラジオボタンを未選択に戻す関数。fillFormFromEnty関数の最初に使うことを想定。
function clearRadioGroup(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
    radio.checked = false;
  });
}

//編集フォームの初期値をセットする関数
function fillFormFromEntry(originalEntry) {
  //未選択のラジオボタンが半端に編集された場合に備えてまず編集中のラジオボタンをリセット
  clearRadioGroup("rating");
  clearRadioGroup("sweetness");
  clearRadioGroup("acidity");
  clearRadioGroup("umami");
  clearRadioGroup("bodyLevel");
  clearRadioGroup("aroma");
  clearRadioGroup("repeatability");

  //各項目に値をセット開始
  document.getElementById("name").value = originalEntry.name ?? "";

  const checkedStar = document.querySelector(`input[name="rating"][value="${originalEntry.rating}"]`);
  if (checkedStar) {
    checkedStar.checked = true;
  }

  const drinkDateEl = document.getElementById("drinkDate");
  if (originalEntry.drinkDate) {
    drinkDateEl.value = originalEntry.drinkDate;
  } else {
    drinkDateEl.value = "";
  }

  setRadioChecked("sweetness", originalEntry.sweetness);
  setRadioChecked("acidity", originalEntry.acidity);
  setRadioChecked("umami", originalEntry.umami);
  setRadioChecked("bodyLevel", originalEntry.bodyLevel);
  setRadioChecked("aroma", originalEntry.aroma);
  setRadioChecked("repeatability", originalEntry.repeatability);

  document.getElementById("memo").value = originalEntry.memo ?? "";
  document.getElementById("tags").value = (originalEntry.tags ?? []).join(", ");
  document.getElementById("notes").value = originalEntry.notes ?? "";
}

//==================================================
// 画面読み込み時の処理
//==================================================
document.addEventListener("DOMContentLoaded", () => {
  const id = getIdFromQuery();
  const detailEl = document.getElementById("detail");
  const form = document.getElementById("editForm");
  const editBtn = document.getElementById("editBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const backToListLink = document.getElementById("backToList");

  //idがないという異常時の表示
  if (!id) {
    detailEl.innerHTML = `
      <div class="error-message">
        データのidを取得できませんでした。<br>上のボタンから一覧画面に戻ってください。
      </div>`
    const h1s = document.querySelectorAll('.mode-title');
    h1s.forEach(function(h1) {
      h1.classList.add('hidden');
    });
    return;
  }

  //選択されたデータの存在チェック
  const originalEntry = findEntryById(id);
  if (!originalEntry) {
    detailEl.innerHTML = `
      <div class="error-message">
        データが見つかりませんでした。<br>上のボタンから一覧画面に戻ってください。
      </div>`
    const h1s = document.querySelectorAll('.mode-title');
    h1s.forEach(function(h1) {
      h1.classList.add('hidden');
    });
    return;
  }

  //閲覧モードにする
  setEditMode(false);

  //各項目の初期値をセット
  fillViewFromEntry(originalEntry);  //閲覧用
  fillFormFromEntry(originalEntry);  //編集用

  //編集ボタン押下時の処理
  editBtn.addEventListener("click", () => {
    setEditMode(true);
  })

  //編集キャンセルボタン押下時の処理
  cancelEditBtn.addEventListener("click", () => {
    setEditMode(false);
    fillFormFromEntry(originalEntry);
  })

  //削除ボタン押下時の処理
  deleteBtn.addEventListener("click", () => {
    if (!confirm("この記録を削除します。よろしいですか？")) return;
    deleteEntryById(id);
    location.href = "index.html";
  });

  //一覧に戻るボタン押下時の処理
  backToListLink.addEventListener("click", () => {
    const backParams = new URLSearchParams(window.location.search);
    backParams.delete("id");
    const backUrl = backParams.toString()
      ? `index.html?${backParams.toString()}`
      : "index.html";
    document.getElementById("backToList").href = backUrl
  })

  //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（""や0など）を入れてentryというデータの塊を作る。
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (document.getElementById("name")?.value ?? "").trim();
    const drinkDateRaw = document.getElementById("drinkDate")?.value ?? "";
    const drinkDate = drinkDateRaw === "" ? null : drinkDateRaw;  //drinkDateが未入力ならnullにする
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
      updatedAt: Date.now()//更新日に現在日付をセット
    };

    //実行後index.htmlに戻る処理
    upsertEntry(updatedEntry);
    location.href = "index.html";
  });
});
