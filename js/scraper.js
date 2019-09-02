/*jshint esversion: 8 */

const puppeteer = require("puppeteer");
const chalk = require("chalk");
const PromisePool = require('es6-promise-pool');
var fs = require("fs");

// MY OCD of colorful console.logs for debugging... IT HELPS
const error = chalk.bold.red;
const success = chalk.keyword("green");
const CONCURRENCY = 10;

const URLS = [];
let bottomNum = 4000;
let topNum = 4305;
let totalNum = topNum - bottomNum + 1;
let remainNum = 0;

for (var i = bottomNum; i >= bottomNum && i <= topNum; i++) {
	URLS.push("http://www.scp-wiki.net/scp-" + i);
}

let browser;
let acs = [];

const crawlUrl = async (url) => {
	// open a new page

		const page = await browser.newPage();
		// enter url in page
		await page.goto(url);	
		let acsResult;
		console.log("Parsing: " + url);
		remainNum ++;
		perNum = Math.floor((remainNum / totalNum) * 100);
		console.log("% Done: " + perNum + "%");
		try { 
			await page.waitForSelector("div.anom-bar-container", {timeout: 1000});

			acsResult = await page.evaluate(() => {
				var itemNumber = document.querySelectorAll("div.top-left-box > span.number");
				var clearanceLevel = document.querySelectorAll("div.top-right-box > div.level");
				var containClass = document.querySelectorAll("div.contain-class > div.class-text");					
				var disruptClass = document.querySelectorAll("div.disrupt-class > div.class-text");
				var riskClass = document.querySelectorAll("div.risk-class > div.class-text");
				
				var acsArray = [];

				try {
					var secondaryClass = document.querySelectorAll("div.second-class > div.class-text");
					acsArray = {
						itemNumber: "SCP-" + itemNumber[0].innerText.trim(),
						clearance: clearanceLevel[0].innerText.trim(),
						contain: containClass[0].innerText.trim(),
						secondary: secondaryClass[0].innerText.trim(),
						disrupt: disruptClass[0].innerText.trim(),
						risk: riskClass[0].innerText.trim()
					};
				} catch (err) {
					acsArray = {
						itemNumber: itemNumber[0].innerText.trim(),
						clearance: clearanceLevel[0].innerText.trim(),
						contain: containClass[0].innerText.trim(),
						secondary: "none",
						disrupt: disruptClass[0].innerText.trim(),
						risk: riskClass[0].innerText.trim()
					};
				}													

				return acsArray;
			});				
			await page.screenshot({ path:"./screenshots/acs-pages/acs-page-" + url.substr(url.length - 4) + ".png"});
		} catch (err) {
			console.log("No ACS Element on " + url + ". Brute force scraping instead.");
			await page.screenshot({ path:"./screenshots/error-pages/error-page-" + url.substr(url.length - 4) + ".png"});
		

			const containClass = await page.evaluate(() => window.find("Containment Class"));
			const disruptClass = await page.evaluate(() => window.find("Disrution Class"));
			const riskClass = await page.evaluate(() => window.find("Risk Class"));
			
			var itemNum;
			var contain;
			var second;
			var clear;
			var disrupt;
			var risk;				
			
			if (containClass == true || disruptClass == true || riskClass == true) {
				const urClass = await page.evaluate(() => window.find("unrestricted"));			
				const rsClass = await page.evaluate(() => window.find("restricted"));
				const cfClass = await page.evaluate(() => window.find("confidential"));
				const scClass = await page.evaluate(() => window.find("secret"));
				const tsClass = await page.evaluate(() => window.find("top secret"));
				const ctsClass = await page.evaluate(() => window.find("cosmic top secret"));
				const darkClass = await page.evaluate(() => window.find("dark"));				
				const vlamClass = await page.evaluate(() => window.find("vlam"));
				const keneqClass = await page.evaluate(() => window.find("keneq"));
				const ekhiClass = await page.evaluate(() => window.find("ekhi"));
				const amidaClass = await page.evaluate(() => window.find("amida"));
				const noticeClass = await page.evaluate(() => window.find("notice"));
				const cautionClass = await page.evaluate(() => window.find("caution"));
				const warningClass = await page.evaluate(() => window.find("warning"));
				const dangerClass = await page.evaluate(() => window.find("danger"));
				const criticalClass = await page.evaluate(() => window.find("critical"));				

				try {
					itemNum = await page.evaluate(() => document.querySelector('div#page-title').textContent.trim());						
				} catch (err) {
					console.log("Item # Error");
				}

				var containContainer;								

				try {
					contain = await page.evaluate(() => {					
						containContainer = document
							.evaluate(
								'/html/body//text()[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"containment class")]',
								document,
								null,
								XPathResult.FIRST_ORDERED_NODE_TYPE,
								null
							)
							.singleNodeValue;
						
							if (
								containContainer.nextSibling 
								&& 
								containContainer.nextSibling.textContent.length > 1) {
								return containContainer.nextSibling.textContent.trim();
							} else if (
								containContainer.nextSibling 
								&& 
								containContainer.nextSibling.textContent.length > 1) {
								return containContainer.nextElementSibling.textContent.trim();
							} else if (
								containContainer.parentNode.childNodes[1] 
								&& 
								containContainer.parentNode.childNodes[1].textContent.length > 1) {
								return containContainer.parentNode.childNodes[1].textContent.trim();
							} else if (
								containContainer.parentNode.childNodes[2] 
								&& 
								containContainer.parentNode.childNodes[2].textContent.length > 1) {
								return containContainer.parentNode.childNodes[2].textContent.trim();
							} else if (
								containContainer.parentNode.parentNode.childNodes[1] 
								&& 
								containContainer.parentNode.parentNode.childNodes[1].textContent.length > 1) {
								return containContainer.parentNode.parentNode.childNodes[1].textContent.trim();
							} else if (
								containContainer.parentNode.parentNode.childNodes[2] 
								&& 
								containContainer.parentNode.parentNode.childNodes[2].textContent.length > 1) {
								return containContainer.parentNode.parentNode.childNodes[2].textContent.trim();
							}								
					});						
				} catch (err) {								
					contain = "none";
				}							

				try {
					second = await page.evaluate(() => {					
						secondContainer = document
							.evaluate(
								'/html/body//text()[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"secondary class")]',
								document,
								null,
								XPathResult.FIRST_ORDERED_NODE_TYPE,
								null
							)
							.singleNodeValue;
						
							if (
								secondContainer.nextSibling 
								&& 
								secondContainer.nextSibling.textContent.length > 1) {
								return secondContainer.nextSibling.textContent.trim();
							} else if (
								secondContainer.nextSibling 
								&& 
								secondContainer.nextSibling.textContent.length > 1) {
								return secondContainer.nextElementSibling.textContent.trim();
							} else if (
								secondContainer.parentNode.childNodes[1] 
								&& 
								secondContainer.parentNode.childNodes[1].textContent.length > 1) {
								return secondContainer.parentNode.childNodes[1].textContent.trim();
							} else if (
								secondContainer.parentNode.childNodes[2] 
								&& 
								secondContainer.parentNode.childNodes[2].textContent.length > 1) {
								return secondContainer.parentNode.childNodes[2].textContent.trim();
							} else if (
								secondContainer.parentNode.parentNode.childNodes[1] 
								&& 
								secondContainer.parentNode.parentNode.childNodes[1].textContent.length > 1) {
								return secondContainer.parentNode.parentNode.childNodes[1].textContent.trim();
							} else if (
								secondContainer.parentNode.parentNode.childNodes[2] 
								&& 
								secondContainer.parentNode.parentNode.childNodes[2].textContent.length > 1) {
								return secondContainer.parentNode.parentNode.childNodes[2].textContent.trim();
							}								
					});						
				} catch (err) {								
					second = "none";						
				}
				
				clear =
					(ctsClass) ? "6" :
					(tsClass) ? "5" :
					(scClass) ? "4" :
					(cfClass) ? "3" :
					(rsClass) ? "2" :
					(urClass) ? "1" :
					"none";						
				
				disrupt =
					(darkClass) ? "dark" :
					(vlamClass) ? "vlam" :
					(keneqClass) ? "keneq" :
					(ekhiClass) ? "ekhi" :
					(amidaClass) ? "amida" :
					"none";

				risk =
					(noticeClass) ? "notice" :
					(cautionClass) ? "caution" :
					(warningClass) ? "warning" :
					(dangerClass) ? "danger" :
					(criticalClass) ? "critical" :
					"none";
					
				acsResult  = {
					itemNumber: itemNum,
					clearance: clear,
					contain: contain,
					secondary: second,
					disrupt: disrupt,
					risk: risk
				};
			} 
		}									

	acs.push(acsResult);
	await page.close();
};

const promiseProducer = () => {
	const url = URLS.pop();
    
    return url ? crawlUrl(url) : null;
};

const mainFunc = async () => {
    // Starts browser.
    browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

    // Runs thru all the urls in a pool of given concurrency.
    const pool = new PromisePool(promiseProducer, CONCURRENCY);
    await pool.start();
    
    // Print results.
    acsFiltered = acs.filter(function(el) {
		return el !=null;
	});
	fs.writeFileSync("acs-database.json", JSON.stringify(acsFiltered, null, 4), (err) => {
		if (err) throw err;
		console.log("Saved!");
	});
    
    await browser.close();
	console.log(success("Browser Closed"));
};

mainFunc();
