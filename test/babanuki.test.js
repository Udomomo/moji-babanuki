const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Code.gs を CommonJS モジュールとして読み込む
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const mod = { exports: {} };
vm.runInNewContext(src, { module: mod, Array, String, JSON });
const { babanuki, ERROR_MESSAGE } = mod.exports;

const cases = [
  ['じぬし\nかじき\nかかし', 'ぬかき'],               // 仕様の出力例
  ['じぬし\r\nかじき\r\nかかし', 'ぬかき'],           // CRLF
  ['じ ぬ し　か じ き\tか か し', 'ぬかき'],        // 半角/全角スペース・タブ
  ['ああ', ''],
  ['あああ', 'あ'],
  ['ああああ', ''],
  ['かが', 'かが'],                                   // 濁音を区別
  ['はばぱ', 'はばぱ'],                               // 半濁音を区別
  ['やゃ', 'やゃ'],                                   // 拗音を区別
  ['つっ', 'つっ'],                                   // 促音を区別
  ['らーめんーー', 'らーめん'],                       // 長音
  ['', ''],
  ['あア', ERROR_MESSAGE],                            // カタカナ
  ['あa', ERROR_MESSAGE],                             // 英字
  ['あ漢', ERROR_MESSAGE],                            // 漢字
  ['あ1', ERROR_MESSAGE],                             // 数字
  ['あ。', ERROR_MESSAGE],                            // 句読点
  ['あ😀', ERROR_MESSAGE],                            // 絵文字
  ['あ-', ERROR_MESSAGE],                             // ハイフン(長音ではない)
];

for (const [input, expected] of cases) {
  assert.strictEqual(babanuki(input), expected, `input=${JSON.stringify(input)}`);
}
console.log(`ok: ${cases.length} cases`);
