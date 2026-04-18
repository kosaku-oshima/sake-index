const DB_NAME = "sakeIndexDB";
// データベースの名前
// ブラウザ内でこの名前の IndexedDB を使う

const DB_VERSION = 1;
// データベースのバージョン番号
// store や index の構造を変えたいときに数値を上げる

const STORE_NAME = "entries";
// object store の名前
// SQL でいうテーブルに近いイメージ


/**
 * IndexedDB を開く
 * 初回だけ objectStore を作る
 */
function openDB() {
  // IndexedDB はイベント型 API なので、
  // Promise に包んで await で使える形にする
  return new Promise((resolve, reject) => {
    // DB を開く依頼を出す
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 初回作成時、または DB_VERSION を上げたときに呼ばれる
    // DB の構造変更は基本ここで行う
    request.onupgradeneeded = (event) => {
      // 開かれた DB オブジェクト本体
      const db = event.target.result;

      // entries ストアがまだ存在しなければ新規作成
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // keyPath: "id" は、各レコードの主キーを id プロパティにするという意味
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });

        // index を作成
        // 今回のコードではまだ直接使っていないが、
        // 将来的に検索や並び替えをしやすくするための準備
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("name", "name", { unique: false });
      }
    };

    // DB を開くのに成功したとき
    request.onsuccess = () => {
      // request.result に DB オブジェクトが入る
      // Promise を成功させて呼び出し元へ返す
      resolve(request.result);
    };

    // DB を開くのに失敗したとき
    request.onerror = () => {
      // request.error にエラー情報が入る
      reject(request.error);
    };
  });
}


/**
 * transaction と objectStore を取得する共通関数
 */
async function getStore(mode = "readonly") {
  // まず DB を開く
  const db = await openDB();

  // transaction を作成する
  // "readonly" なら読み取り専用
  // "readwrite" なら書き込みも可能
  const tx = db.transaction(STORE_NAME, mode);

  // transaction から store を取り出す
  const store = tx.objectStore(STORE_NAME);

  // まとめて返す
  return { db, tx, store };
}


/**
 * 一覧を全部取得する
 * createdAt の降順で返す
 */
export async function loadEntries() {
  // 読み取り専用で store を取得
  const { db, tx, store } = await getStore("readonly");

  // getAll() も非同期なので Promise に包む
  return new Promise((resolve, reject) => {
    // 全件取得を依頼
    const request = store.getAll();

    // 取得成功時
    request.onsuccess = () => {
      // request.result に結果配列が入る
      // null や undefined の場合は空配列にする
      const entries = request.result ?? [];

      // createdAt の新しい順に並び替え
      entries.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      // 呼び出し元へ返す
      resolve(entries);

      // DB を閉じる
      db.close();
    };

    // request 単体が失敗したとき
    request.onerror = () => {
      reject(request.error);
      db.close();
    };

    // transaction 全体で失敗したとき
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}


/**
 * id で1件取得する
 */
export async function loadEntryById(id) {
  // 読み取り専用で store を取得
  const { db, tx, store } = await getStore("readonly");

  return new Promise((resolve, reject) => {
    // 指定 id のデータを 1 件取得
    const request = store.get(id);

    // 取得成功時
    request.onsuccess = () => {
      // 見つからなければ null を返す
      resolve(request.result ?? null);
      db.close();
    };

    // request 単体の失敗
    request.onerror = () => {
      reject(request.error);
      db.close();
    };

    // transaction 全体の失敗
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}


/**
 * 1件そのまま保存する
 * id が同じものがあれば上書き
 */
export async function saveEntry(entry) {
  // 保存処理なので readwrite
  const { db, tx, store } = await getStore("readwrite");

  return new Promise((resolve, reject) => {
    // put は「同じキーがあれば上書き、なければ新規追加」
    const request = store.put(entry);

    // request 自体が成功したとき
    request.onsuccess = () => {
      // 保存した entry をそのまま返す
      resolve(entry);
    };

    // request 自体が失敗したとき
    request.onerror = () => {
      reject(request.error);
    };

    // transaction 全体が完了したとき
    // 書き込み系は request 成功だけでなく
    // transaction 完了まで見てから DB を閉じると安全
    tx.oncomplete = () => {
      db.close();
    };

    // transaction 全体の失敗
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}


/**
 * 新規登録・更新をまとめて行う
 * createdAt は初回のみ設定
 * updatedAt は毎回更新
 */
export async function upsertEntry(entry) {
  // 現在時刻を取得
  const now = Date.now();

  // id がなければ新規データなので id を作る
  if (!entry.id) {
    entry.id = createEntryId();
  }

  // 既存データがあるか確認する
  const existing = await loadEntryById(entry.id);

  // 保存前にデータを整える
  const normalizedEntry = {
    // まず既存データをベースにする
    ...existing,

    // その上に今回の入力内容を重ねる
    ...entry,

    // createdAt は初回作成時の値を優先して維持
    createdAt: existing?.createdAt ?? entry.createdAt ?? now,

    // updatedAt は毎回今の時刻に更新
    updatedAt: now,
  };

  // 整形したデータを保存
  await saveEntry(normalizedEntry);

  // 保存した内容を返す
  return normalizedEntry;
}


/**
 * 1件削除する
 */
export async function deleteEntry(id) {
  // 削除なので readwrite
  const { db, tx, store } = await getStore("readwrite");

  return new Promise((resolve, reject) => {
    // 指定 id のデータを削除
    const request = store.delete(id);

    // 削除成功時
    request.onsuccess = () => {
      // 特に返す値はないので resolve() だけでよい
      resolve();
    };

    // request 単体の失敗
    request.onerror = () => {
      reject(request.error);
    };

    // transaction 完了時に DB を閉じる
    tx.oncomplete = () => {
      db.close();
    };

    // transaction 全体の失敗
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}


/**
 * タグ文字列を配列にする
 * 例:
 * "フルーティー, 香り高い　軽快"
 * → ["フルーティー", "香り高い", "軽快"]
 */
export function parseTags(value) {
  // 空なら空配列
  if (!value) return [];

  return value
    // カンマ、半角スペース、全角スペース、読点などで分割
    .split(/[,\s、　]+/)
    // 前後の空白を削る
    .map(tag => tag.trim())
    // 空文字を除外
    .filter(Boolean);
}


/**
 * 一意なIDを作る
 */
export function createEntryId() {
  // 使える環境なら標準の UUID を使う
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  // 使えない環境では日時 + 乱数で代替
  return `entry-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}