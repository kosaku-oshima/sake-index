import { parseTags } from "./storage.js";

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
  //パラメータ全体を取得
  const params = new URLSearchParams(location.search);
  //パラメータから各値を取得
  const name = params.get("name");
  const rating = params.get("rating");
  const drinkDate = params.get("drinkDate");
  const sweetnessList = params.getAll("sweetness").map(Number);
  const acidityList = params.getAll("acidity").map(Number);
  const umamiList = params.getAll("umami").map(Number);
  const bodyLevelList = params.getAll("bodyLevel").map(Number);
  const aromaList = params.getAll("aroma").map(Number);
  const repeatabilityList = params.getAll("repeatability").map(Number);
  const memo = params.get("memo");
  const tagsList = params.getAll("tags");//getAll()するとURLにtagが複数入っていたとしても一つの配列に格納された状態で取得できる。
  const notes = params.get("notes");
  //各値を初期値としてセット
  setInputValue("name", name);
  setRadioChecked("rating", rating);
  setInputValue("drinkDate", drinkDate);
  setCheckboxChecked("sweetness", sweetnessList);
  setCheckboxChecked("acidity", acidityList);
  setCheckboxChecked("umami", umamiList);
  setCheckboxChecked("bodyLevel", bodyLevelList);
  setCheckboxChecked("aroma", aromaList);
  setCheckboxChecked("repeatability", repeatabilityList);
  setInputValue("memo", memo);
  setInputValue("tags", tagsList.join(", "));
  setInputValue("notes", notes);
}

//==================================================
// 画面読み込み時の処理
//==================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    const clearBtn = document.getElementById("clearBtn");
    const backToListLink = document.getElementById("backToList");
    //キャンセルリンク押下時の行先を先に確定させておく処理。リンククリック時に行先を操作するとうまくつながらない可能性があるため
    if (backToListLink) {
      const backParams = new URLSearchParams(window.location.search);
      const backUrl = backParams.toString()
        ? `index.html?${backParams.toString()}`
        : "index.html";
    
      backToListLink.href = backUrl;
    }

    //パラメータを元に各項目の初期値をセット
    fillFormFromParams();
    
    //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（基本null）を入れてentryというデータの塊を作る。
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const params = new URLSearchParams();

        const name = (document.getElementById("name")?.value ?? null).trim();
        const rating = getRating();
        // const file = document.querySelector('input[name="file"]:checked')?.value ?? "";
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
        
        if (name !== "") params.set("name", name);
        if (rating !== null) params.set("rating", rating);
        // if (file) params.set("file", file);
        if (drinkDate !== "") params.set("drinkDate", drinkDate);
        if (checkedSweetnessList.length > 0) checkedSweetnessList.forEach(value => params.append("sweetness", value));
        if (checkedAcidityList.length > 0) checkedAcidityList.forEach(value => params.append("acidity", value));
        if (checkedUmamiList.length > 0) checkedUmamiList.forEach(value => params.append("umami", value));
        if (checkedBodyLevelList.length > 0) checkedBodyLevelList.forEach(value => params.append("bodyLevel", value));
        if (checkedAromaList.length > 0) checkedAromaList.forEach(value => params.append("aroma", value));
        if (checkedRepeatabilityList.length > 0) checkedRepeatabilityList.forEach(value => params.append("repeatability", value));

        if (memo !== "") params.set("memo", memo);

        if (tagsList.length > 0) tagsList.forEach(value => params.append("tags", value));
        
        if (notes !== "") params.set("notes", notes);

        //検索条件が入ったパラメーターを渡しつつindex.htmlに戻る
        location.href = `index.html?${params.toString()}`;
    })

    clearBtn.addEventListener("click", () => {
      form.reset();
    });

})