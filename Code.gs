/**
 * もじババぬき - LINE Messaging API Webhook (Google Apps Script)
 *
 * 送信されたひらがなから2個ペアになる文字を取り除き、残りを返す。
 *
 * 事前準備:
 *   スクリプトプロパティ LINE_CHANNEL_ACCESS_TOKEN にチャネルアクセストークンを設定する。
 */

var LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
var ERROR_MESSAGE = 'エラー: ひらがなで入力してください';

// ひらがな (ぁ〜ゖ) と長音 (ー) のみ
var HIRAGANA_PATTERN = /^[ぁ-ゖー]$/;
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
    reply(event.replyToken, babanuki(event.message.text));
  });

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ババ抜き処理本体。
 * 空白・改行を除去し、ひらがな以外が含まれればエラーメッセージを返す。
 * 各文字は2個単位で取り除き、奇数個の文字は最初の出現位置に1個だけ残す。
 */
function babanuki(text) {
  var chars = Array.from(String(text).replace(WHITESPACE_PATTERN, ''));

  for (var i = 0; i < chars.length; i++) {
    if (!HIRAGANA_PATTERN.test(chars[i])) {
      return ERROR_MESSAGE;
    }
  }

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
    if (counts[c] % 2 === 1) {
      result += c;
    }
  });

  return result;
}

/**
 * LINE Reply API で返信する。
 * 全てペアで消えて結果が空の場合は、空メッセージを送れないため案内文を返す。
 */
function reply(replyToken, text) {
  var token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

  UrlFetchApp.fetch(LINE_REPLY_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: 'text', text: text === '' ? '(のこりなし)' : text }]
    })
  });
}

if (typeof module !== 'undefined') {
  module.exports = { babanuki: babanuki, doPost: doPost, ERROR_MESSAGE: ERROR_MESSAGE };
}
