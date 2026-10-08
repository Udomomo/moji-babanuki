const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Code.gs を CommonJS モジュールとして読み込む
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const mod = { exports: {} };
vm.runInNewContext(src, { module: mod, Array, String, JSON });
const { buildReply, toChars, babanuki, onlyOnce, ERROR_MESSAGE } = mod.exports;

const run = (fn, input) => {
  const chars = toChars(input);
  return chars === null ? ERROR_MESSAGE : fn(chars);
};

// [入力, ババ抜き結果, 一度のみ登場文字]
const cases = [
  ['じぬし\nかじき\nかかし', 'ぬかき', 'ぬき'],         // 仕様の入力例
  ['じぬし\r\nかじき\r\nかかし', 'ぬかき', 'ぬき'],     // CRLF
  ['じ ぬ し　か じ き\tか か し', 'ぬかき', 'ぬき'],  // 半角/全角スペース・タブ
  ['ああ', '', ''],
  ['あああ', 'あ', ''],
  ['ああああ', '', ''],
  ['あいう', 'あいう', 'あいう'],
  ['かが', 'かが', 'かが'],                             // 濁音を区別
  ['はばぱ', 'はばぱ', 'はばぱ'],                       // 半濁音を区別
  ['やゃ', 'やゃ', 'やゃ'],                             // 拗音を区別
  ['つっ', 'つっ', 'つっ'],                             // 促音を区別
  ['らーめんーー', 'らーめん', 'らめん'],               // 長音
  ['', '', ''],
];
for (const [input, bb, once] of cases) {
  assert.strictEqual(run(babanuki, input), bb, `babanuki input=${JSON.stringify(input)}`);
  assert.strictEqual(run(onlyOnce, input), once, `onlyOnce input=${JSON.stringify(input)}`);
}

// 返信テキスト全体
const replies = [
  ['じぬし\nかじき\nかかし', 'ババ抜き結果:\nぬかき\n\n一度のみ登場文字:\nぬき'],
  ['ああ いい', 'ババ抜き結果:\n(のこりなし)\n\n一度のみ登場文字:\n(のこりなし)'],
  ['あああ', 'ババ抜き結果:\nあ\n\n一度のみ登場文字:\n(のこりなし)'],
];
for (const [input, expected] of replies) {
  assert.strictEqual(buildReply(input), expected, `buildReply input=${JSON.stringify(input)}`);
}

// ひらがな以外はエラーのみを返す
const errors = [
  'あア',   // カタカナ
  'あa',    // 英字
  'あ漢',   // 漢字
  'あ1',    // 数字
  'あ。',   // 句読点
  'あ😀',   // 絵文字
  'あ-',    // ハイフン(長音ではない)
];
for (const input of errors) {
  assert.strictEqual(buildReply(input), ERROR_MESSAGE, `error input=${JSON.stringify(input)}`);
}

console.log(`ok: ${cases.length * 2 + replies.length + errors.length} assertions`);
