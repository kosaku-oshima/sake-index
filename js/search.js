//お気に入り度の値を取得し、なければnullを返す
function getRating() {
    const checked = document.querySelector('input[name="rating"]:checked');
    return checked ? Number(checked.value) : null;
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
        const tags = document.getElementById("tags")?.value ?? "";
        const notes = (document.getElementById("notes")?.value ?? "").trim();
        
        //ifの条件に"0"が入るとfalseになってしまうため、sweetness等は値でなく「空欄かどうか」で条件を書く。
        if (name !== "") params.set("name", name);
        if (rating !== null) params.set("rating", rating);
        // if (file) params.set("file", file);
        if (drinkDate !== "") params.set("drinkDate", drinkDate);
        if (sweetness !== null) params.set("sweetness", sweetness);
        if (acidity !== null) params.set("acidity", acidity);
        if (umami !== null) params.set("umami", umami);
        if (bodyLevel !== null) params.set("bodyLevel", bodyLevel);
        if (aroma !== null) params.set("aroma", aroma);
        if (repeatability !== null) params.set("repeatability", repeatability);
        if (memo !== "") params.set("memo", memo);
        if (tags !== "") params.set("tags", tags);
        if (notes !== "") params.set("notes", notes);

        //検索条件が入ったパラメーターを渡しつつindex.htmlに戻る
        location.href = `index.html?${params.toString()}`;
    })
})