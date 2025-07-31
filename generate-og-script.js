import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOGImage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Définir la taille exacte pour OpenGraph
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  
  // Charger notre template HTML
  const htmlPath = path.join(__dirname, 'generate-og-image.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Prendre un screenshot
  const screenshot = await page.screenshot({
    path: path.join(__dirname, 'public', 'og-image.png'),
    type: 'png',
    fullPage: false
  });
  
  await browser.close();
  console.log('✅ Image OpenGraph générée: public/og-image.png');
}

generateOGImage().catch(console.error);
