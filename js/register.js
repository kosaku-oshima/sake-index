import { setupNavLinks } from "./nav.js";
import { upsertEntry, uuid, parseTags } from "./storage.js";
import { buildPageUrl } from "./query.js";

//お気に入り度の値を取得し、なければnullを返す
function getRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? Number(checked.value) : null;
}

//==================================================
// 画面読み込み時の処理
//==================================================
//ページ読み込み時に現在日付をセットする関数
document.addEventListener("DOMContentLoaded", () => {
  //formがなかったら処理を終える
  const form = document.querySelector("form");
  if (!form) return; 

  //ナブバーのリンク先を設定（全画面共通で入れる）
  setupNavLinks();

  //キャンセルリンク押下時の行先を先に確定させておく処理。リンククリック時に行先を操作するとうまくつながらない可能性があるため
  const backToListLink = document.getElementById("backToList");
  if (backToListLink) {
    const backUrl = buildPageUrl("index.html", window.location.search, {});
    backToListLink.href = backUrl;
  }

  // 日付の初期値を今日にする
  const dateInput = document.getElementById("drinkDate");
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（基本null）を入れてentryというデータの塊を作る。
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (document.getElementById("name")?.value ?? "").trim();
    const drinkDateRaw = document.getElementById("drinkDate")?.value ?? ""; //データがない場合に必ず""になってしまうようなので、1行使ってnullに変換する
    const drinkDate = drinkDateRaw === "" ? null : drinkDateRaw;
    const checkedSweetness = document.querySelector('input[name="sweetness"]:checked');
    const sweetness = checkedSweetness ? Number(checkedSweetness.value) : null;
    const checkedAcidity = document.querySelector('input[name="acidity"]:checked');
    const acidity = checkedAcidity ? Number(checkedAcidity.value) : null;
    const checkedUmami = document.querySelector('input[name="umami"]:checked');
    const umami = checkedUmami ? Number(checkedUmami.value) : null;
    const checkedBodyLevel = document.querySelector('input[name="bodyLevel"]:checked');
    const bodyLevel = checkedBodyLevel ? Number(checkedBodyLevel.value) : null;
    const checkedAroma = document.querySelector('input[name="aroma"]:checked');
    const aroma = checkedAroma ? Number(checkedAroma.value) : null;
    const checkedRepeatability = document.querySelector('input[name="repeatability"]:checked');
    const repeatability = checkedRepeatability ? Number(checkedRepeatability.value) : null;
    const memo = (document.getElementById("memo")?.value ?? "").trim();
    const tagsText = document.getElementById("tags")?.value ?? "";
    const notes = (document.getElementById("notes")?.value ?? "").trim();
    

  //入力チェック
    if (!name) {
      alert("酒名は入力必須です。");
      return; //エラーのあとに保存せず止める処理。このreturnがないとエラーが出ているのにデータが保存される。
    }
    if (name.length > 50) {
      alert("酒名は50文字以内で入力してください。")
      return;
    }
    if (notes.length > 200) {
      alert("備考は200文字以内で入力してください。")
      return;
    }

    const entry = {
      id: uuid(),
      name,
      rating: getRating(),
      drinkDate,   // 任意（今日が初期）
      sweetness,
      acidity,
      umami,
      bodyLevel,
      aroma,
      repeatability,
      memo,
      tags: parseTags(tagsText),
      notes,
      createdAt: Date.now(), // ソート用（登録日時）
      updatedAt: ""//新規登録時は空欄
    };

    //登録処理
    upsertEntry(entry);
    //登録後index.htmlに戻る処理
    const backUrl = buildPageUrl("index.html", window.location.search, {});
    location.href = backUrl;
  });
});
