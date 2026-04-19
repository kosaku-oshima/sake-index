import { setupNavLinks } from "./nav.js";
import { upsertEntry, parseTags } from "./storage.js";
import { buildPageUrl } from "./query.js";

//お気に入り度の値を取得し、なければnullを返す
function getRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? Number(checked.value) : null;
}

//写真プレビュー用のモーダル
function setupImageModal() {
  const preview = document.getElementById("imagePreview");
  const modal = document.getElementById("imageModal");
  const modalPreview = document.getElementById("imageModalPreview");
  const closeBtn = document.getElementById("imageModalClose");

  if (!preview || !modal || !modalPreview || !closeBtn) return;

  preview.addEventListener("click", () => {
    if (!preview.src || preview.hidden) return;
    modalPreview.src = preview.src;
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    modalPreview.removeAttribute("src");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      modalPreview.removeAttribute("src");
    }
  });
}

//画像のプレビュー表示を制御するために使う変数
let currentImageUrl = null;

//==================================================
// 画面読み込み時の処理
//==================================================
//ページ読み込み時に現在日付をセットする関数
document.addEventListener("DOMContentLoaded", () => {
  //formがなかったら処理を終える
  const form = document.querySelector("form");
  if (!form) return; 

  //ナブバーのリンク先を設定（全画面共通で入れる）
  setupNavLinks();

  //キャンセルリンク押下時の行先を先に確定させておく処理。リンククリック時に行先を操作するとうまくつながらない可能性があるため
  const backToListLink = document.getElementById("backToList");
  if (backToListLink) {
    const backUrl = buildPageUrl("index.html", window.location.search, {});
    backToListLink.href = backUrl;
  }

  // 日付の初期値を今日にする
  const dateInput = document.getElementById("drinkDate");
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  //画像周りの要素を取得
  const imageInput = document.getElementById("image");
  const imageSelectBtn = document.getElementById("imageSelectBtn");
  const imageDeleteBtn = document.getElementById("imageDeleteBtn");

  //画像のプレビューモーダルを展開できるようにする
  setupImageModal();

  //画像選択時の処理
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const imageEl = document.getElementById("imagePreview");
      const previewWrap = document.getElementById("imagePreviewWrap");
      const imageFile = imageInput.files?.[0] ?? null;
  
      if (!imageEl || !previewWrap) return;
  
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = null;
      }
  
      if (!imageFile) {
        imageEl.hidden = true;
        imageEl.removeAttribute("src");
        previewWrap.hidden = true;
        return;
      }
  
      // 画像ファイルかチェック
      if (!imageFile.type.startsWith("image/")) {
        alert("画像ファイルを選択してください。");
        imageInput.value = "";
        imageEl.hidden = true;
        imageEl.removeAttribute("src");
        previewWrap.hidden = true;
        return;
      }
  
      // サイズチェック
      if (imageFile.size > 5 * 1024 * 1024) {
        alert("画像は5MB以下にしてください。");
        imageInput.value = "";
        imageEl.hidden = true;
        imageEl.removeAttribute("src");
        previewWrap.hidden = true;
        return;
      }
  
      currentImageUrl = URL.createObjectURL(imageFile);
      imageEl.src = currentImageUrl;
      imageEl.hidden = false;
      previewWrap.hidden = false;
    });
  }

  //画像アイコン押下時の処理
  if (imageInput && imageSelectBtn) {
    imageSelectBtn.addEventListener("click", () => {
      imageInput.click();
    });
  }

  //画像削除ボタン押下時の処理
  if (imageDeleteBtn) {
    imageDeleteBtn.addEventListener("click", () => {
  
      if (imageInput) {
        imageInput.value = "";
      }
  
      const imageEl = document.getElementById("imagePreview");
      const previewWrap = document.getElementById("imagePreviewWrap");
  
      if (imageEl) {
        if (currentImageUrl) {
          URL.revokeObjectURL(currentImageUrl);
          currentImageUrl = null;
        }
        imageEl.hidden = true;
        imageEl.removeAttribute("src");
      }
  
      if (previewWrap) {
        previewWrap.hidden = true;
      }
    });
  }

  //フォーム送信時の処理、各項目の入力値を取得し、無い場合は項目ごとにデフォルト値（基本null）を入れてentryというデータの塊を作る。
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const name = (document.getElementById("name")?.value ?? "").trim();
      const drinkDateRaw = document.getElementById("drinkDate")?.value ?? ""; //データがない場合に必ず""になってしまうようなので、1行使ってnullに変換する
      const drinkDate = drinkDateRaw === "" ? null : drinkDateRaw;
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
      const tagsText = document.getElementById("tags")?.value ?? "";
      const notes = (document.getElementById("notes")?.value ?? "").trim();
      const imageFile = document.getElementById("image")?.files?.[0] ?? null;
      

    //入力チェック
      if (!name) {
        alert("酒名は入力必須です。");
        return; //エラーのあとに保存せず止める処理。このreturnがないとエラーが出ているのにデータが保存される。
      }
      if (name.length > 50) {
        alert("酒名は50文字以内で入力してください。")
        return;
      }
      if (notes.length > 200) {
        alert("備考は200文字以内で入力してください。")
        return;
      }
      if (imageFile && !imageFile.type.startsWith("image/")) {
        alert("画像ファイルを選択してください。");
        return;
      }
      if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        alert("画像は5MB以下にしてください。");
        return;
      }

      //id,createdAt,updatedAtはstorage.js内のupsertEntry()関数で入れるのでここでは入れない。
      const entry = {
        name,
        rating: getRating(),
        drinkDate,   // 任意（今日が初期）
        sweetness,
        acidity,
        umami,
        bodyLevel,
        aroma,
        repeatability,
        memo,
        tags: parseTags(tagsText),
        notes,
        image: imageFile ? {
          blob: imageFile,
          name: imageFile.name,
          type: imageFile.type,
          size: imageFile.size
        } : null,
      };

      //登録処理。storage.jsの非同期処理を使うのでawaitを付ける。
      await upsertEntry(entry);
      //登録後index.htmlに戻る処理
      const backUrl = buildPageUrl("index.html", window.location.search, {});
      location.href = backUrl;
    } catch (error) {
      console.error("フォームの送信に失敗しました", error);
      alert("保存に失敗しました。コンソールを確認してください。");
    }
  });
});

window.addEventListener("beforeunload", () => {
  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = null;
  }
});
