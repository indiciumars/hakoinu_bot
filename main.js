import fs from 'fs';
import Twitter from 'twitter';
import accessToken from './access-token.js';
import rand from './rand.js';
import generateText from './generate-text.js';
import generateImage from './generate-image.js';

const DIGRESS_RATE = 40;

const client = new Twitter(accessToken);

const wordlist = JSON.parse(fs.readFileSync('./words.dat', 'utf-8'));
const startable = wordlist.filter(word => !['助詞', '助動詞', '特殊'].includes(word.pos));
const r = rand(0, startable.length - 1);
const startWords = [startable[r][0], startable[r][1]];
const maxLength = rand(13, 23);
const maxLines = 4;

const { status, text } = generateText(wordlist, startWords, DIGRESS_RATE, maxLength, maxLines);

if (status) {
  const media = await generateImage(text);
  const mediaUpload = await client.post('media/upload', { media });
  await client.post('statuses/update', {
    status,
    media_ids: mediaUpload.media_id_string
  });
}
