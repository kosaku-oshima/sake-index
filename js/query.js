// 共通化してよいもの
// ・複数画面で同じ意味を持つ
// ・DOM依存が少ない
// ・再利用時に説明しやすい

//URLから検索条件を読む関数
export function getSearchParamsFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  return {
    name: params.get("name") ?? "",
    rating: params.get("rating"),
    drinkDate: params.get("drinkDate") ?? "",
    sweetnessList: params.getAll("sweetness").map(Number),
    acidityList: params.getAll("acidity").map(Number),
    umamiList: params.getAll("umami").map(Number),
    bodyLevelList: params.getAll("bodyLevel").map(Number),
    aromaList: params.getAll("aroma").map(Number),
    repeatabilityList: params.getAll("repeatability").map(Number),
    memo: params.get("memo") ?? "",
    tagsList: params.getAll("tags"),
    notes: params.get("notes") ?? ""
  };
}

//値が入ったオブジェクトからURLパラメータを作る関数。フォームの値を入れて新しいURLに遷移したいときに使う。
export function buildSearchParams(searchValues) {
    const params = new URLSearchParams();
  
    if (searchValues.name) params.set("name", searchValues.name);
    if (searchValues.rating !== null && searchValues.rating !== "") {
      params.set("rating", searchValues.rating);
    }
    if (searchValues.drinkDate) params.set("drinkDate", searchValues.drinkDate);
  
    if (searchValues.sweetnessList?.length) {
      searchValues.sweetnessList.forEach(v => params.append("sweetness", v));
    }
    if (searchValues.acidityList?.length) {
      searchValues.acidityList.forEach(v => params.append("acidity", v));
    }
    if (searchValues.umamiList?.length) {
      searchValues.umamiList.forEach(v => params.append("umami", v));
    }
    if (searchValues.bodyLevelList?.length) {
      searchValues.bodyLevelList.forEach(v => params.append("bodyLevel", v));
    }
    if (searchValues.aromaList?.length) {
      searchValues.aromaList.forEach(v => params.append("aroma", v));
    }
    if (searchValues.repeatabilityList?.length) {
      searchValues.repeatabilityList.forEach(v => params.append("repeatability", v));
    }
  
    if (searchValues.memo) params.set("memo", searchValues.memo);
    if (searchValues.tagsList?.length) {
      searchValues.tagsList.forEach(v => params.append("tags", v));
    }
    if (searchValues.notes) params.set("notes", searchValues.notes);
  
    return params;
}

//現在のURLのパラメータを引き継ぎながら移動先URLを作る関数
// 引数：
// ・path → 行き先ページ
// ・search → 引き継ぎたい現在のクエリ文字列
// ・extraParams → 追加・変更・削除したいパラメータ
// 例：一覧から詳細へ
// location.href = buildPageUrl("detail.html", window.location.search, { id: entry.id });
export function buildPageUrl(path, search = window.location.search, extraParams = {}) {
    const url = new URL(path, window.location.href);
    const currentParams = new URLSearchParams(search);

    for (const [key, value] of currentParams.entries()) {
        url.searchParams.append(key, value);
    }

    for (const [key, value] of Object.entries(extraParams)) {
        url.searchParams.delete(key);
        if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, value);
        }
    }

    return url.toString();
}
