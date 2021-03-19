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
const CONCURRENCY = 15;
const reqPath = path.join(__dirname, "../");

const URLS = [];
let bottomNum = 2;
let topNum = 6000;
let totalNum = topNum - bottomNum + 1;
let remainNum = 0;
let acsCount = 0;
let currentSCPArray = [];

const barLength = 50;
let barLine = console.draft(`[${" ".repeat(barLength)}] 0%`);
let draft = console.draft(`Just Firing her Up!
`);
let errorLog = console.draft("");
let currentDoc = console.draft(`
Starting SCP Scraping
`);
let secondErrorLog = console.draft(" ");

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

const write = (fail,success) => {
	let acsFiltered = acs.filter((el) => el != null);
	let acsJSON = JSON.stringify(acsFiltered, null, 4);
	fs.writeFileSync(`${reqPath}/acs-database.json`, acsJSON, "utf8",{ flag: "wx" }, (e) => {
		if (e) {
			return `${fail}: ${e}`;
		}
		return `${success}`;
	});
	return `${success}`;
};

let arrayRemove;

let browser;
let acs = [];
const testString = /^[a-zA-Z0-9\s-]+$/;
const scpNum = (elem) => /(?<=(scp-))[0-9]{1,4}$/.exec(elem)[0];
const crawlUrl = async (url) => {
	// open a new page
		const page = await browser.newPage();
		// enter url in page
		await page.goto(url, {waitUntil: "domcontentloaded", timeout: 0});	
		let acsResult;
		// errorLog(`Parsing: ${url}`);
		remainNum ++;
		let perNum;
		let acsArray = [];
		
		const href = await page.evaluate(() => document.URL);
		const insideSCP = `SCP-${scpNum(href)}`;
		currentSCPArray.push(insideSCP);		
		try { 
            await page.waitFor(1000);
			await page.waitForSelector("div.anom-bar-container", { timeout: 5000 });
			
			acsResult = await page.evaluate(() => {
				const href = document.URL;
				const scpNum = (elem) => /(?<=(scp-))[0-9]{1,4}$/.exec(elem)[0];
                let itemNumber = `SCP-${scpNum(href)}`;
				let clearanceLevel = document.querySelectorAll("div.top-right-box > div.level");
				let containClass = document.querySelectorAll("div.contain-class > div.class-text");					
				let disruptClass = document.querySelectorAll("div.disrupt-class > div.class-text");
				let riskClass = document.querySelectorAll("div.risk-class > div.class-text");
				
				acsArray = [];

				try {
					let secondaryClass = document.querySelectorAll("div.second-class > div.class-text");
					acsArray = {
						itemNumber: itemNumber,
						clearance: clearanceLevel[0].innerText.trim(),
						contain: containClass[0].innerText.trim(),
						secondary: secondaryClass[0].innerText.trim(),
						disrupt: disruptClass[0].innerText.trim(),
						risk: riskClass[0].innerText.trim()
					};
				} catch (e) {
					acsArray = {
						itemNumber: itemNumber,
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
			
			try {
				if (containClass == true || disruptClass == true || riskClass == true) {

					const urClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("unrestricted"));			
					const rsClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("restricted"));
					const cfClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("confidential"));
					const scClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("secret"));
					const tsClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("top secret"));
					const ctsClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("cosmic top secret"));
					const darkClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("dark"));				
					const vlamClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("vlam"));
					const keneqClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("keneq"));
					const ekhiClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("ekhi"));
					const amidaClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("amida"));
					const noticeClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("notice"));
					const cautionClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("caution"));
					const warningClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("warning"));
					const dangerClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("danger"));
					const criticalClass = await page.evaluate(() => document.getElementById("page-content").innerText.toLowerCase().includes("critical"));

					let containContainer;	
					let secondContainer;
					
					try {
						const href = await page.evaluate(() => document.URL);
						const scpNum = (elem) => /(?<=(scp-))[0-9]{1,4}$/.exec(elem)[0];
						itemNum = `SCP-${scpNum(href)}`;						
					} catch (e) {
						console.log(`Item # Error:${e}`);
					}							

					try {
						contain = await page.evaluate(() => {
							try {					
								containContainer = document.evaluate(
									"/html/body//text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'containment class')]",
									document,
									null,
									XPathResult.FIRST_ORDERED_NODE_TYPE,
									null
								)
								.singleNodeValue;
							} catch (e) {
								console.log(`contain single value Error:${e}`);
							}
							
							if (
								containContainer.nextSibling && containContainer.nextSibling.textContent.length > 1 && testString.test(containContainer.nextSibling.textContent.trim())) {
								return containContainer.nextSibling.textContent.trim();
							} else if (
								containContainer.nextSibling && containContainer.nextSibling.textContent.length > 1 && testString.test(containContainer.nextElementSibling.textContent.trim())) {
								return containContainer.nextElementSibling.textContent.trim();
							} else if (
								containContainer.parentNode.childNodes[1] && containContainer.parentNode.childNodes[1].textContent.length > 1 && testString.test(containContainer.parentNode.childNodes[1].textContent.trim())) {
								return containContainer.parentNode.childNodes[1].textContent.trim();
							} else if (
								containContainer.parentNode.childNodes[2] && containContainer.parentNode.childNodes[2].textContent.length > 1 && testString.test(containContainer.parentNode.childNodes[2].textContent.trim())) {
								return containContainer.parentNode.childNodes[2].textContent.trim();
							} else if (
								containContainer.parentNode.parentNode.childNodes[1] && containContainer.parentNode.parentNode.childNodes[1].textContent.length > 1 && testString.test(containContainer.parentNode.parentNode.childNodes[1].textContent.trim())) {
								return containContainer.parentNode.parentNode.childNodes[1].textContent.trim();
							} else if (
								containContainer.parentNode.parentNode.childNodes[2] && containContainer.parentNode.parentNode.childNodes[2].textContent.length > 1 && testString.test(containContainer.parentNode.parentNode.childNodes[2].textContent.trim())) {
								return containContainer.parentNode.parentNode.childNodes[2].textContent.trim();
							}							
						});						
					} catch (e) {								
						contain = null;
					}							

					try {
						second = await page.evaluate(() => {
							try {					
								secondContainer = document
									.evaluate(
										// eslint-disable-next-line quotes
										'/html/body//text()[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"),"secondary class")]',
										document,
										null,
										XPathResult.FIRST_ORDERED_NODE_TYPE,
										null
									)
									.singleNodeValue;
							} catch (e) {
								console.log(`second single value Error:${e}`);
							}						
							if (
								secondContainer.nextSibling && secondContainer.nextSibling.textContent.length > 1 && testString.test(secondContainer.nextSibling.textContent.trim())) {
								return secondContainer.nextSibling.textContent.trim();
							} else if (
								secondContainer.nextSibling && secondContainer.nextSibling.textContent.length > 1 && testString.test(secondContainer.nextElementSibling.textContent.trim())) {
								return secondContainer.nextElementSibling.textContent.trim();
							} else if (
								secondContainer.parentNode.childNodes[1] && secondContainer.parentNode.childNodes[1].textContent.length > 1 && testString.test(secondContainer.parentNode.childNodes[1].textContent.trim())) {
								return secondContainer.parentNode.childNodes[1].textContent.trim();
							} else if (
								secondContainer.parentNode.childNodes[2] && secondContainer.parentNode.childNodes[2].textContent.length > 1 && testString.test(secondContainer.parentNode.childNodes[2].textContent.trim())) {
								return secondContainer.parentNode.childNodes[2].textContent.trim();
							} else if (
								secondContainer.parentNode.parentNode.childNodes[1] && secondContainer.parentNode.parentNode.childNodes[1].textContent.length > 1 && testString.test(secondContainer.parentNode.parentNode.childNodes[1].textContent.trim())) {
								return secondContainer.parentNode.parentNode.childNodes[1].textContent.trim();
							} else if (
								secondContainer.parentNode.parentNode.childNodes[2] && secondContainer.parentNode.parentNode.childNodes[2].textContent.length > 1 && testString.test(secondContainer.parentNode.parentNode.childNodes[2].textContent.trim())) {
								return secondContainer.parentNode.parentNode.childNodes[2].textContent.trim();
							}								
						});						
					} catch (e) {								
						second = null;						
					}
					
					clear =
						(ctsClass) ? "6" :
						(tsClass) ? "5" :
						(scClass) ? "4" :
						(cfClass) ? "3" :
						(rsClass) ? "2" :
						(urClass) ? "1" :
						null;						
					
					disrupt =
						(darkClass) ? "dark" :
						(vlamClass) ? "vlam" :
						(keneqClass) ? "keneq" :
						(ekhiClass) ? "ekhi" :
						(amidaClass) ? "amida" :
						null;

					risk =
						(noticeClass) ? "notice" :
						(cautionClass) ? "caution" :
						(warningClass) ? "warning" :
						(dangerClass) ? "danger" :
						(criticalClass) ? "critical" :
						null;

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
				}
			} catch (e) {
				errorLog(`No ACS On: SCP-${scpNum(url)} | ${e}`);
			}
		}	
	await page.close();
	// await currentDoc(`Current Document Being Evaluated: ${href}`);
	if (acsResult) {
		let itemNumTest = (acsResult.itemNumber) ? true : false;
		let clearTest = (acsResult.clearance) ? true : false;
		let containTest = (acsResult.contain) ? true : false;
		let secondTest = (acsResult.secondary) ? true : false;
		let disruptTest = (acsResult.disrupt) ? true : false;
		let riskTest = (acsResult.risk) ? true : false;
		if ((itemNumTest) && (clearTest || containTest || secondTest || disruptTest || riskTest)) {		
			// console.log(`acs: ${JSON.stringify(acs, null, 4)} | acsResult: ${JSON.stringify(acsResult, null, 4)}`);
			// console.log(`acs type: ${typeof acs} | acsResult type: ${typeof acsResult}`);
			currentDoc(`==================================================
-=============${acsResult.itemNumber} Pushed : acs!=============-
==================================================`);
			acs.push(acsResult);
			acsCount = acsCount + 1;
		}
	}
	let index = currentSCPArray.indexOf(insideSCP);
	try {
		perNum = Math.floor((remainNum / totalNum) * 100);
	} catch (e) {
		console.log(`cannot divide by zero:${e}`);
	}
	if (currentSCPArray[index]) {
		arrayRemove = (arr, value) => { 
			return arr.filter(function(ele){ 
				return ele != value; 
			});
		};
		//errorLog(`index: ${index} | ${currentSCPArray[index]}`);
		currentSCPArray = arrayRemove(currentSCPArray, currentSCPArray[index]);
	}
	barLine(ProgressBar(perNum, barLength));
	draft(`% done: ${perNum} | ACS Count: ${acsCount} 
Current SCPs: ${currentSCPArray.toString()}`);
	write("The temp file has failed!","The temp file is successfully still saved");
	errorLog(write("The temp file has failed!","The temp file is successfully saved"));
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
		ignoreHTTPSErrors: true,
		product: "firefox",
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

    // Runs thru all the urls in a pool of given concurrency.
    const pool = new PromisePool(promiseProducer, CONCURRENCY);
	await pool.start();
    
    browser.close();
    // Print results.
	write("The file failed to write!","The file was saved!");
	errorLog(write("The file failed to write!","The file was saved!"));
    //let acsFiltered = acs.filter((el) => el != null);
    //let acsJSON = JSON.stringify(acsFiltered, null, 4);
    //fs.writeFileSync(`${reqPath}/acs-database.json`, acsJSON, "utf8",{ flag: "wx" }, (e) => {
    //    if (e) {
    //        return console.log(e);
    //    }
    //    console.log("The file was saved!");
    //});
};

mainFunc().catch((e) => {
	secondErrorLog(`mainFunc Error: ${e}`);
});
console.clear();
