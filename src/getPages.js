/* jshint esversion: 8 */

const puppeteer = require("puppeteer");
const chalk = require("chalk");
var fs = require("fs");

// MY OCD of colorful console.logs for debugging... IT HELPS
const error = chalk.bold.red;
const success = chalk.keyword("green");
const component = "http://www.scp-wiki.net/component:black-highlighter-theme-dev";

(async () => {
  try {
    // open the headless browser
    var browser = await puppeteer.launch({ headless: true });
    // open a new page
    var page = await browser.newPage();
    // enter url in page
    await page.goto(component);
    await page.waitForSelector("#more-options-button");
    await page.focus("#more-options-button");
    await page.waitFor(1000);
    await page.click("#more-options-button");    
    await page.waitFor(1000);
    await page.focus("#backlinks-button");
    await page.click("#backlinks-button");
    await page.waitFor(5000);

    var pagesWithASC = await page.evaluate(() => {
        var titleNodeList = document.querySelectorAll("#action-area ul a:not([href*='http']):first-of-type");	
        var titleLinkArray = [];		
        for (var i = 0; i < titleNodeList.length; i++) {
          titleLinkArray[i] = {
            title: titleNodeList[i].innerText.trim(),
            link: titleNodeList[i].getAttribute("href")
          };
        }
        return titleLinkArray;
    });
    // console.log(news);
    await browser.close();
    // Writing the news inside a json file
    fs.writeFile("pages-with-BHL.json", JSON.stringify(pagesWithASC, null, 4), function(err) {
      if (err) throw err;
      console.log("Saved!");
    });
    console.log(success("Browser Closed"));
    return await pagesWithASC;
  } catch (err) {
    // Catch and display errors
    console.log(error(err));
    await browser.close();
    console.log(error("Browser Closed"));
  }
})();