import { loadEntries } from "./storage.js";

//文字列sにhtmlタグで使われる文字が入っていたら別の表現に置き換える処理
//innerHTMLに埋め込んでもタグとして解釈されないようにする安全化
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

//保存済みデータentryの要素一つに対してそれを描画するためのhtmlを1塊返す処理
function renderCard(entry) {
  //とってきたentryデータからタグとお気に入り度の値を抽出
  //(1)entry.tags が null/undefined のときは [] にする
  //(2)slice(0, 3) で 最大3つに制限
  //(3)map で <span> に変換
  //(4)join("") で 連結して1つの文字列にする
  const tags = (entry.tags ?? []).slice(0, 3).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
  const ratingRaw = entry.rating ?? 0
  const rating = "★".repeat(ratingRaw) + "☆".repeat(5 - ratingRaw);
 
  //閲覧編集画面のURLを作成する処理。パラメーターに検索条件があればそこにidを付け加える
  const currentParams = new URLSearchParams(window.location.search);
  const detailUrl = new URL("detail.html", window.location.href);
  detailUrl.searchParams.set("id", entry.id);
  for (const [key, value] of currentParams.entries()) {
    if (key !== "id") {
      detailUrl.searchParams.append(key, value);
    }
  }

  //抽出した1つのデータに応じてhtmlを生成し返す。escapeHtml()でタグになりうる文字は別の表現に置き換える。
  return `
  <div class="card">
    <a href=${detailUrl}>
      <div class="card-title">${escapeHtml(entry.name ?? "")}</div>
      <div class="card-rating">${rating}</div>
      <div class="card-memo">${escapeHtml(entry.memo ?? "")}</div>
      <div class="card-tags">${tags}</div>
    </a>
  </div>  
  `;
}

//並び替えボタンが押されたらデータを並び変える
function sortEntries(entries, sortOrder) {
  const copied = [...entries];

  switch (sortOrder) {
    case "createdAt-asc":
      copied.sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));
      break;
    case "createdAt-desc":
      copied.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
      break;
    case "name-asc":
      copied.sort((a, b) => (a.name ?? "").localeCompare((b.name ?? ""), "ja"));
      break;
    case "name-desc":
      copied.sort((a, b) => (b.name ?? "").localeCompare((a.name ?? ""), "ja"));
      break;
    case "rating-desc":
      copied.sort((a, b) => {
        const ratingDiff = Number(b.rating ?? 0) - Number(a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0);
      });
      break;
    case "rating-asc":
      copied.sort((a, b) => {
        const ratingDiff = Number(a.rating ?? 0) - Number(b.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0);
    });
      break;
  }

  return copied;
}

//URLのパラメーターから検索条件を取得し、各変数に代入して返す関数。
function getSearchParams() {
  const params = new URLSearchParams(location.search);
  return {
    name : params.get("name"),
    rating : params.get("rating"),
    drinkDate : params.get("drinkDate"),
    sweetnessList : params.getAll("sweetness").map(Number),
    acidityList : params.getAll("acidity").map(Number),
    umamiList : params.getAll("umami").map(Number),
    bodyLevelList : params.getAll("bodyLevel").map(Number),
    aromaList : params.getAll("aroma").map(Number),
    repeatabilityList : params.getAll("repeatability").map(Number),
    memo : params.get("memo"),
    tagsList : params.getAll("tags"),
    notes : params.get("notes")
  };
};

//検索条件を元にデータを絞り込む関数
function filterEntries (searchParams, entries) {
  const filteredEntries = entries.filter(entry => {
    if (searchParams.name && !(entry.name ?? "").includes(searchParams.name)) return false;
    if (searchParams.rating && Number(entry.rating ?? 0) < Number(searchParams.rating)) return false;//指定したrating以上を絞るための条件
    // if (file && entry.file !== file) return false;
    if (searchParams.drinkDate && entry.drinkDate !== searchParams.drinkDate) return false;
    if (searchParams.sweetnessList.length > 0 && !searchParams.sweetnessList.includes(Number(entry.sweetness))) return false;
    if (searchParams.acidityList.length > 0 && !searchParams.acidityList.includes(Number(entry.acidity))) return false;
    if (searchParams.umamiList.length > 0 && !searchParams.umamiList.includes(Number(entry.umami))) return false;
    if (searchParams.bodyLevelList.length > 0 && !searchParams.bodyLevelList.includes(Number(entry.bodyLevel))) return false;
    if (searchParams.aromaList.length > 0 && !searchParams.aromaList.includes(Number(entry.aroma))) return false;
    if (searchParams.repeatabilityList.length > 0 && !searchParams.repeatabilityList.includes(Number(entry.repeatability))) return false;
    if (searchParams.memo && !(entry.memo ?? "").includes(searchParams.memo)) return false;
    if (searchParams.tagsList.length > 0 && !searchParams.tagsList.every(tag => (entry.tags ?? []).includes(tag))) return false;//AND検索なのでevery、もしOR検索にするならsomeを使う。
    if (searchParams.notes && !(entry.notes ?? "").includes(searchParams.notes)) return false;
    return true;
  });
  return filteredEntries;
}

//データと並び順と置き換えるDOM要素を受け取って画面に描画する関数
function renderList (entries, sortOrder, listEl) {
    const sortedEntries = sortEntries(entries, sortOrder.value);
    listEl.innerHTML = sortedEntries.map(renderCard).join("");
}

//==================================================
// 画面読み込み時の処理
//==================================================
// ページ読み込み完了（DOMContentLoaded）時に、index.html内の.card-list 要素を取得し、保存済みデータを読み込む。
// 登録日降順に並べ替え、各要素を renderCard() でHTML文字列に変換して連結し、listEl.innerHTML に代入して一覧を表示する。
// データが0件なら空表示メッセージを入れる。
// 検索条件があれば、その条件に合うデータを抽出して表示する。
document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.querySelector(".card-list");
  //「絞り込みを解除ボタン」を取得し、URLにパラメータがあれば表示する。
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  if (clearFilterBtn && window.location.search !== "") {
    clearFilterBtn.hidden = false;
  }

  //html内にcard-listクラスの要素がなければ処理を終える
  if (!listEl) return;

  //保存済みデータがあるか確認する
  const entries = loadEntries();
  if (entries.length === 0) {
    listEl.innerHTML = `<div class="empty">記録がありません。右上の「追加」から登録してみてください。</div>`;
    return;
  }

  //URLのパラメーターから検索条件を取得し、各変数に代入する。
  const searchParams = getSearchParams();
  //変数を元にデータを絞り込む。
  const filteredEntries = filterEntries(searchParams, entries);

  //並び替えボタンが押されたらデータを並び変える
  const sortOrder = document.getElementById("sortOrder");

  //絞り込み解除ボタンが押されたらパラメータがない状態でindex.htmlに移動する
  clearFilterBtn.addEventListener("click", () => {
    location.href = "index.html";
  })

  //検索ボタンが押されたらURL内のパラメータをそのまま渡す
  const searchMenuBtn = document.getElementById("searchMenuBtn");
  const searchMenuParams = new URLSearchParams(window.location.search);
  const searchMenuUrl = searchMenuParams.toString()
    ? `search.html?${searchMenuParams.toString()}`
    : "search.html";
  searchMenuBtn.href = searchMenuUrl;

  if (filteredEntries.length === 0) {
    listEl.innerHTML = `<div class="none">検索条件に合うデータがありません。</div>`;
    return;
  }

  renderList(filteredEntries, sortOrder, listEl);
  sortOrder.addEventListener("change", () => {
    renderList(filteredEntries, sortOrder, listEl);
  });

});
