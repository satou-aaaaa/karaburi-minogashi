# AGENTS.md

空振りと見逃し：雲の強さ（積乱雲の育ち方・レーダーの強さ）と町の「出す基準」を見て、大雨の知らせを出す・出さないを選び、結果（当たり・空振り・見逃し・正しく出さない）を選ぶ1日5問の学習ゲーム（防災シリーズ BS8。核の一言「基準を下げれば空振り、上げれば見逃し。どちらも0にはできない」）。10日・20日の記録で空振り・見逃しの日を数える問題、基準を動かす問題、気象庁の言葉と式・竜巻の本物の数字の問題も出る。「ためす」では同じ100日分の雲で基準を動かし、空振りと見逃しが入れかわるのを数える。`index.html` と `data.js`（問題の種類・雲の作り方）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（19種類×3000問：選び肢・答えは1つ・数え方と式の検算・2段目・出典）・シーソーと「両方0にできない」の検算・今日の5問と上級（3年分）・とことん・通しで遊ぶ・続きから・2段目・復習・ためす・数え上げ・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 言葉と式は気象庁「検証方法の説明」<https://www.data.jma.go.jp/fcd/yoho/kensho/explanation.html> と「予報の評価に関する用語」<https://www.jma.go.jp/jma/kishou/know/yougo_hp/hyoka.html>、本物の数字は気象庁「竜巻ナウキャストとは」<https://www.jma.go.jp/jma/kishou/know/toppuu/tornado3-1.html> だけ、「空振りを恐れず」は内閣府・消防庁の通知（令和5年9月15日）<https://www.bousai.go.jp/oukyu/hinankankoku/pdf/oame_hinanjoho.pdf> による（2026-11-27 に読んだ。要点は共有フォルダ games/karaburi-minogashi-research.md）。決まりの問題を足すときもページを読み、`qa/run.mjs` の `FACT` にも足す。
- 気象庁の式：適中率 ＝ (当たり＋正しく出さない) ÷ 全部、空振り率 ＝ 空振り ÷ 全部、見逃し率 ＝ 見逃し ÷ 全部、捕捉率 ＝ 当たり ÷ (当たり＋見逃し)。空振り率を「出した回数」で割らない。
- しくみ（目安・作り話。気象庁の計算ではない）：雲の強さ s（0〜100）の日に来る見込み p(s) ＝ 1 ÷ (1 ＋ e^(−(s − 55) ÷ 14))。強さが基準以上なら「出す」（基準ちょうどの強さは問題に出さない）。問題の雲は、答えが数えられる形になるまで種で作り直す（`strip`）。「ためす」の100日は日付の種で作り、どの基準でも空振りと見逃しの両方が0にならない並びだけを使う（`hundred`）。数え方は `qa/run.mjs` で別に書いて検算する。数を変えるときは「くわしく」「このゲームについて」・README・出典メモもそろえる。
- 言い方：遊び方と「このゲームについて」と README に、雲の強さと来るかどうかは目安の作り話で、本物の天気の記録ではないことを置く（QA が見る）。空振りを悪いことと言わない（避難の情報は空振りを恐れず早めに動く）。
- 問題の形。知らせの当番（出す・出さない・来てから出す）は、正解したら来たかどうかを見せ、2段目で結果（当たり・空振り・見逃し・正しく出さない）を選ぶ。ほかの問題に2段目は無い。やさしいは選び肢3つ、ほかは4つ（当番はいつも3つ）。2回目のヒントはまちがいを消して2つにしぼり、要点（`key`）も見せる。
- 今日の5問（やさしい2・ふつう2・むずかしい1、種類は重ねない）・上級（むずかしい3、今日のむずかしいと別）は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。乱数は `sort` の比較の中で引かない。`KINDS`・言い回し・まちがいの選び肢・`MID`・`W` は、変えると過去の日の問題が変わる。公開後は変えず、変えるときは QA の `PINS`（3日分の5問と上級）を作り直して理由を PR に書く。`data.js` を変える PR は自動ではマージされない（`hold_paths`）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし（答えのあとに結果の字が1つずつ出るのは時間制限ではない。「動きを減らす」ではすぐ数え終える）。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。とことん（`runs.e`）はまちがえても続き、「ここで降りる」で終わる。「ためす」は記録に入れない。
- 1問を深くする：`depth.js` と `qa/depth-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。自信あり・2段目「この日の結果は？」・復習（1→3→7日後）。記録 `krb-v1`・文字 `krb-fs`・復習 `krb-depth`。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない。感想は「感想を送る」を押したときに、全ゲーム共通の感想フォームを開くだけ（共通部品 game-core の `Core.bindFeedback`。開けないときの控えが Issue フォーム `.github/ISSUE_TEMPLATE/feedback.yml`）。応援は Ko-fi へのただのリンクだけ。
- 外へ通信しない（CSP の `connect-src 'self'` を広げない）。見やすさ（`<!-- a11y:begin -->`〜`end`・`qa/a11y.mjs`）と引き継ぎ（`transfer.js`・`qa/transfer-check.mjs`）は shared-workflows `template/` の写しで、ここでは直さない。
- 画面の土台は同じ防災シリーズの予報円のなか（yohouen-naka）から写した（ひな形の部品は `node scripts/new-game.mjs` で入れた）。写し元の言葉が残っていないかを QA が見る。保存の読み直しは共通部品 GameStore（`<!-- store:begin -->`〜`end`。shared-workflows `template/store/store.js` の写しで、ここでは直さない）。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする直前に今の head へのレビューを読み直す。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- 画面のあるページは、目的ごとに `screens.js`（shared-workflows の `template/screens/screens.js`）で # の画面に分け、1ページに全部を積まない（`routines/ui-rules.md` U10〜U12）。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
