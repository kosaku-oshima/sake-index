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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    
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
})