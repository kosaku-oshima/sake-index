import { setupNavLinks } from "./nav.js";
import { parseTags } from "./storage.js";
import { getSearchParamsFromUrl, buildSearchParams, buildPageUrl } from "./query.js";

//お気に入り度の値を取得し、なければnullを返す
function getRating() {
    const checked = document.querySelector('input[name="rating"]:checked');
    return checked ? Number(checked.value) : null;
  }

//チェックボックスで複数選択される項目のvalueを配列に格納するための関数
function getCheckedValues(name) {
  return Array.from(
    document.querySelectorAll(`input[name="${name}"]:checked`)
  ).map(el => Number(el.value));
}

//テキストで文字や日付を入れる項目の初期値をセットする関数
function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value ?? "";
  }
}

//ラジオボタンの選択肢を一つずつchecked=trueにする関数。主にrating用
function setRadioChecked(name, value) {
  if (value === null || value === "") return;

  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) {
    radio.checked = true;
  }
}

//チェックボックスの選択肢を一つずつchecked=trueにする関数
function setCheckboxChecked(name, values) {
  values.forEach(value => {
    const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (checkbox) {
      checkbox.checked = true;
    }
  });
}

//編集フォームの初期値をセットする関数
function fillFormFromParams() {
  //URLのパラメータから各値を取得
  const params = getSearchParamsFromUrl(window.location.search);
  //各値を初期値としてセット
  setInputValue("name", params.name);
  setRadioChecked("rating", params.rating);
  setInputValue("drinkDate", params.drinkDate);
  setCheckboxChecked("sweetness", params.sweetnessList);
  setCheckboxChecked("acidity", params.acidityList);
  setCheckboxChecked("umami", params.umamiList);
  setCheckboxChecked("bodyLevel", params.bodyLevelList);
  setCheckboxChecked("aroma", params.aromaList);
  setCheckboxChecked("repeatability", params.repeatabilityList);
  setInputValue("memo", params.memo);
  setInputValue("tags", params.tagsList.join(", "));
  setInputValue("notes", params.notes);
}

//==================================================
// 画面読み込み時の処理
//==================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    const clearBtn = document.getElementById("clearBtn");

    //ナブバーのリンク先を設定（全画面共通で入れる）
    setupNavLinks();
    
    //キャンセルリンク押下時の行先を先に確定させておく処理。リンククリック時に行先を操作するとうまくつながらない可能性があるため
    const backToListLink = document.getElementById("backToList");
    if (backToListLink) {
      const backUrl = buildPageUrl("index.html", window.location.search, {});
      backToListLink.href = backUrl;
    }

    //パラメータを元に各項目の初期値をセット
    fillFormFromParams();
    
    //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（基本null）を入れてentryというデータの塊を作る。
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        // const params = new URLSearchParams();

        const name = (document.getElementById("name")?.value ?? null).trim();
        const rating = getRating();
        const drinkDate = document.getElementById("drinkDate")?.value ?? null;
        //チェックボックスで複数選択の項目は選択されたvalueを配列に格納する
        const checkedSweetnessList = getCheckedValues("sweetness");
        const checkedAcidityList = getCheckedValues("acidity");
        const checkedUmamiList = getCheckedValues("umami");
        const checkedBodyLevelList = getCheckedValues("bodyLevel");
        const checkedAromaList = getCheckedValues("aroma");
        const checkedRepeatabilityList = getCheckedValues("repeatability");

        const memo = (document.getElementById("memo")?.value ?? "").trim();

        //tagはテキストをカンマ区切りで分割して配列に格納する。
        const tagsText = document.getElementById("tags")?.value ?? "";
        const tagsList = parseTags(tagsText);

        const notes = (document.getElementById("notes")?.value ?? "").trim();

        const paramsObject = {
          "name" : name,
          "rating" : rating,
          "drinkDate" : drinkDate,
          "sweetnessList" : checkedSweetnessList,
          "acidityList" :checkedAcidityList,
          "umamiList" : checkedUmamiList,
          "bodyLevelList" : checkedBodyLevelList,
          "aromaList" : checkedAromaList,
          "repeatabilityList" : checkedRepeatabilityList,
          "memo" : memo,
          "tagsList" : tagsList,
          "notes" : notes
        };

        //検索条件が入ったパラメーターを渡しつつindex.htmlに戻る
        const params = buildSearchParams(paramsObject)
        location.href = `index.html?${params.toString()}`;
    })

    clearBtn.addEventListener("click", () => {
      form.reset();
    });

})