/* jshint esversion: 8 */

const path = require("path");
const puppeteer = require("puppeteer");
// const chalk = require("chalk");
const PromisePool = require("es6-promise-pool");
const fs = require("fs");
const fsExtra = require("fs-extra");
require("draftlog").into(console);

// MY OCD of colorful console.logs for debugging... IT HELPS
// const error = chalk.bold.red;
// const success = chalk.keyword("green");
const CONCURRENCY = 10;
const reqPath = path.join(__dirname, "../");

const URLS = [];
let bottomNum = 1690;
let topNum = 1710;
let totalNum = topNum - bottomNum + 1;
let remainNum = 0;
let acsCount = 0;
let currentSCPArray = [];
let currentSCP = "";

const barLength = 50;
let draft = console.draft("Starting SCP Scraping");
let barLine = console.draft(`[${" ".repeat(barLength)}] 0%`);
let currentDoc = console.draft("Just firing her up!");
let errorLog = console.draft("");

for (var i = bottomNum; i >= bottomNum && i <= topNum; i++) {
	if (i) {
		if (i >= 2 && i <= 9) {
			URLS.push(`https://scp-wiki.wikidot.com/scp-00${i}`);
		} else if (i >= 10 && i <= 99) {
			URLS.push(`https://scp-wiki.wikidot.com/scp-0${i}`);
		} else if (i !== 0 && i !== 1) {
			URLS.push(`https://scp-wiki.wikidot.com/scp-${i}`);
		} 
	}
}

let ProgressBar = (progress, length) => {
	let units = Math.round(progress / 2);
	return `[${"=".repeat(units)}${" ".repeat(length - units)}] ${progress}%`;
};

