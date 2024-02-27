const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer'); 
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const PROXY_URL = '';
const BASE_URL = '';
const SEARCH_URL = ``;

puppeteerExtra.use(StealthPlugin());
 
async function fetchPhoneNumbers(url) {
	const browser = await puppeteerExtra.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  await page.goto(url); 
  await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

  await page.click('button.seller-phones__show-button');
  
  const isCaptchaPresent = await page.evaluate(() => {
      return document.querySelector('.seller-phones__recaptcha') !== null;
  });

  console.log('Is CAPTCHA present:', isCaptchaPresent);

  await page.screenshot({ path: 'full_page_screenshot.png', fullPage: true });
  const listElements = await page.$$eval('ul.seller-phones__phones-list li', elements => elements.map(el => el.textContent.trim()));

  console.log(listElements);

 
	await browser.close(); 
  return listElements;
}

const fetchData = async () => {
  try {
    const response = await axios.get(SEARCH_URL);
    const $ = cheerio.load(response.data);
    const dataElements = $('div[class^="a-list"] div[class*="a-card__info"]').slice(0, 4);

    const detailsPromises = dataElements.map(async (i, el) => {
        const title = $(el).find('.a-card__title').text().trim();
        const price = $(el).find('.a-card__price').text().replace(/&nbsp;|[\n\r]+/g, '').trim();
        const description = $(el).find('.a-card__description').text().trim();
        const link = BASE_URL + $(el).find('.a-card__link').attr('href');
  
        const phoneNumbers = await fetchPhoneNumbers(link);
        return `${title} ${price} ${description} | Phones: ${phoneNumbers}`;
      }).get(); 

    const detailsWithPhones = await Promise.all(detailsPromises);
    console.log('Details with Phone Numbers:', detailsWithPhones);
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
};

fetchData();
