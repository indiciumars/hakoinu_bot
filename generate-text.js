import rand from './rand.js';
import nc from 'canvas';
nc.registerFont('./assets/rounded-x-mgenplus-2p-bold.ttf', { family: 'rounded-x-mgenplus-2p-bold' });
const canvas = nc.createCanvas(1, 1);
const hi = canvas.getContext('2d');
hi.font = "45px 'rounded-x-mgenplus-2p-bold'";

/**
 * @param {{ 0: string, 1: string, 2: string, pos: string }[]} wordlist
 * @param {string[]} startWords
 * @param {number} digressRate
 * @param {number} maxLength
 * @param {number} maxLines
 */
export default (wordlist, startWords, digressRate, maxLength, maxLines) => {
  let text = startWords.join('');
  let status = text;
  let [prev2, prev] = startWords.slice(-2);
  let lines = 1 + startWords.filter(w => w === '\n').length;
  const lastLineText = text.split('\n').slice(-1);
  let x = hi.measureText(lastLineText).width;

  for (let i = 0; i < maxLength; i++) {
    const matches = [];
    const digress = rand(1, 100);
    if (digress <= digressRate) {
      matches.push(...wordlist.filter(word => (word[0] === prev2 && word[1] === prev)));
    }
  
    if (!matches.length) {
      matches.push(...wordlist.filter(word => (word[1] === prev)));
      if (!matches.length) {
        break;
      }
      if (lines >= 3) {
        if (matches.some(m => [' ', '　', '。', '\n', '\0'].includes(m))) {
          break;
        }
      }
    }

    const picked = matches[rand(0, matches.length - 1)][2];
    prev2 = prev;
    prev = picked;
    if (picked === '\n') {
      if (x === 0) {
        status += '\n';
      } else {
        status += '\n';
        text += '\n';
        x = 0;
        lines += 1;
      }
    } else {
      const width = hi.measureText(picked).width;
      if (x + width <= 680){
        x += width;
      } else {
        if (lines >= maxLines) {
          break;
        } else {
          text += '\n';
          lines += 1;
          x = width;
        }
      }
      status += picked;
      text += picked;
    }
  }

  return { status, text };
};
