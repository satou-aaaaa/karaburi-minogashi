# 空振りと見逃し（karaburi-minogashi）

雲の強さ（積乱雲の育ち方・レーダーの強さ）と町の「出す基準」を見て、大雨の知らせを出す・出さないを選ぶ1日5問の学習ゲーム。出したのに来なければ空振り、出さずに来れば見逃し。基準を下げると見逃しは減り空振りが増え、上げるとその逆になる。どちらも0にはできない。「ためす」では同じ100日分の雲で基準を動かして数える。

遊ぶ: <https://satou-aaaaa.github.io/karaburi-minogashi/>

- 空振り・見逃しの言葉と、適中率・空振り率・見逃し率・捕捉率の式は、気象庁「検証方法の説明」<https://www.data.jma.go.jp/fcd/yoho/kensho/explanation.html> と「予報の評価に関する用語」<https://www.jma.go.jp/jma/kishou/know/yougo_hp/hyoka.html> によります。
- 竜巻の発生確度の適中率・捕捉率は、気象庁「竜巻ナウキャストとは」<https://www.jma.go.jp/jma/kishou/know/toppuu/tornado3-1.html> の数字です。「空振り」を恐れずに避難情報を出す考えは、内閣府・消防庁の通知（令和5年9月15日）<https://www.bousai.go.jp/oukyu/hinankankoku/pdf/oame_hinanjoho.pdf> によります。
- 雲の強さと来るかどうかは目安の作り話で、本物の天気の記録ではありません（来る見込み p(s) ＝ 1 ÷ (1 ＋ e^(−(s − 55) ÷ 14))）。
- 今日の5問と「ためす」の100日は日付の種で決まり、だれでも同じです。
- 記録は遊ぶ人のブラウザだけに残り、外へ送りません。結果の「共有」を押したときだけ、その日の回の番号と各問の○×の並びが、選んだサービス（X・LINE など）に渡ります。

作業の決まりは [AGENTS.md](AGENTS.md)。
