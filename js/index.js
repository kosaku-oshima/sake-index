import { setupNavLinks } from "./nav.js";
import { loadEntries } from "./storage.js";
import {getSearchParamsFromUrl, buildPageUrl} from "./query.js";
// 一覧表示している画像のURLを格納する配列。毎回再描画時にリセットする想定。
const objectUrls = [];

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
  //escapeHtml()でタグになりうる文字は別の表現に置き換える。
  const tags = (entry.tags ?? []).slice(0, 3).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
  const ratingRaw = entry.rating ?? 0
  const rating = "★".repeat(ratingRaw) + "☆".repeat(5 - ratingRaw);
 
  //閲覧編集画面のURLを作成する処理。パラメーターに検索条件があればそこにidを付け加える
  const detailUrl = buildPageUrl("detail.html", window.location.search, { id: entry.id});

  //抽出した1つのデータに応じてhtmlを生成し返す。画像があるときだけは画像のプレビューを追加する。
  let imageHtml = "";
  if (entry.image?.blob) {
    const imageUrl = URL.createObjectURL(entry.image.blob);
    //画像のURLを配列にためておく。画面再描画時にURLを削除するため。
    objectUrls.push(imageUrl);
    imageHtml = `
      <div class="card-image-wrap">
        <img
          src="${imageUrl}"
          alt="${escapeHtml(entry.name ?? "")} の写真"
          class="card-image-preview"
        >
      </div>
    `;
  }

  return `
  <div class="card">
    <a href="${detailUrl}">
      <div class="card-title">${escapeHtml(entry.name ?? "")}</div>
      <div class="card-rating">${rating}</div>
      <div class="card-memo">${escapeHtml(entry.memo ?? "")}</div>
      <div class="card-tags">${tags}</div>
      ${imageHtml}
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

//データと並び順と置き換えるDOM要素を受け取って画面に描画する関数。プレビュー表示に使う画像URLのリセットもここで行う。
function renderList(entries, sortValue, listEl, resultCount) {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls.length = 0;

  const sortedEntries = sortEntries(entries, sortValue);

  //一覧表示するデータの件数をセットする
  if (resultCount) {
    resultCount.textContent = `${sortedEntries.length}件`;
  }

  listEl.innerHTML = sortedEntries.map(renderCard).join("");
}


//==================================================
// 画面読み込み時の処理
//==================================================
// ページ読み込み完了（DOMContentLoaded）時に、index.html内の.card-list 要素を取得し、保存済みデータを読み込む。
// 登録日降順に並べ替え、各要素を renderCard() でHTML文字列に変換して連結し、listEl.innerHTML に代入して一覧を表示する。
// データが0件なら空表示メッセージを入れる。
// 検索条件があれば、その条件に合うデータを抽出して表示する。
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const listEl = document.querySelector(".card-list");

    const clearFilterBtn = document.getElementById("clearFilterBtn");
    if (clearFilterBtn && window.location.search !== "") {
      clearFilterBtn.hidden = false;
    }

    //ナブバーのリンク先を設定（全画面共通で入れる）
    setupNavLinks();

    //html内にcard-listクラスの要素がなければ処理を終える
    if (!listEl) return;

    //保存済みデータがあるか確認する。storage.js内の非同期処理を使うのでawaitを付ける。
    const entries = await loadEntries();
    if (entries.length === 0) {
      listEl.innerHTML = `<div class="empty">記録がありません。右上の「追加」から登録してみてください。</div>`;
      return;
    }

    //URLのパラメーターから検索条件を取得し、各変数に代入する。
    const searchParams = getSearchParamsFromUrl(window.location.search);
    //変数を元にデータを絞り込む。
    const filteredEntries = filterEntries(searchParams, entries);
    //一覧表示している件数を表示する要素の取得。
    const resultCount = document.getElementById("resultCount");

    //絞り込み解除ボタンが押されたらパラメータがない状態でindex.htmlに移動する
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener("click", () => {
        location.href = "index.html";
      });
    }

    if (filteredEntries.length === 0) {
      listEl.innerHTML = `<div class="none">検索条件に合うデータがありません。</div>`;
      return;
    }

    //並び替えボタンが押されたらデータを並び変える    
    // URLのsortパラメータを初期値として反映する。
    // パラメータがなければ既定値は登録日が新しい順。
    const sortOrder = document.getElementById("sortOrder");
    if (!sortOrder) return;

    const allowedSortValues = [
      "createdAt-asc",
      "createdAt-desc",
      "name-asc",
      "name-desc",
      "rating-asc",
      "rating-desc",
    ];

    const sortFromUrl = new URLSearchParams(window.location.search).get("sort");
    sortOrder.value = allowedSortValues.includes(sortFromUrl)
      ? sortFromUrl
      : "createdAt-desc";

    //データを一覧表示
    renderList(filteredEntries, sortOrder.value, listEl, resultCount);

    sortOrder.addEventListener("change", () => {
      const params = new URLSearchParams(window.location.search);
      params.set("sort", sortOrder.value);
    
      history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    
      renderList(filteredEntries, sortOrder.value, listEl, resultCount);
    });
  } catch (error) {
    console.error("一覧の読み込みに失敗しました", error);
  }
});

// 画像プレビュー表示に使ったURLを削除する。
// renderList() の再描画時に加えて、画面を離れる直前にも念のため解放する。
window.addEventListener("beforeunload", () => {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls.length = 0;
});
