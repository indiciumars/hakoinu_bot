import fs from 'fs';
import Twitter from 'twitter';
import accessToken from './access-token.js';
import rand from './rand.js';
import generateText from './generate-text.js';
import generateImage from './generate-image.js';

const DIGRESS_RATE = 40;
const TREND_WOEID = 23424856; // Japan

const client = new Twitter(accessToken);

const trends = (await client.get('trends/place', { id: TREND_WOEID, exclude: 'hashtags' }))[0].trends.map(trend => trend.name);
const trendWord = trends[rand(0, trends.length - 1)];

const wordlist = JSON.parse(fs.readFileSync('./words.dat', 'utf-8'));
const startable = wordlist.filter(word => word.pos === '助詞');
const r = rand(0, startable.length - 1);

const startWords = [trendWord, startable[r][0], startable[r][1]];
const maxLength = rand(13, 18);
const maxLines = 3;

const { status, text } = generateText(wordlist, startWords, DIGRESS_RATE, maxLength, maxLines);

if (status) {
  const news = new Date().getHours() + '時の #箱犬ニュース です:\n'
  const media = await generateImage(news + text);
  const mediaUpload = await client.post('media/upload', { media });
  await client.post('statuses/update', {
    status: news + status,
    media_ids: mediaUpload.media_id_string
  });
}
