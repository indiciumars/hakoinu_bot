import fs from 'fs';
import Twitter from 'twitter';
import fetch from 'node-fetch';
import FormData from 'form-data';
import xmlParser from 'fast-xml-parser';
import unicodeSubstring from 'unicode-substring';
import apikey from './apikey.js';
import appId from './app-id.js';
import accessToken from './access-token.js';
import rand from './rand.js';
import generateText from './generate-text.js';
import generateImage from './generate-image.js';

const DIGRESS_RATE = 60;
const REJECTS = ['私', 'あなた'];

const wordlist = JSON.parse(fs.readFileSync('./words.dat', 'utf-8'));

const client = new Twitter(accessToken);
const since_id = fs.readFileSync('./since_id_reply.dat', 'utf-8');
const data = (await client.get('statuses/mentions_timeline', {
  count: 200,
  include_entities: 'true',
  tweet_mode: 'extended',
  since_id
}));
if (data[0]?.id_str) {
  fs.writeFileSync('./since_id_reply.dat', data[0].id_str);
}

for (const tweet of data.reverse()) {
  const call = tweet.entities.user_mentions.reverse().reduce((text, mention) => {
    return unicodeSubstring(text, 0, mention.indices[0]) + unicodeSubstring(text, mention.indices[1]);
  }, tweet.full_text);
  const formData = new FormData();
  formData.append('apikey', apikey);
  formData.append('query', call);
  const response = await (await fetch('https://api.a3rt.recruit-tech.co.jp/talk/v1/smalltalk', {
    method: 'POST',
    body: formData
  })).json();

  let aiReplyText = '';
  if (response.status === 0) {
    aiReplyText = response.results[0].reply.replace('?', '');
  } else {
    const formData = new FormData();
    formData.append('apikey', apikey);
    formData.append('query', call.split(/[\n。?？!！]/)[0]);
    const response = await (await fetch('https://api.a3rt.recruit-tech.co.jp/talk/v1/smalltalk', {
      method: 'POST',
      body: formData
    })).json();
    if (response.status === 0) {
      aiReplyText = response.results[0].reply.replace('?', '');
    }
  }

  const replyWordlist = [...wordlist];
  const startWords = [];

  if (aiReplyText) {
    const url = 'http://jlp.yahooapis.jp/MAService/V1/parse?appid=' + appId + '&sentence=' + encodeURIComponent(aiReplyText) + '%00';
    const result = xmlParser.parse(await (await fetch(url)).text(), { trimValues: false }).ResultSet;

    const start = result.ma_result.word_list.word.findIndex(word => {
      return !REJECTS.includes(word.surface) && !['助詞', '助動詞', '特殊'].includes(word.pos);
    });

    startWords.push(
      result.ma_result.word_list.word[start].surface,
      result.ma_result.word_list.word[start + 1].surface
    );
    const count = result.ma_result.total_count;
    for (let i = start; i < count - 2; i++) {
      replyWordlist.push({
        0: result.ma_result.word_list.word[i].surface,
        1: result.ma_result.word_list.word[i + 1].surface,
        2: result.ma_result.word_list.word[i + 2].surface,
        pos: result.ma_result.word_list.word[i].pos,
      });
    }
  } else {
    const startable = wordlist.filter(word => !['助詞', '助動詞', '特殊'].includes(word.pos));
    const r = rand(0, startable.length - 1);
    startWords.push(startable[r][0], startable[r][1]);
  }

  const maxLength = rand(7, 17);
  const maxLines = 4;

  const { status, text } = generateText(replyWordlist, startWords, DIGRESS_RATE, maxLength, maxLines);

  if (status) {
    const media = await generateImage(text);
    const mediaUpload = await client.post('media/upload', { media });
    await client.post('statuses/update', {
      status: '@' + tweet.user.screen_name + ' ' + status,
      in_reply_to_status_id: tweet.id_str,
      media_ids: mediaUpload.media_id_string
    });
  }
}
