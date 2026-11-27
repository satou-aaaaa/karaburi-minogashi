// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、遊び方の例だけ（10日の記録・基準50で、空振り2日・見逃し1日）。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  // 図：10日の雲の強さ（棒）と来た日（☔）。基準50の点線。空＝出したのに来ない（2日）・見＝出さずに来た（1日）。練習の例
  const D = [[72, 1], [35, 0], [64, 0], [88, 1], [42, 1], [20, 0], [58, 1], [77, 0], [30, 0], [81, 1]], T = 50;
  const ch = (s, c) => (s >= T ? (c ? ["当", "#1f6e48"] : ["空", "#c25a00"]) : (c ? ["見", "#86210f"] : ["−", "#4a5468"]));
  const bars = D.map(([s, c], i) => { const x = 40 + i * 40, [t, col] = ch(s, c); return `<rect x="${x}" y="${400 - s * 3.2}" width="26" height="${s * 3.2}" rx="3" fill="${s >= T ? "#1d4c7c" : "#b8c0cc"}"/>` + (c ? `<path d="M${x + 13} 40c-6 9-9 13-9 17a9 9 0 0 0 18 0c0-4-3-8-9-17z" fill="#2d6db0"/>` : "") + `<text x="${x + 13}" y="440" text-anchor="middle" font-size="30" font-weight="900" fill="${col}">${t}</text>`; }).join("");
  const line = (t, ok) => `<div style="position:relative;font-size:30px;font-weight:700;padding:10px ${ok ? "150px" : "20px"} 10px 20px;border-radius:12px;background:#fff;border:${ok ? "5px solid #1f6e48" : "3px solid #1d2a3f55"}">${t}${ok ? `<span style="position:absolute;right:16px;top:50%;transform:translateY(-50%) rotate(-8deg);border:4px solid #154e33;color:#154e33;border-radius:8px;padding:0 10px;font-size:28px;font-weight:900">正解</span>` : ""}</div>`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:40px 56px;background:#e8f0f4;color:#1d2a3f;display:flex;gap:40px;align-items:center">
    <div style="flex:0 0 500px;display:flex;flex-direction:column;gap:12px">
      <div style="font-size:30px;color:#112f52;letter-spacing:.06em">大雨の知らせ</div>
      <div style="font-size:84px;font-weight:900;line-height:1.1;white-space:nowrap;color:#112f52">空振り<span style="color:#b5321f">と</span>見逃し</div>
      <div style="font-size:34px">基準を下げれば空振り、<br>上げれば見逃し。</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:6px">${line("空振り 0日")}${line("空振り 2日", 1)}${line("空振り 5日")}</div>
    </div>
    <div style="flex:1;height:550px;border:4px solid #1d2a3f;border-radius:10px;overflow:hidden;background:#fdfdfb">
      <svg width="100%" height="100%" viewBox="0 0 460 520" xmlns="http://www.w3.org/2000/svg">
        <text x="16" y="500" font-size="26" font-weight="700" fill="#1d2a3f">📊 基準50で、空振りは何日？</text>
        ${bars}
        <line x1="30" y1="${400 - T * 3.2}" x2="450" y2="${400 - T * 3.2}" stroke="#b5321f" stroke-width="5" stroke-dasharray="14 9"/>
        <text x="34" y="${400 - T * 3.2 - 10}" font-size="24" font-weight="700" fill="#86210f">基準50</text>
      </svg>
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
