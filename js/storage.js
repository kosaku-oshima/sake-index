// js/storage.js
const STORAGE_KEY = "sakeIndexEntries";

// たぶん保存済みデータを丸ごと全部とってきて配列に戻している。形式エラー時は[]を返す
export function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

//entriesとして受け取ったデータをJSON文字列に変えて保存する関数
export function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

//既存データすべてをentriesに配列型で入れ、そのなかに受け取ったentryと同じidがすでに存在するなら置き換え、なければ末尾に追加する関数（“末尾に追加”なので、表示順は index側で createdAt などで並べ替える前提。）
export function upsertEntry(entry) {
  const entries = loadEntries();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  saveEntries(entries);
}

//idをもとに特定のデータを検索する関数。見つからないとき undefined になるのを ?? null で nullに統一して返してます（扱いやすい）
export function findEntryById(id) {
  return loadEntries().find(e => e.id === id) ?? null;
}

//特定のid以外のデータだけ残す（実質削除）。localStorageは部分削除ができないため毎回すべて入れ替える。
export function deleteEntryById(id) {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

//ユニークなidを振るための関数。crypto.randomUUID() が使えれば UUID v4相当の形式でかなり安全。使えないときは「時刻＋乱数」で 被りにくい文字列を作るフォールバック（“絶対被らない”ではないけど、個人用途では十分なことが多い）
export function uuid() {
  // Chromeなら基本OK
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

//タグとして入力された文字列を整形する関数
export function parseTags(text) {
  // いったん「カンマ/読点/空白」で分割（後でチップ入力に置き換え）
  return (text ?? "")
    .split(/[,\u3001\s]+/)//splitを使うと、カンマ区切りで分割した文字列を配列に格納できる。
    .map(s => s.trim())
    .filter(Boolean);//trim()後に配列の要素の中で""になったものを除く処理。
}
