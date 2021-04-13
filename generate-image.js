import rand from './rand.js';
import nc from 'canvas';
import { fillTextWithTwemoji } from 'node-canvas-with-twemoji-and-discord-emoji';

nc.registerFont('./assets/rounded-x-mgenplus-2p-bold.ttf', { family: 'rounded-x-mgenplus-2p-bold' });
/** @param {string} text */
export default async text => {
  const canvas = nc.createCanvas(800, 650);
  const hi = canvas.getContext('2d');

  hi.fillStyle = '#ffffff';
  hi.fillRect(0, 0, 800, 650);
  const img = await nc.loadImage('./assets/hakoinu' + rand(1, 7) + '.png');
  hi.drawImage(img, 0, -75);

  hi.font = "45px 'rounded-x-mgenplus-2p-bold'";
  hi.fillStyle = '#000000';
  hi.textBaseline = 'top';
  const lines = text.split('\n');
  const x = 100;
  const y = 470 - lines.length * 15;
  const lineHeight = 60;
  await Promise.all(
    lines.map((line, i) => fillTextWithTwemoji(hi, line, x, y + i * lineHeight))
  );

  return canvas.toBuffer();
};
