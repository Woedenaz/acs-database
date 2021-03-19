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
let bottomNum = 2;
let topNum = 6000;
let totalNum = topNum - bottomNum + 1;
let remainNum = 0;
let acsCount = 0;
let currentSCPArray = [];
let currentSCP = "";

const barLength = 50;
let barLine = console.draft(`[${" ".repeat(barLength)}] 0%`);
let currentDoc = console.draft("Starting SCP Scraping");
let errorLog = console.draft("");
let draft = console.draft("Just Firing her Up!");

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
		
		var insideSCP = `SCP-${scpNum(url)}`;
		currentSCP = insideSCP;
		currentSCPArray.push(insideSCP);		
		const href = await page.evaluate(() => {
			return document.URL;
		});	
		try { 
            await page.waitFor(1000);
			await page.waitForSelector("div.anom-bar-container", { timeout: 5000 });
			
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
				let testChilds = await page.evaluate(() => {
					let results = document.querySelectorAll("div#page-content > *:nth-child(-n+4)");
					return results;
				});
				let testChildsNum =  testChilds.length;
				const testFind = (text) => { 
					let testBool;	
					let testText = text;					
					for (let j = testChildsNum; j < testChildsNum; j++) {
						let testChildInner = testChilds[j].innerText.toLowerCase();
						testBool = testChildInner.includes(testText);
					}
					return testBool ? testBool : null;		
				};

				let	urClass = testFind("unrestricted");				
				let	rsClass = testFind("restricted");				
				let	cfClass = testFind("confidential");				
				let	scClass = testFind("secret");				
				let	tsClass = testFind("top secret");				
				let	ctsClass = testFind("cosmic top secret");				
				let	darkClass = testFind("dark");						
				let	vlamClass = testFind("vlam");				
				let	keneqClass = testFind("keneq");				
				let	ekhiClass = testFind("ekhi");			
				let	amidaClass = testFind("amida");				
				let	noticeClass = testFind("notice");				
				let	cautionClass = testFind("caution");				
				let	warningClass = testFind("warning");				
				let	dangerClass = testFind("danger");				
				let	criticalClass = testFind("critical");	

				let containContainer;	
				let secondContainer;
				
				try {
					itemNum = `${insideSCP}`;						
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
					contain = "none";
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
			}
		}	
	
	await currentDoc(`Current Document Being Evaluated: ${href}`);
	if (acsResult) {	
		if (!(!acsResult.clearance || acsResult.clearance == "none") && !(!acsResult.contain || acsResult.contain == "none") && !(!acsResult.secondary || acsResult.secondary == "none") && !(!acsResult.disrupt || acsResult.disrupt == "none") && !(!acsResult.risk || acsResult.risk == "none")) {		
			// console.log(`acs: ${JSON.stringify(acs, null, 4)} | acsResult: ${JSON.stringify(acsResult, null, 4)}`);
			// console.log(`acs type: ${typeof acs} | acsResult type: ${typeof acsResult}`);
			acsCount = acsCount + 1;
			acs.push(acsResult);
		}
	}
	await page.close();
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
		errorLog(`index: ${index} | ${currentSCPArray[index]}`);
		currentSCPArray = arrayRemove(currentSCPArray, currentSCPArray[index]);
	}
	barLine(ProgressBar(perNum, barLength));
	draft(`% done: ${perNum} | ACS Count: ${acsCount} 
Current SCPs: ${currentSCPArray.toString()}`);
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
	await pool.start();
    
    browser.close();
    // Print results.
    let acsFiltered = acs.filter((el) => el != null);
    let acsJSON = JSON.stringify(acsFiltered, null, 4);
    fs.writeFileSync(`${reqPath}/acs-database.json`, acsJSON, "utf8",{ flag: "wx" }, (e) => {
        if (e) {
            return console.log(e);
        }
        console.log("The file was saved!");
    });
};

mainFunc();
console.clear();
