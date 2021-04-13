import fs from 'fs';
import Twitter from 'twitter';
import fetch from 'node-fetch';
import unicodeSubstring from 'unicode-substring';
import xmlParser from 'fast-xml-parser';
import accessToken from './access-token.js';
import options from './update-wordlist-options.js';
import appId from './app-id.js';

const client = new Twitter(accessToken);
const since_id = fs.readFileSync('./since_id.dat', 'utf-8');
const data = await client.get('statuses/user_timeline', {
  ...options,
  count: 200,
  exclude_replies: 'false',
  include_rts: 'false',
  include_entities: 'true',
  tweet_mode: 'extended',
  since_id
});

if (data.length > 0) {
  fs.writeFileSync('./since_id.dat', data[0].id_str);

  const sentences = data.map(tweet => {
    const indices = [
      ...(tweet.entities.media || []),
      ...tweet.entities.urls,
      ...tweet.entities.user_mentions,
    ].map(entity => entity.indices);
    indices.sort((a, b) => b[0] - a[0]);
    return indices.reduce((text, indice) => {
      return unicodeSubstring(text, 0, indice[0]) + unicodeSubstring(text, indice[1]);
    }, tweet.full_text).trim();
  });

  /** @type {{ 0: string, 1: string, 2: string, pos: string }[]} */
  const wordlist = JSON.parse(fs.readFileSync('./words.dat', 'utf-8'));

  for (const text of sentences) {
    const url = 'http://jlp.yahooapis.jp/MAService/V1/parse?appid=' + appId + '&sentence=' + encodeURIComponent(text) + '%00';
    const result = xmlParser.parse(await (await fetch(url)).text(), { trimValues: false }).ResultSet;

    const newWords = [];
    const count = result.ma_result.total_count;
    for (let i = 0; i < count - 2; i++) {
      newWords.push({
        0: result.ma_result.word_list.word[i].surface,
        1: result.ma_result.word_list.word[i + 1].surface,
        2: result.ma_result.word_list.word[i + 2].surface,
        pos: result.ma_result.word_list.word[i].pos,
      });
    }
    wordlist.unshift(...newWords);
  };

  wordlist.splice(5000);
  fs.writeFileSync('./words.dat', JSON.stringify(wordlist));
}
