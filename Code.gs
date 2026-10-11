/**
 * もじババぬき - LINE Messaging API Webhook (Google Apps Script)
 *
 * 送信された文字 (ひらがな・カタカナ・漢字) から2個ペアになる文字を取り除いた「ババ抜き結果」と、
 * ちょうど1回だけ登場した「一度のみ登場文字」を返す。
 *
 * 事前準備:
 *   スクリプトプロパティ LINE_CHANNEL_ACCESS_TOKEN にチャネルアクセストークンを設定する。
 */

var LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
var ERROR_MESSAGE = 'エラー: ひらがな・カタカナ・漢字で入力してください';
var NONE_MESSAGE = '(のこりなし)';

// ひらがな (ぁ〜ゖ)、全角カタカナ (ァ〜ヺ)、長音 (ー)、漢字 (々〇などを含む) と 〆
var ALLOWED_PATTERN = /^(?:[\u3041-\u3096\u30A1-\u30FA\u30FC\u3006]|\p{Script=Han})$/u;
// 半角・全角スペース、タブ、改行
var WHITESPACE_PATTERN = /[ 　\t\r\n]/g;

/**
 * LINEからのWebhookを受け取る。
 */
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var events = body.events || [];

  events.forEach(function (event) {
    if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
      return;
    }
    reply(event.replyToken, buildReply(event.message.text));
  });

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 入力を検証して返信テキストを組み立てる。
 * 受け付けない文字が含まれればエラーメッセージを返す。
 */
function buildReply(text) {
  var chars = toChars(text);
  if (chars === null) {
    return ERROR_MESSAGE;
  }
  return 'ババ抜き結果:\n' + orNone(babanuki(chars)) +
    '\n\n一度のみ登場文字:\n' + orNone(onlyOnce(chars));
}

/**
 * 空白・改行を除去して1文字ずつの配列にする。受け付けない文字が含まれれば null。
 */
function toChars(text) {
  var chars = Array.from(String(text).replace(WHITESPACE_PATTERN, ''));
  for (var i = 0; i < chars.length; i++) {
    if (!ALLOWED_PATTERN.test(chars[i])) {
      return null;
    }
  }
  return chars;
}

/**
 * ババ抜き: 各文字を2個単位で取り除き、奇数個の文字を最初の出現位置に1個残す。
 */
function babanuki(chars) {
  return pickByCount(chars, function (n) { return n % 2 === 1; });
}

/**
 * ちょうど1回だけ登場した文字を出現順に返す。
 */
function onlyOnce(chars) {
  return pickByCount(chars, function (n) { return n === 1; });
}

/**
 * 出現回数が条件を満たす文字を、最初の出現順に1個ずつ連結して返す。
 */
function pickByCount(chars, predicate) {
  var counts = {};
  chars.forEach(function (c) {
    counts[c] = (counts[c] || 0) + 1;
  });

  var seen = {};
  var result = '';
  chars.forEach(function (c) {
    if (seen[c]) {
      return;
    }
    seen[c] = true;
    if (predicate(counts[c])) {
      result += c;
    }
  });
  return result;
}

function orNone(s) {
  return s === '' ? NONE_MESSAGE : s;
}

/**
 * LINE Reply API で返信する。
 */
function reply(replyToken, text) {
  var token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

  UrlFetchApp.fetch(LINE_REPLY_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: text }]
    })
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildReply: buildReply,
    toChars: toChars,
    babanuki: babanuki,
    onlyOnce: onlyOnce,
    doPost: doPost,
    ERROR_MESSAGE: ERROR_MESSAGE
  };
}
