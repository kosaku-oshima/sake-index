document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    
  　//フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（""や0など）を入れてentryというデータの塊を作る。
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const params = new URLSearchParams();

        const name = (document.getElementById("name")?.value ?? "").trim();
        const rating = Number(document.getElementById("rating")?.value ?? 0);
        // const file = document.querySelector('input[name="file"]:checked')?.value ?? "";
        const drinkDate = document.getElementById("drinkDate")?.value ?? "";
        const memo = (document.getElementById("memo")?.value ?? "").trim();
        const tags = (document.getElementById("tags")?.value ?? "").trim();
        const sweetness = Number(document.getElementById("sweetness")?.value ?? 0);
        const bodyLevel = Number(document.getElementById("bodyLevel")?.value ?? 0);
        
        if (name) params.set("name", name);
        if (rating) params.set("rating", rating);
        // if (file) params.set("file", file);
        if (drinkDate) params.set("drinkDate", drinkDate);
        if (memo) params.set("memo", memo);
        if (tags) params.set("tags", tags);
        //ifの条件に"0"が入るとfalseになってしまうため、sweetnessは値でなく「空欄かどうか」で条件を書く。
        if (document.getElementById("sweetness")?.value !== "") {
            params.set("sweetness", sweetness)
        };
        //同様に空欄かどうかで判定する。
        if (document.getElementById("bodyLevel")?.value !== "") {
            params.set("bodyLevel", bodyLevel)
        };

        //検索条件が入ったパラメーターを渡しつつindex.htmlに戻る
        location.href = `index.html?${params.toString()}`;
    })
})