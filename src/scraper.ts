// import * as puppeteer from 'puppeteer';
const puppeteer = require('puppeteer');

const MISSING_PROPERTY = 'Missing property';

interface Recipe {
  title: String;
  description: string | null;
  imageSrc: string | null;
  ratings: string;
  time: string;
  difficulty: string;
  amountOfIngredients: string;
}

async function scraper(url: string): Promise<Recipe | null> {
  let browser;

  try {
    console.log('Opening the browser......');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-setuid-sandbox', '--no-sandbox'],
      ignoreHTTPSErrors: true,
    });
  } catch (err) {
    console.log('Could not create a browser instance => : ', err);
    return null;
  }

  const page = await browser.newPage();
  console.log(`Navigating to ${url}...`);
  await page.goto(url);
  await page.waitForSelector('.recipe-page-section');

  const title = await page.$eval('.recipe-header__title', (el: Element) => el.textContent || MISSING_PROPERTY);
  const ratings = await page.$eval('.ratings > span', (el: Element) => el.textContent || MISSING_PROPERTY);
  const description = await page.$eval('.recipe-header__preamble > p', (el: Element) => el.textContent || MISSING_PROPERTY);
  const time = await page.$eval('.recipe-header__summary > a', (el: Element) => el.textContent?.trim() || MISSING_PROPERTY);
  const amountOfIngredients = await page.$eval('.recipe-header__summary > a:nth-child(2)', (el: Element) => el.textContent?.trim() || MISSING_PROPERTY);
  const difficulty = await page.$eval('.recipe-header__summary > a:nth-child(3)', (el: Element) => el.textContent?.trim() || MISSING_PROPERTY);
  const imageSrc = await page.$eval('.recipe-header__desktop-image-wrapper__inner > img', (el: Element) => el.getAttribute('src') || MISSING_PROPERTY);

  const recipe: Recipe = {
    title,
    description,
    imageSrc,
    ratings,
    time,
    amountOfIngredients,
    difficulty,
  };

  return recipe;
}

export default scraper;
