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

　//抽出した1つのデータに応じてhtmlを生成し返す。escapeHtml()でタグになりうる文字は別の表現に置き換える。
  return `
  <div class="card">
    <a href="detail.html?id=${encodeURIComponent(entry.id)}">
      <div class="card-title">${escapeHtml(entry.name ?? "")}</div>
      <div class="card-rating">${rating}</div>
      <div class="card-memo">${escapeHtml(entry.memo ?? "")}</div>
      <div class="card-tags">${tags}</div>
    </a>
  </div>  
  `;
}

//index.jsの処理
// ページ読み込み完了（DOMContentLoaded）時に、index.html内の.card-list 要素を取得し、保存済みデータを読み込む。
// 登録日降順に並べ替え、各要素を renderCard() でHTML文字列に変換して連結し、listEl.innerHTML に代入して一覧を表示する。
// データが0件なら空表示メッセージを入れる。
// 検索条件があれば、その条件に合うデータを抽出して表示する。
document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.querySelector(".card-list");
  if (!listEl) return;

  const entries = loadEntries()
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // 登録日降順

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="empty">まだ記録がありません。右上の「追加」から登録してみてください。</div>`;
    return;
  }

  //URLのパラメーターから検索条件を取得し、各変数に代入する。
  const params = new URLSearchParams(location.search);
  if (params.size > 0) {
    // const entry = {
    //   id: uuid(),
    //   name,
    //   rating: getRating(),
    //   drinkDate,   // 任意（今日が初期）
    //   sweetness,
    //   acidity,
    //   umami,
    //   bodyLevel,
    //   aroma,
    //   repeatability,
    //   memo,
    //   tags: parseTags(tagsText),
    //   notes,
    //   createdAt: Date.now(), // ソート用（登録日時）
    // };
    const name = params.get("name");
    const rating = params.get("rating");
    // const file = params.get("file");
    const drinkDate = params.get("drinkDate");
    const sweetnessList = params.getAll("sweetness").map(Number);
    const acidityList = params.getAll("acidity").map(Number);
    const umamiList = params.getAll("umami").map(Number);
    const bodyLevelList = params.getAll("bodyLevel").map(Number);
    const aromaList = params.getAll("aroma").map(Number);
    const repeatabilityList = params.getAll("repeatability").map(Number);
    const memo = params.get("memo");
    const tags = params.get("tags");
    const notes = params.get("notes");

    const filteredEntries = entries.filter(entry => {
      if (name && !entry.name.includes(name)) return false;
      if (rating && entry.rating < Number(rating)) return false;//指定したrating以上を絞るための条件
      // if (file && entry.file !== file) return false;
      if (drinkDate && entry.drinkDate !== drinkDate) return false;
      if (sweetnessList.length > 0 && !sweetnessList.includes(entry.sweetness)) return false;
      if (acidityList.length > 0 && !acidityList.includes(entry.acidity)) return false;
      if (umamiList.length > 0 && !umamiList.includes(entry.umami)) return false;
      if (bodyLevelList.length > 0 && !bodyLevelList.includes(entry.bodyLevel)) return false;
      if (aromaList.length > 0 && !aromaList.includes(entry.aroma)) return false;
      if (repeatabilityList.length > 0 && !repeatabilityList.includes(entry.repeatability)) return false;
      if (memo && !entry.memo.includes(memo)) return false;
      if (tags && !(entry.tags ?? []).includes(tags)) return false;
      if (notes && !entry.notes.includes(notes)) return false;
      return true;
    })

    if (filteredEntries.length === 0) {
      listEl.innerHTML = `<div class="none">検索条件に合うデータがありません。</div>`;
      return;
    }

    listEl.innerHTML = filteredEntries.map(renderCard).join("");
    return;
  }

  listEl.innerHTML = entries.map(renderCard).join("");
});
