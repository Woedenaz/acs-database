/*jshint esversion: 8 */

const puppeteer = require("puppeteer");
const chalk = require("chalk");
var fs = require("fs");

// MY OCD of colorful console.logs for debugging... IT HELPS
const error = chalk.bold.red;
const success = chalk.keyword("green");

(async () => {
	fs.openSync("acs-database.json", "w");
	try {
		// open the headless browser
		var browser = await puppeteer.launch({
			headless: true
		});
		// open a new page
		var page = await browser.newPage();
		// enter url in page
		var bottomNum = 4378;
		var topNum = 4444;
		var totalNum = topNum - bottomNum + 1;
		for (var i = bottomNum; i >= bottomNum && i <= topNum; i++) {
			await page.goto("http://www.scp-wiki.net/scp-" + i);
			var acs;
			try { 
				await page.waitForSelector("div.anom-bar-container", {timeout: 5000});

				acs = await page.evaluate(() => {
					var itemNumber = document.querySelectorAll("div.top-left-box > span.number");
					var clearanceLevel = document.querySelectorAll("div.top-right-box > div.level");
					var containClass = document.querySelectorAll("div.contain-class > div.class-text");					
					var disruptClass = document.querySelectorAll("div.disrupt-class > div.class-text");
					var riskClass = document.querySelectorAll("div.risk-class > div.class-text");
					var acsArray = [];

					try {
						var secondaryClass = document.querySelectorAll("div.second-class > div.class-text");
						acsArray = {
							itemNumber: itemNumber[0].innerText.trim(),
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
				await page.screenshot({ path:"./screenshots/acs-pages/acs-page-" + i + ".png"});
			} catch (err) {
				console.log("the element did not appear.");
				await page.screenshot({ path:"./screenshots/error-pages/error-page-" + i + ".png"});
			

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
						
					console.log(clear);
					
					disrupt =
						(darkClass) ? "dark" :
						(vlamClass) ? "vlam" :
						(keneqClass) ? "keneq" :
						(ekhiClass) ? "ekhi" :
						(amidaClass) ? "amida" :
						"none";

					console.log(disrupt);

					risk =
						(noticeClass) ? "notice" :
						(cautionClass) ? "caution" :
						(warningClass) ? "warning" :
						(dangerClass) ? "danger" :
						(criticalClass) ? "critical" :
						"none";

					console.log(risk);
					
				}
				acs = {
					itemNumber: itemNum,
					clearance: clear,
					contain: contain,
					secondary: second,
					disrupt: disrupt,
					risk: risk
				};
				console.log(acs);
			}			
			// Writing the news inside a json file
			fs.writeFile("acs-database.json", JSON.stringify(acs, null, 4), (err) => {
				if (err) throw err;
				console.log("Saved!");
			});	
			console.log(i - bottomNum + 1 + "/" + totalNum);		
		}
		// console.log(acs);
		await browser.close();
		console.log(success("Browser Closed"));
	} catch (err) {
		// Catch and display errors
		console.log(error(err));
		await browser.close();
		console.log(error("Browser Closed"));
	}
})();
