// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、雲の強さの棒と、朱の点線（出す基準）と、☔の印。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#112f52"/>
      <g fill="#fdfdfb"><circle cx="38" cy="30" r="12"/><circle cx="54" cy="24" r="14"/><circle cx="68" cy="32" r="11"/><rect x="28" y="30" width="50" height="12" rx="6"/></g>
      <g><rect x="18" y="62" width="10" height="24" rx="2" fill="#8fa3bd"/><rect x="34" y="50" width="10" height="36" rx="2" fill="#7fd1a4"/><rect x="50" y="56" width="10" height="30" rx="2" fill="#f0a050"/><rect x="66" y="70" width="10" height="16" rx="2" fill="#8fa3bd"/></g>
      <line x1="10" y1="58" x2="90" y2="58" stroke="#ff7a66" stroke-width="3.5" stroke-dasharray="6 4"/>
      <path d="M78 48c-3 5-5 7-5 10a5 5 0 0 0 10 0c0-3-2-5-5-10z" fill="#6fb0ff"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