let browser;
let acs = [];
const testString = /^[a-zA-Z0-9\s-]+$/;
const scpNum = (elem) => /(?<=(scp-))[0-9]{1,4}$/.exec(elem)[0];
const clearCurrentSCP = () => currentSCPArray = [];
const crawlUrl = async (url) => {
	// open a new page

		const page = await browser.newPage();
		// enter url in page
		await page.goto(url, {timeout: 0});	
		let acsResult;
		// errorLog(`Parsing: ${url}`);
		remainNum ++;
		let perNum;
		let acsArray = [];
		try {
			perNum = Math.floor((remainNum / totalNum) * 100);
		} catch (e) {
			console.log(`cannot divide by zero:${e}`);
		}
		currentSCP = `SCP-${scpNum(url)}`;
		currentSCPArray.push(currentSCP);	
		const href = await page.evaluate(() => {
			return document.URL;
		});	
		try { 
			await page.waitForSelector("div.anom-bar-container", {timeout: 1000});

			
			acsResult = await page.evaluate(() => {
				let itemNumber = document.querySelectorAll("div.top-left-box > span.number");
				let clearanceLevel = document.querySelectorAll("div.top-right-box > div.level");
				let containClass = document.querySelectorAll("div.contain-class > div.class-text");					
				let disruptClass = document.querySelectorAll("div.disrupt-class > div.class-text");
				let riskClass = document.querySelectorAll("div.risk-class > div.class-text");
				
				acsArray = [];

				try {
					let secondaryClass = document.querySelectorAll("div.second-class > div.class-text");
					acsArray = {
						itemNumber: `SCP-${itemNumber[0].innerText.trim()}`,
						clearance: clearanceLevel[0].innerText.trim(),
						contain: containClass[0].innerText.trim(),
						secondary: secondaryClass[0].innerText.trim(),
						disrupt: disruptClass[0].innerText.trim(),
						risk: riskClass[0].innerText.trim()
					};
				} catch (e) {
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
			try {			
				await page.screenshot({ path:`${reqPath}/screenshots/acs-pages/styled/acs-styled-page-${scpNum(url)}.png`});
				acsCount = acsCount + 1;
			} catch (e) {
				errorLog(`Screenshot Exists Styled: SCP-${scpNum(url)}`);
			}
		} catch (e) {
			// errorLog(`No ACS Element on ${url}. Brute force scraping instead.`);			
			const containClass = await page.evaluate(() => window.find("Containment Class"));
			const disruptClass = await page.evaluate(() => window.find("Disrution Class"));
			const riskClass = await page.evaluate(() => window.find("Risk Class"));
			
			let itemNum;
			let contain;
			let second;
			let clear;
			let disrupt;
			let risk;				
			
			if (containClass == true || disruptClass == true || riskClass == true) {
				const testFind = (text) => { 
					let testChilds = document.querySelectorAll("div#page-content > *:nth-child(-n+10)");
					let testChildsNum =  testChilds.length;
					for (let j = testChildsNum; j < testChildsNum; j++) {
						testChilds[j].innerText.toLowerCase().includes(text);
					}
				};
				const urClass = await page.evaluate(testFind("unrestricted"));			
				const rsClass = await page.evaluate(testFind("restricted"));
				const cfClass = await page.evaluate(testFind("confidential"));
				const scClass = await page.evaluate(testFind("secret"));
				const tsClass = await page.evaluate(testFind("top secret"));
				const ctsClass = await page.evaluate(testFind("cosmic top secret"));
				const darkClass = await page.evaluate(testFind("dark"));				
				const vlamClass = await page.evaluate(testFind("vlam"));
				const keneqClass = await page.evaluate(testFind("keneq"));
				const ekhiClass = await page.evaluate(testFind("ekhi"));
				const amidaClass = await page.evaluate(testFind("amida"));
				const noticeClass = await page.evaluate(testFind("notice"));
				const cautionClass = await page.evaluate(testFind("caution"));
				const warningClass = await page.evaluate(testFind("warning"));
				const dangerClass = await page.evaluate(testFind("danger"));
				const criticalClass = await page.evaluate(testFind("critical"));				

				try {
					itemNum = await page.evaluate(() => document.querySelector("div#page-title").textContent.trim());						
				} catch (e) {
					// (`Item # Error:${e}`);
				}

				let containContainer;								

				try {
					contain = await page.evaluate(() => {					
						containContainer = document
							.evaluate(
								"/html/body//text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'containment class')]",
								document,
								null,
								XPathResult.FIRST_ORDERED_NODE_TYPE,
								null
							)
							.singleNodeValue;
						
							if (
								containContainer.nextSibling 
								&& 
								containContainer.nextSibling.textContent.length > 1
								&& 
								testString.test(containContainer.nextSibling.textContent.trim())) {
								return containContainer.nextSibling.textContent.trim();
							} else if (
								containContainer.nextSibling 
								&& 
								containContainer.nextSibling.textContent.length > 1
								&& 
								testString.test(containContainer.nextElementSibling.textContent.trim())) {
								return containContainer.nextElementSibling.textContent.trim();
							} else if (
								containContainer.parentNode.childNodes[1] 
								&& 
								containContainer.parentNode.childNodes[1].textContent.length > 1
								&& 
								testString.test(containContainer.parentNode.childNodes[1].textContent.trim())) {
								return containContainer.parentNode.childNodes[1].textContent.trim();
							} else if (
								containContainer.parentNode.childNodes[2] 
								&& 
								containContainer.parentNode.childNodes[2].textContent.length > 1
								&& 
								testString.test(containContainer.parentNode.childNodes[2].textContent.trim())) {
								return containContainer.parentNode.childNodes[2].textContent.trim();
							} else if (
								containContainer.parentNode.parentNode.childNodes[1] 
								&& 
								containContainer.parentNode.parentNode.childNodes[1].textContent.length > 1
								&& 
								testString.test(containContainer.parentNode.parentNode.childNodes[1].textContent.trim())) {
								return containContainer.parentNode.parentNode.childNodes[1].textContent.trim();
							} else if (
								containContainer.parentNode.parentNode.childNodes[2] 
								&& 
								containContainer.parentNode.parentNode.childNodes[2].textContent.length > 1
								&& 
								testString.test(containContainer.parentNode.parentNode.childNodes[2].textContent.trim())) {
								return containContainer.parentNode.parentNode.childNodes[2].textContent.trim();
							}								
					});						
				} catch (e) {								
					contain = "none";
				}							

				try {
					second = await page.evaluate(() => {					
						let secondContainer = document
							.evaluate(
								// eslint-disable-next-line quotes
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
								secondContainer.nextSibling.textContent.length > 1
								&& 
								testString.test(secondContainer.nextSibling.textContent.trim())) {
								return secondContainer.nextSibling.textContent.trim();
							} else if (
								secondContainer.nextSibling 
								&& 
								secondContainer.nextSibling.textContent.length > 1
								&& 
								testString.test(secondContainer.nextElementSibling.textContent.trim())) {
								return secondContainer.nextElementSibling.textContent.trim();
							} else if (
								secondContainer.parentNode.childNodes[1] 
								&& 
								secondContainer.parentNode.childNodes[1].textContent.length > 1
								&& 
								testString.test(secondContainer.parentNode.childNodes[1].textContent.trim())) {
								return secondContainer.parentNode.childNodes[1].textContent.trim();
							} else if (
								secondContainer.parentNode.childNodes[2] 
								&& 
								secondContainer.parentNode.childNodes[2].textContent.length > 1
								&& 
								testString.test(secondContainer.parentNode.childNodes[2].textContent.trim())) {
								return secondContainer.parentNode.childNodes[2].textContent.trim();
							} else if (
								secondContainer.parentNode.parentNode.childNodes[1] 
								&& 
								secondContainer.parentNode.parentNode.childNodes[1].textContent.length > 1
								&& 
								testString.test(secondContainer.parentNode.parentNode.childNodes[1].textContent.trim())) {
								return secondContainer.parentNode.parentNode.childNodes[1].textContent.trim();
							} else if (
								secondContainer.parentNode.parentNode.childNodes[2] 
								&& 
								secondContainer.parentNode.parentNode.childNodes[2].textContent.length > 1
								&& 
								testString.test(secondContainer.parentNode.parentNode.childNodes[2].textContent.trim())) {
								return secondContainer.parentNode.parentNode.childNodes[2].textContent.trim();
							}								
					});						
				} catch (e) {								
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
				try {
					await page.screenshot({ path:`${reqPath}/screenshots/acs-pages/plain/acs-plain-page-${scpNum(url)}.png`});
				} catch (e) {
					errorLog(`Screenshot Exists Plain: SCP-${scpNum(url)}`);
				}
				acsCount = acsCount + 1;
			} else {
				try {
					await page.screenshot({ path:`${reqPath}/screenshots/error-pages/error-page-${scpNum(url)}.png`});
				} catch (e) {
					errorLog(`Screenshot Exists Error: SCP-${scpNum(url)}`);					
				}				
			}
		}	
	
	await currentDoc(`Current Document Being Evaluated: ${href}`);						
	acs.push(acsResult);
	await page.close();
	let index = currentSCPArray.indexOf(currentSCP);
	if (index > -1) {
		currentSCPArray.splice(index, 1);
	}
	draft(`% done: ${perNum} | ACS Count: ${acsCount} | Current SCPs: ${currentSCPArray.toString()}`);
	barLine(ProgressBar(perNum, barLength));
};

const promiseProducer = () => {
	const url = URLS.pop();	
    return url ? crawlUrl(url) : null;
};

const mainFunc = async () => {
	// Create or Empty Directories
	if (fs.existsSync(`${reqPath}/screenshots`)){
		// errorLog(`Path Empty: ${reqPath}`);
		fsExtra.emptyDirSync(`${reqPath}/screenshots`);
	}
	if (!fs.existsSync(`${reqPath}/screenshots`)){
		// errorLog(`Path /screenshots: ${reqPath}`);
		fs.mkdirSync(`${reqPath}/screenshots`);
	}

	if (!fs.existsSync(`${reqPath}/screenshots/*`)){
		// errorLog(`Path /screenshots/*: ${reqPath}`);
		fs.mkdirSync(`${reqPath}/screenshots/error-pages`);
		fs.mkdirSync(`${reqPath}/screenshots/acs-pages`);
		fs.mkdirSync(`${reqPath}/screenshots/acs-pages/plain`);
		fs.mkdirSync(`${reqPath}/screenshots/acs-pages/styled`);
	}

    // Starts browser.
    browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

    // Runs thru all the urls in a pool of given concurrency.
    const pool = new PromisePool(promiseProducer, CONCURRENCY);
	try {
		clearCurrentSCP();
		await pool.start();
	} catch (e) {
		errorLog(`
Promise Pool Error: 
Error: ${e}
Pool: ${JSON.stringify(pool)}
Current SCP: ${currentSCP}`);
	}
    
    // Print results.
    let acsFiltered = acs.filter((el) => el != null);
	fs.writeFileSync(`${reqPath}/acs-database.json`, JSON.stringify(acsFiltered, null, 4), (e) => {
		if (e) throw e;
	});
    
    await browser.close();
};

mainFunc();
