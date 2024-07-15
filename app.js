const webdriver = require("selenium-webdriver");
const edge = require("selenium-webdriver/edge");
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox");
const logging = require("selenium-webdriver/lib/logging");
const express = require("express");
require("dotenv").config();
const app = express();
const port = 8000;
const edgeOptions = new edge.Options();
const chromeOptions = new chrome.Options();
const firefoxOptions = new firefox.Options();
const nvidiaUrl = "https://www.nvidia.com/en-in/geforce/buy/";
const logger = logging.getLogger("webdriver");
logger.setLevel(logging.Level.SEVERE);

const nvidiaScrape = async () => {
  let scrapedData = {};
  let driver = new webdriver.Builder()
    .forBrowser(webdriver.Browser.EDGE)
    .setEdgeOptions(edgeOptions.addArguments("--headless=new"))
    .setChromeOptions(chromeOptions.addArguments("--headless=new"))
    .setFirefoxOptions(firefoxOptions.addArguments("--headless"))
    .build();
  try {
    await driver.get(nvidiaUrl);
    await driver.wait(
      webdriver.until.elementLocated(webdriver.By.className("nv-container")),
      10000
    );
    await driver.executeScript(
      "window.scrollTo(0, document.body.scrollHeight)"
    );
    let cardsParent = await driver.findElement(
      webdriver.By.xpath("/html/body/div[1]/div/div[1]/div/div[2]/div/div")
    );
    let cards = await cardsParent.findElements(
      webdriver.By.className("nv-container")
    );
    for (let card of cards) {
      let title = await card
        .findElement(webdriver.By.className("title"))
        .getText();
      let price;
      try {
        price = await card
          .findElement(webdriver.By.className("startingprice"))
          .getText();
        price = parseInt(price.replace(/[^0-9]/g, ""));
      } catch (error) {
        price = "N/A";
      }
      scrapedData[title] = price;
    }
    return scrapedData;
  } catch (error) {
    console.error(error);
  } finally {
    await driver.quit();
  }
};

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  next();
});

app.get("/", async (req, res) => {
  let start = new Date();
  const data = await nvidiaScrape();
  let end = new Date();
  console.log(`Execution time: ${end - start}ms`);
  res.json(data);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
