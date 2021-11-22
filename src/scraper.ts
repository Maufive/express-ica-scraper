// import * as puppeteer from 'puppeteer';
const puppeteer = require('puppeteer');

const MISSING_PROPERTY = 'Data saknas';

interface Ingredient {
  quantity: string;
  name: string;
}

interface Recipe {
  title: string;
  description: string;
  imageSrc: string;
  rating: string;
  ratings: string;
  time: string;
  difficulty: string;
  amountOfIngredients: string;
  ingredients: Ingredient[];
  url: string;
  categories: string[];
  steps: string[];
}

async function scraper(url: string): Promise<Recipe | null> {
  let browser;

  try {
    console.log('Opening the browser......');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-setuid-sandbox', '--no-sandbox'],
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
  const rating = await page.$eval('.recipe-rating .rating-wrapper', (el: Element) => el.getAttribute('title') || MISSING_PROPERTY);
  const ratings = await page.$eval('.ratings > span', (el: Element) => el.textContent || MISSING_PROPERTY);
  const description = await page.$eval('.recipe-header__preamble > p', (el: Element) => el.textContent || MISSING_PROPERTY);
  const time = await page.$eval('.recipe-header__summary > a', (el: Element) => el.textContent?.trim() || MISSING_PROPERTY);
  const amountOfIngredients = await page.$eval('.recipe-header__summary > a:nth-child(2)', (el: Element) => el.textContent?.trim() || MISSING_PROPERTY);
  const difficulty = await page.$eval('.recipe-header__summary > a:nth-child(3)', (el: Element) => el.textContent?.trim() || MISSING_PROPERTY);
  const imageSrc = await page.$eval('.recipe-header__desktop-image-wrapper__inner > img', (el: Element) => el.getAttribute('src') || MISSING_PROPERTY);
  const ingredients = await page.$$eval('#ingredients .ingredients-list-group__card:not(.extra-content)', (items: NodeListOf<Element>) => {
    const ingredientsListGroup = Array.from(items);
    return ingredientsListGroup.map((item: Element) => {
      const quantity = item?.querySelector('.ingredients-list-group__card__qty')?.textContent?.replace(/(\r\n\t|\n|\r|\t)/gm, '').trim().split(' ').join('');
      const name = item?.querySelector('.ingredients-list-group__card__ingr')?.textContent?.replace(/(\r\n\t|\n|\r|\t)/gm, '').trim();
      return { quantity, name };
    });
  });
  const categories = await page.$$eval('.more-like-this .more-like-this__categories div', (items: NodeListOf<Element>) => {
    const arrayOfNodes = Array.from(items);
    return arrayOfNodes.map((item: Element) => item.querySelector('a')?.textContent);
  });
  const steps = await page.$$eval('.cooking-steps-group .cooking-steps-card .cooking-steps-main__text', (items: NodeListOf<Element>) => {
    const arrayOfNodes = Array.from(items);
    return arrayOfNodes.map((item: Element) => item.textContent);
  });

  const recipe: Recipe = {
    title,
    description,
    imageSrc,
    rating,
    ratings,
    time,
    amountOfIngredients,
    difficulty,
    ingredients,
    url,
    categories,
    steps,
  };

  await page.close();

  return recipe;
}

export default scraper;
