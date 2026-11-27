// 空振りと見逃しの問題を作る（ブラウザと node の両方で使う）。
// 言葉と式は、気象庁「検証方法の説明」「予報の評価に関する用語」、数字は気象庁「竜巻ナウキャストとは」、
// 「空振りを恐れず」は内閣府・消防庁の通知（令和5年9月15日）による（2026-11-27 に読んだ。要点は共有フォルダ games/karaburi-minogashi-research.md）。
// 空振り＝知らせを出したのに来なかった。見逃し＝出さなかったのに来た（気象庁の「降水あり」「降水なし」の予報の言い方を、知らせを出す・出さないに置きかえた）。
// しくみ（目安。ゲームの中の作り話で、気象庁の計算ではない）：雲の強さ s（0〜100。積乱雲の発達・レーダーの強さを1つにまとめた手がかり）の日に、
// 大雨・雷雨が来る見込みを p(s) ＝ 1 ÷ (1 ＋ e^(−(s − 55) ÷ 14)) と置く。強さが基準 t 以上なら知らせを「出す」。
// 弱い雲でも来る日・強い雲でも来ない日があるので、どの基準でも空振りと見逃しの両方を0にはできない（シーソー）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題・同じ雲になる。
// KINDS・言い回し・まちがいの選び肢は、足すだけでも過去の日の問題が変わる（選ぶ範囲が変わるため）。公開したあとは変えず、変えるときは qa/run.mjs の PINS を作り直して PR に理由を書く。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    kensho: ["気象庁「検証方法の説明」", "https://www.data.jma.go.jp/fcd/yoho/kensho/explanation.html"],
    yougo: ["気象庁「予報の評価に関する用語」", "https://www.jma.go.jp/jma/kishou/know/yougo_hp/hyoka.html"],
    tatsu: ["気象庁「竜巻ナウキャストとは」", "https://www.jma.go.jp/jma/kishou/know/toppuu/tornado3-1.html"],
    naikaku: ["内閣府・消防庁「令和５年梅雨前線による大雨を踏まえた避難情報の発令について」", "https://www.bousai.go.jp/oukyu/hinankankoku/pdf/oame_hinanjoho.pdf"],
  };
  // 来る見込み（目安・作り話）
  const MID = 55, W = 14;
  const pCome = (s) => 1 / (1 + Math.exp(-(s - MID) / W));

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  // 1日：{ s:雲の強さ, came:来たか }
  const oneDay = (R, s) => ({ s, came: R() < pCome(s) });
  // 基準 t で数える。a 当たり・b 空振り・c 見逃し・d 正しく出さない
  function tally(days, t) {
    const o = { a: 0, b: 0, c: 0, d: 0 };
    for (const x of days) { const go = x.s >= t; if (go && x.came) o.a++; else if (go) o.b++; else if (x.came) o.c++; else o.d++; }
    return o;
  }
  // 1日の結果の名前
  const resOf = (go, came) => (go ? (came ? "hit" : "fa") : (came ? "miss" : "cn"));
  // どの基準（0〜101）でも、空振りと見逃しの両方が0にはならないか
  const noZero = (days) => { for (let t = 0; t <= 101; t++) { const o = tally(days, t); if (o.b === 0 && o.c === 0) return false; } return true; };
  // n 日の雲。基準 t ちょうどの強さは置かない（以上・未満で迷わない）。ok を満たすまで作り直す（呼ぶ回数は種で決まる）
  function strip(R, n, ts, ok) {
    let days = [];
    for (let k = 0; k < 400; k++) {
      days = [];
      for (let i = 0; i < n; i++) { let s = ri(R, 10, 96); while (ts.includes(s)) s++; days.push(oneDay(R, s)); }
      if (ok(days)) return days;
    }
    return null;
  }
  // 100日（「ためす」用。日付の種で、だれでも同じ）。両方0にできる並びになったら種を変える
  function hundred(seed) {
    for (let k = 0; ; k++) {
      const R = rng(seedOf(`lab:${seed}:${k}`)), days = [];
      for (let i = 0; i < 100; i++) days.push(oneDay(R, ri(R, 0, 100)));
      if (noZero(days) && days.some((x) => x.came) && days.some((x) => !x.came)) return days;
    }
  }

  // 2段目「この日の結果は？」の4つ（核：出す・出さないと、来た・来なかったの組）
  const GROUPS = {
    hit: { name: "当たり", sub: "📣出した → ☔来た" },
    fa: { name: "空振り", sub: "📣出した → ☀来なかった" },
    miss: { name: "見逃し", sub: "🔕出さない → ☔来た" },
    cn: { name: "正しく出さない", sub: "🔕出さない → ☀来なかった" },
  };
  const GRP_WHY = {
    hit: "知らせを出して、本当に来ました。これが当たりです。",
    fa: "基準どおりに出しても、来ない日があります。これが空振り。見逃しを減らす代わりに起きます。",
    miss: "基準どおりに出さなくても、来る日があります。これが見逃し。基準を下げると減ります。",
    cn: "出さずに、来ませんでした。これも当たりの1つ（正しく出さない）です。",
  };
  const ASK = { day: "では、この日の結果は？" };
  const MEDIA = { touban: "知らせの当番", kekka: "1日の結果", kazoe: "10日の記録", ritsu: "20日の記録", kotoba: "言葉と式", hontou: "本物の数字" };
  const OPT3 = ["出す", "出さない", "来てから出す"];
  const RES_LAB = { hit: "当たり", fa: "空振り", miss: "見逃し", cn: "正しく出さない" };
  const TS = [40, 50, 60];
  const dayLab = (v) => `${v}日`;
  const pctLab = (v) => `${v}%`;

  // 知らせの当番（1日）：基準と雲の強さを見て、出す・出さないを選ぶ。正解したら、来たかどうかが分かり、結果（4つ）を選ぶ
  function touban(lv) {
    const SIT = [
      (s, t) => `今日の雲の強さは${s}。この町の基準は「${t}以上で出す」。大雨の知らせは？`,
      (s, t) => `あなたは知らせの当番。基準は${t}以上。いまの雲は強さ${s}。どうする？`,
      (s, t) => `雲が育っています（強さ${s}）。基準${t}以上で知らせを出す町です。知らせは？`,
    ];
    return (R) => {
      const t = TS[ri(R, 0, TS.length - 1)], up = R() < 0.5, gap = lv === 0 ? ri(R, 15, 35) : ri(R, 3, 12);
      let s = up ? t + gap : t - gap; s = Math.max(5, Math.min(98, s));
      const came = R() < pCome(s), go = s >= t, si = ri(R, 0, SIT.length - 1), grp = resOf(go, came);
      return {
        type: "act", media: MEDIA.touban, q: SIT[si](s, t), opts: shuffle(R, OPT3), ans: go ? "出す" : "出さない", rev: false, v: `${t}.${s}.${came ? 1 : 0}.${si}`,
        sim: { kind: "day", s, t, came, go }, grp,
        name: `強さ${s}・基準${t}：${go ? "出す" : "出さない"}→${RES_LAB[grp]}`,
        why: `強さ${s}は基準${t}${go ? "以上なので出します" : "より下なので出しません"}。この日は${came ? "大雨が来ました" : "来ませんでした"}。結果は「${RES_LAB[grp]}」。`,
      };
    };
  }
  // 1日の結果の名前：出した・出さないと、来た・来なかったから、4つのどれかを選ぶ
  function kekka() {
    const SIT = [
      (s, t, go, came) => `強さ${s}の雲。基準${t}なので知らせを${go ? "出した" : "出さなかった"}。${came ? "夕方、大雨が来た" : "雨は来なかった"}。結果は？`,
      (s, t, go, came) => `知らせを${go ? "出した" : "出さなかった"}日（強さ${s}・基準${t}）。${came ? "大雨が来た" : "何も来なかった"}。これは何？`,
      (s, t, go, came) => `基準${t}・雲の強さ${s}で、知らせを${go ? "出した" : "出さなかった"}。${came ? "雷雨が来た" : "晴れたまま"}。この日は？`,
    ];
    return (R, lv) => {
      const k = ri(R, 0, 3), go = k < 2, came = k % 2 === 0, t = TS[ri(R, 0, TS.length - 1)];
      const s = go ? ri(R, t + 1, Math.min(96, t + 30)) : ri(R, Math.max(5, t - 30), t - 1), si = ri(R, 0, SIT.length - 1);
      const grp = resOf(go, came), ans = RES_LAB[grp], ws = pickN(R, Object.values(RES_LAB).filter((x) => x !== ans), lv === 0 ? 2 : 3);
      return {
        type: "act", media: MEDIA.kekka, q: SIT[si](s, t, go, came), opts: shuffle(R, [ans, ...ws]), ans, rev: false, v: `${k}.${t}.${s}.${si}`,
        sim: { kind: "day", s, t, came, go, show: true }, grp: null,
        name: `${go ? "出した" : "出さない"}・${came ? "来た" : "来ない"}＝${ans}`,
        why: `知らせを${go ? "出して" : "出さずに"}、${came ? "来た" : "来なかった"}日は「${ans}」です。${grp === "fa" ? "出したのに来なかった日です。" : grp === "miss" ? "出さなかったのに来た日です。" : ""}`,
      };
    };
  }
  // 数の選び肢：答えと、ほかの結果の数・±1・±2（0〜n）。重ねない
  function numOpts(R, ans, others, n, cnt, lab) {
    const out = [ans], cand = [...shuffle(R, others), ...shuffle(R, [ans + 1, ans - 1]), ...shuffle(R, [ans + 2, ans - 2]), ans + 3, ans - 3, ans + 4];
    for (const v of cand) { if (out.length >= cnt) break; if (v < 0 || v > n || out.includes(v)) continue; out.push(v); }
    return shuffle(R, out).map(lab);
  }
  // 10日の記録を数える。what：b 空振り・c 見逃し
  function kazoe(what) {
    const nm = what === "b" ? "空振り" : "見逃し";
    const SIT = [
      (t) => `10日分の雲（棒）と、来た日（☔）。基準${t}以上で出すと、${nm}は何日？`,
      (t) => `基準は${t}以上。この10日で、${nm}になった日はいくつ？`,
      (t) => `点線が基準${t}。棒が点線にとどけば出す。${nm}は何日？`,
    ];
    return (R, lv) => {
      const t = TS[ri(R, 0, TS.length - 1)], days = strip(R, 10, [t], (d) => { const o = tally(d, t); return o[what] >= 1 && o[what] <= 5 && o.a >= 1; });
      const o = tally(days, t), si = ri(R, 0, SIT.length - 1), others = ["a", "b", "c", "d"].filter((x) => x !== what).map((x) => o[x]);
      return {
        type: "act", media: MEDIA.kazoe, q: SIT[si](t), opts: numOpts(R, o[what], others, 10, lv === 0 ? 3 : 4, dayLab), ans: dayLab(o[what]), rev: false, v: `${t}.${si}.${days.map((x) => x.s + (x.came ? "+" : "")).join("")}`,
        sim: { kind: "strip", days, t, show: what }, grp: null,
        name: `基準${t}の10日：${nm}${o[what]}日`,
        why: `基準${t}なら、当たり${o.a}日・空振り${o.b}日・見逃し${o.c}日・正しく出さない${o.d}日。${nm}は${o[what]}日です。`,
      };
    };
  }
  // 基準を動かす（シーソー）。up：上げて空振りを数える／下げて見逃しを数える
  function seesaw(up) {
    const what = up ? "b" : "c", nm = up ? "空振り" : "見逃し", other = up ? "c" : "b", onm = up ? "見逃し" : "空振り";
    const SIT = [
      (t1, t2) => `基準を${t1}から${t2}に${up ? "上げる" : "下げる"}と、この10日の${nm}は何日になる？`,
      (t1, t2) => `いまの基準は${t1}。${t2}に${up ? "上げたら" : "下げたら"}、${nm}は何日？`,
      (t1, t2) => `点線（基準）を${t1}から${t2}へ動かします。${nm}は何日に？`,
    ];
    return (R, lv) => {
      const t1 = up ? ri(R, 3, 5) * 10 : ri(R, 5, 7) * 10, t2 = up ? t1 + 20 : t1 - 20;
      const days = strip(R, 10, [t1, t2], (d) => { const o1 = tally(d, t1), o2 = tally(d, t2); return o1[what] >= 2 && o2[what] < o1[what] && o2[other] > o1[other]; });
      const o1 = tally(days, t1), o2 = tally(days, t2), si = ri(R, 0, SIT.length - 1);
      return {
        type: "act", media: MEDIA.kazoe, q: SIT[si](t1, t2), opts: numOpts(R, o2[what], [o1[what], o2[other], o1[other]], 10, lv === 0 ? 3 : 4, dayLab), ans: dayLab(o2[what]), rev: false, v: `${t1}.${si}.${days.map((x) => x.s + (x.came ? "+" : "")).join("")}`,
        sim: { kind: "strip", days, t: t2, t0: t1, show: what }, grp: null,
        name: `基準${t1}→${t2}：${nm}${o1[what]}→${o2[what]}日`,
        why: `基準を${up ? "上げる" : "下げる"}と、${nm}は${o1[what]}日→${o2[what]}日に減り、${onm}は${o1[other]}日→${o2[other]}日に増えます（シーソー）。`,
      };
    };
  }
  // どちらも0にできない：10日の記録で、空振りも見逃しも0になる基準を選ぶ（答えは「どの基準でも残る」）
  function zero() {
    const ANS = "どの基準でも、どちらかが残る";
    const SIT = [
      () => "この10日で、空振りも見逃しも0になる基準は？",
      () => "基準をどこにすれば、空振り0・見逃し0になる？",
      () => "点線（基準）を動かして、空振りも見逃しも無くせる？",
    ];
    return (R, lv) => {
      const days = strip(R, 10, [], (d) => noZero(d) && d.filter((x) => x.came).length >= 3 && d.filter((x) => !x.came).length >= 3);
      const cand = shuffle(R, [30, 40, 50, 60, 70, 80]).slice(0, lv === 0 ? 2 : 3).sort((a, b) => a - b), si = ri(R, 0, SIT.length - 1);
      // 見せる基準の線は、空振り＋見逃しがいちばん少ない所（全部の整数を調べる。5刻みだと少ない所を見落とす。CodeRabbit #1）
      let best = 50, bm = 99; for (let t = 0; t <= 101; t++) { const o = tally(days, t); if (o.b + o.c < bm) { bm = o.b + o.c; best = t; } }
      const ob = tally(days, best);
      return {
        type: "act", media: MEDIA.kazoe, q: SIT[si](), opts: shuffle(R, [ANS, ...cand.map((t) => `基準${t}以上`)]), ans: ANS, rev: false, v: `${si}.${cand.join(".")}.${days.map((x) => x.s + (x.came ? "+" : "")).join("")}`,
        sim: { kind: "strip", days, t: best, show: "bc", free: true }, grp: null,
        name: "空振りも見逃しも0にはできない",
        why: `来た日より強い雲で、来なかった日があります。いちばん少ない基準${best}でも、空振り${ob.b}日・見逃し${ob.c}日が残ります。`,
      };
    };
  }
  // 20日の記録で割合を出す。kind：k 空振り率（気象庁：空振り÷全部）・h 捕捉率（来た日のうち出していた割合）
  function ritsu(kind) {
    const SIT = kind === "k" ? [
      (t) => `20日の記録（基準${t}）。気象庁の式で「空振り率」は？`,
      (t) => `基準${t}で20日。空振り率（空振り÷全部の回数）は？`,
      (t) => `20日分。基準${t}以上で出した。空振り率は何%？`,
    ] : [
      (t) => `20日の記録（基準${t}）。「捕捉率」は何%？`,
      (t) => `基準${t}で20日。来た日のうち、出していた割合（捕捉率）は？`,
      (t) => `20日分。基準${t}以上で出した。捕捉率は何%？`,
    ];
    const pc = (x, y) => (y ? Math.round((x / y) * 100) : 0);
    return (R, lv) => {
      const t = TS[ri(R, 0, TS.length - 1)];
      const days = strip(R, 20, [t], (d) => { const o = tally(d, t); return kind === "k" ? o.b >= 1 && o.a >= 1 : o.a >= 1 && o.c >= 1 && o.a + o.c >= 3; });
      const o = tally(days, t), N = 20, si = ri(R, 0, SIT.length - 1);
      const ans = kind === "k" ? pc(o.b, N) : pc(o.a, o.a + o.c);
      const wrong = kind === "k" ? [pc(o.b, o.a + o.b), pc(o.c, N), pc(o.a + o.d, N), pc(o.b, o.b + o.d)] : [pc(o.a, N), pc(o.a, o.a + o.b), pc(o.a + o.d, N), pc(o.c, o.a + o.c)];
      const out = [ans];
      for (const v of [...shuffle(R, wrong), ans + 10, ans - 10, ans + 20, ans - 20, ans + 5]) { if (out.length >= (lv === 0 ? 3 : 4)) break; if (v < 0 || v > 100 || out.some((x) => Math.abs(x - v) < 3)) continue; out.push(v); }
      return {
        type: "act", media: MEDIA.ritsu, q: SIT[si](t), opts: shuffle(R, out).map(pctLab), ans: pctLab(ans), rev: false, v: `${t}.${si}.${days.map((x) => x.s + (x.came ? "+" : "")).join("")}`,
        sim: { kind: "strip", days, t, show: kind === "k" ? "b" : "ac" }, grp: null,
        name: kind === "k" ? `空振り率 ${o.b}÷20＝${ans}%` : `捕捉率 ${o.a}÷${o.a + o.c}＝${ans}%`,
        why: kind === "k" ? `空振り率は、空振り÷全部の回数（気象庁）。空振り${o.b}日÷20日＝${ans}%。出した日だけで割りません。` : `捕捉率は、来た日のうち出していた割合。来た${o.a + o.c}日のうち出したのは${o.a}日で、${ans}%。`,
      };
    };
  }

  const T = (id, lv, name, look, key, src, make) => ({ id, lv, a: 0, ans: "", grp: "scene", col: "scene", name, look, key, why: "", src, make, scene: true });

  // 決まりの問題。ans：答え、ws：まちがいの選び肢の候補（やさしいは2つ、ほかは3つ使う）、sit：問いの言い方
  function fact(col, sit, ans, ws) {
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), ds = pickN(R, ws, lv === 0 ? 2 : 3);
      return { type: "fact", media: MEDIA[col], q: sit[si], opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${ds.map((x) => ws.indexOf(x)).join(".")}` };
    };
  }
  const F = (id, lv, col, src, name, look, key, why, sit, ans, ws) => ({ id, lv, a: -1, ans, grp: null, col, name, look, key, why, src, make: fact(col, sit, ans, ws) });

  const KINDS = [
    // ---- やさしい ----
    T("touban0", 0, "知らせの当番", "雲の強さと、基準の数をくらべましょう。", "基準以上なら出す。来るかどうかは、あとで分かります。", ["kensho"], touban(0)),
    T("kekka", 0, "1日の結果の名前", "出したか・来たか、の2つを見ます。", "出して来なかった＝空振り、出さずに来た＝見逃し。", ["yougo", "kensho"], kekka()),
    F("karaburi", 0, "kotoba", ["yougo", "kensho"], "空振りとは", "「出したのに」です。", "空振り：予報が「降水あり」、実況が「降水なし」。",
      "気象庁の言葉で、空振りは予報が「降水あり」で、実際は「降水なし」だった場合です。",
      ["気象庁の言葉で「空振り」とは？", "予報の「空振り」は、どんなとき？", "天気予報の「空振り」に当たるのは？"], "雨ありと予報し、ふらなかった", ["雨なしと予報し、ふった", "雨ありと予報し、ふった", "雨なしと予報し、ふらなかった", "予報を出すのがおくれた"]),
    F("minogashi", 0, "kotoba", ["yougo", "kensho"], "見逃しとは", "「出さなかったのに」です。", "見逃し：予報が「降水なし」、実況が「降水あり」。",
      "気象庁の言葉で、見逃しは予報が「降水なし」で、実際は「降水あり」だった場合です。",
      ["気象庁の言葉で「見逃し」とは？", "予報の「見逃し」は、どんなとき？", "天気予報の「見逃し」に当たるのは？"], "雨なしと予報し、ふった", ["雨ありと予報し、ふらなかった", "雨ありと予報し、ふった", "雨なしと予報し、ふらなかった", "雨雲を見なかった"]),
    F("sageru", 0, "kotoba", ["tatsu"], "基準を下げると見逃しが減り空振りが増える", "出す日がふえると、どうなる？", "基準を下げる：見逃し↓・空振り↑（シーソー）。",
      "出す基準を下げると、出す日がふえて見逃しは減りますが、来ない日にも出すので空振りがふえます。",
      ["知らせを出す基準を下げると、どうなる？", "弱い雲でも知らせを出すようにすると？", "出す基準を低くした町。どう変わる？"], "見逃しは減り、空振りは増える", ["見逃しも空振りも減る", "見逃しも空振りも増える", "見逃しは増え、空振りは減る", "何も変わらない"]),
    // ---- ふつう ----
    T("touban1", 1, "基準ぎりぎりの当番", "数が近いです。「以上」に気をつけて。", "基準ちょうど以上なら出す。来るかは別です。", ["kensho"], touban(1)),
    T("kazoek", 1, "10日の空振りを数える", "点線にとどいた棒のうち、☔の無い日です。", "空振り＝出した（点線以上）のに来なかった（☔なし）。", ["yougo", "kensho"], kazoe("b")),
    T("kazoem", 1, "10日の見逃しを数える", "点線にとどかない棒のうち、☔の日です。", "見逃し＝出さなかった（点線より下）のに来た（☔）。", ["yougo", "kensho"], kazoe("c")),
    F("tekichu", 1, "kotoba", ["kensho", "yougo"], "適中率は当たった回数÷全部", "全部の回数で割ります。", "適中率＝総適中回数÷全予報数。正しく出さないも入る。",
      "降水の有無の適中率は、当たった回数（「雨あり」で降った＋「雨なし」で降らない）÷全部の予報の回数です。",
      ["降水の有無の「適中率」とは？", "気象庁の「適中率」の求め方は？", "予報の「適中率」は、何を何で割る？"], "当たった回数÷全部の予報の回数", ["ふった回数÷全部の予報の回数", "空振りの回数÷全部の予報の回数", "「雨あり」の回数÷全部の回数", "見逃しの回数÷ふった回数"]),
    F("hosoku", 1, "kotoba", ["kensho"], "捕捉率は来た日のうち出していた割合", "来た日だけを取り出します。", "捕捉率：実況「降水あり」のうち、予報も「降水あり」。",
      "捕捉率は、実際に降った場合だけを取り出し、そのうち予報も「雨あり」だった割合です。",
      ["気象庁の「捕捉率」とは？", "「捕捉率」が表すのは？", "予報の「捕捉率」の正しい説明は？"], "ふった日のうち、雨ありと予報した割合", ["雨ありと予報した日のうち、ふった割合", "全部の日のうち、ふった割合", "全部の日のうち、空振りの割合", "全部の日のうち、当たった割合"]),
    F("waru", 1, "kotoba", ["kensho", "yougo"], "空振り率は全部の回数で割る", "気象庁の式は「C÷N」です。", "空振り率＝空振りの回数÷全予報数。",
      "気象庁の空振り率は、空振りの回数を全部の予報の回数で割ります。「雨あり」と出した回数で割るのではありません。",
      ["気象庁の「空振り率」は、空振りの回数を何で割る？", "空振り率の式で、割る数は？", "空振り率（気象庁）の分母は？"], "全部の予報の回数", ["「雨あり」と予報した回数", "実際にふった回数", "当たった回数", "見逃しの回数"]),
    F("osorezu", 1, "kotoba", ["naikaku"], "空振りを恐れずに出せるよう基準を決めておく", "令和5年の通知です。", "「空振り」を恐れずに発令できるよう、平時に発令基準を設定。",
      "内閣府と消防庁は、「空振り」を恐れずに避難情報が出せるよう、ふだんから発令の基準を決めておくよう求めています。",
      ["内閣府と消防庁が、避難情報で市町村に求めたのは？", "避難情報の「空振り」について、国の通知の考えは？", "避難情報を出す市町村へ、国が求めたことは？"], "空振りを恐れず出せるよう、基準を決めておく", ["空振りが無いと分かるまで待って出す", "見逃しが出てから基準を考える", "一度空振りしたら、次は出さない", "雨が強くなってから考える"]),
    // ---- むずかしい ----
    T("ageta", 2, "基準を上げたときの空振り", "点線より上の棒が減ります。", "基準を上げると空振り↓・見逃し↑。", ["kensho", "tatsu"], seesaw(true)),
    T("sageta", 2, "基準を下げたときの見逃し", "点線より下の☔が減ります。", "基準を下げると見逃し↓・空振り↑。", ["kensho", "tatsu"], seesaw(false)),
    T("zero", 2, "空振りも見逃しも0にはできない", "弱い雲で来た日・強い雲で来ない日は？", "雲が同じでも来る日・来ない日がある。両方0は無理。", ["kensho", "tatsu"], zero()),
    T("ritsuk", 2, "空振り率を出す", "空振りの日数を、20日で割ります。", "空振り率＝空振り÷全部の回数（気象庁）。", ["kensho", "yougo"], ritsu("k")),
    T("ritsuh", 2, "捕捉率を出す", "☔の日だけを数えます。", "捕捉率＝来て出した日÷来た日。", ["kensho"], ritsu("h")),
    F("tatsu2", 2, "hontou", ["tatsu"], "竜巻の発生確度2：適中率7～14%", "あまり高くありません。", "確度2：適中率7～14％・捕捉率50～70％（気象庁）。",
      "気象庁によると、竜巻の発生確度2の地域で実際に激しい突風が起きる割合（適中率）は7～14％です。",
      ["竜巻ナウキャストの発生確度2。その地域で突風が起きる割合（適中率）は？", "竜巻の発生確度2の地域。予測の適中率は？", "発生確度2で、実際に竜巻などが起きるのは？"], "7～14%", ["50～70%", "80%程度", "100%", "1～7%"]),
    F("tatsu1", 2, "hontou", ["tatsu"], "竜巻の確度1以上：捕捉率80%程度", "範囲を広げると、見逃しは？", "確度1以上：捕捉率80％程度・適中率1～7％（気象庁）。",
      "発生確度1以上まで広げると捕捉率は80％程度で、確度2（50～70％）より見逃しが減ります。代わりに適中率は1～7％に下がります。",
      ["竜巻の発生確度1以上まで広げると、捕捉率は？", "確度2から確度1以上に広げた。起きた突風のうち予測できた割合は？", "竜巻の発生確度1以上の捕捉率は？"], "80%程度（見逃しが減る）", ["50～70%（変わらない）", "7～14%", "100%（見逃しゼロ）", "1～7%"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "kazoek|2026-11-27:d2"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    const P = { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: null, src: k.src.map((s) => SRC[s]), ...p };
    P.gwhy = P.grp ? GRP_WHY[P.grp] : "";
    P.ask2 = P.grp ? ASK.day : "";
    return P;
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.v}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const KRB = { KINDS, BY, GROUPS, GRP_WHY, ASK, LV, SRC, MEDIA, RES_LAB, TS, MID, W, pCome, tally, resOf, noZero, strip, hundred, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = KRB; else root.KRB = KRB;
})(typeof self !== "undefined" ? self : this);
