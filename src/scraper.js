/* jshint esversion: 8 */

const path = require("path");
const reqPath = path.join(__dirname, "../");
const puppeteer = require("puppeteer-extra");
const PromisePool = require("es6-promise-pool");
const fs = require("fs");
const fsExtra = require("fs-extra");
require("draftlog").into(console);
//let jsonTempData = require(path.join(reqPath, "html/acs-database-temp.json"));
//const jsonMainData = require(path.join(reqPath, "html/acs-database.json"));
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(StealthPlugin());

const CONCURRENCY = 15;

const seriesURLS = [];
const scpsURLS = [];
let bottomNum = 2;
let topNum = 5999;
let totalNum = topNum - bottomNum + 1;
let remainNum = 0;
let acsCount = 0;
let currentSCPArray = [];

const barLength = 50;
let barLine = console.draft(`[${" ".repeat(barLength)}] 0%`);
let draft = console.draft("\nJust Firing her Up!\n");
//let errorLog = console.draft("");
let currentDoc = console.draft("\nStarting SCP Scraping\n");
//let secondErrorLog = console.draft("");
//let scpPageErrorLog = console.draft("");

function scpNum(elem) {
	try {
		let test = /(?<=(scp-))[0-9]{1,4}$/.exec(elem)[0];
		return test;
	} catch (e) {
		//secondErrorLog(`scpNum1 Error: ${e}`);
	}
}

function popNameURLs() {
	seriesURLS.push("https://scp-wiki.wikidot.com/scp-series-6");
	seriesURLS.push("https://scp-wiki.wikidot.com/scp-series-5");
	seriesURLS.push("https://scp-wiki.wikidot.com/scp-series-4");
	seriesURLS.push("https://scp-wiki.wikidot.com/scp-series-3");
	seriesURLS.push("https://scp-wiki.wikidot.com/scp-series-2");
	seriesURLS.push("https://scp-wiki.wikidot.com/scp-series");
	// let testvar = seriesURLS;
	// return console.log(`seriesURLS: ${testvar}`);
}

function popSCPURLs() {
	for (var i = bottomNum; i >= bottomNum && i <= topNum; i++) {
		if (i) {
			const scpnum = (num) => {
				if (num < 100 ) {
					return num.toString().padStart(3, "0");
				} else {
					return num.toString();
				}
			};
			scpsURLS.push(`https://scp-wiki.wikidot.com/scp-${scpnum(i)}`);			
		}
	}
	//let testvar = scpsURLS.pop();
	//return console.log(`seriesURLS: ${testvar}`);
}

async function progressBar(progress, length) {
	let units = Math.round(progress / 2);
	return `[${"=".repeat(units)}${" ".repeat(length - units)}] ${progress}%`;
}

function write(jsonfile, fail, success, filename) {
	try {
		let jsonfiltered = jsonfile.filter((el) => el != null);
		let acsJSON = JSON.stringify(jsonfiltered, null, 4);
		fs.writeFileSync(`${reqPath}/html/${filename}`, acsJSON, "utf8", { flag: "wx" }, (e) => {
			if (e) {
				return `${fail}: ${e}`;
			}
		});
		return `${success}`;
	} catch (e) {
		//scpPageErrorLog(`Write Error: ${e}`);
	}
}

/* async function jsonMergeData(list1, list2) {
	try {
		var tempMerg = list1.map((item) => {
			return Object.assign({}, list2[item], item); 
		}); 
		let JSONfile = JSON.stringify(tempMerg, null, 4);
		fs.writeFileSync(`${reqPath}/html/acs-database-merge.json`, JSONfile, "utf8", { flag: "wx" }, (e) => {
			if (e) {
				return `Write Fail: ${e}`;
			}
		});
	} catch (e) {
		scpPageErrorLog(`jsonMergeData Error: ${e}`);
	} 
}
*/

//let arrayRemove;

let browser;
let acs = [];
let scpNames = [];
const testString = /^[a-zA-Z0-9\s-]+$/;

async function getSCPNames(url) {
	// open a new page
	const page = await browser.newPage();
	// enter url in page
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
	await page.setViewport({ width: 800, height: 600 });
	
	let scpNamesResults;
	try {
		await page.waitForTimeout(1000);
		await page.waitForSelector("#page-content", { timeout: 5000 });
		scpNamesResults = await page.evaluate(() => {
			let scpBlock = document.querySelectorAll("div.series");
			let scpLinks = scpBlock[0].querySelectorAll("ul a[href*='scp-']");
			let scpnamesArray = [];
			let scpnamesSingleInner;
			for (let i = 0; i < scpLinks.length; i++) {
				scpnamesSingleInner = {
					itemNumber: `${scpLinks[i].href}` ? `${scpLinks[i].href.replace(/((http:\/\/scp-wiki\.wikidot\.com\/)|(https:\/\/scp-wiki\.wikidot\.com\/))/i, "")}` : null,
					scpName: scpLinks[i].parentNode.innerText.replace(/^(scp-[0-9]{1,4} - )/ig, "") ? scpLinks[i].parentNode.innerText.replace(/^(scp-[0-9]{1,4} - )/ig, "") : null
				};
				scpnamesArray.push(scpnamesSingleInner);
			}
			return scpnamesArray;
		});
		for (let i = 0; i < scpNamesResults.length; i++) {
			scpNames = scpNames.concat(scpNamesResults[i]);
		}
	} catch (e) {
		//scpPageErrorLog(`scpnamesArray 1: ${scpNamesResults} | Error: ${e}`);
	} finally {
		try {			
			write(scpNames, "The SCP Names file has failed!", "The SCP Names file is successfully still saved", "scp-names-db.json");
			//errorLog(write(scpNames, "The SCP Names file has failed!", "The SCP Names file is successfully still saved", "scp-names-db.json"));
		} catch (e) {
			//scpPageErrorLog(`scpnamesArray 2: ${scpNames} | Error: ${e}`);
		}
	}
}

async function crawlUrl(url) {
	// open a new page
	const page = await browser.newPage();
	// enter url in page
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
	await page.setViewport({ width: 800, height: 600 });
	const reqPath = path.join(__dirname, "../");

	await page.addScriptTag({url:"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"});
	
	let acsResult;
	remainNum++;
	let perNum;

	let findSCPName = async (elem) => {
		const jsonSCPNames = require(path.join(reqPath, "html/scp-names-db.json"));
		for (let i = 0; i < jsonSCPNames.length; i++) {
			if (jsonSCPNames[i].itemNumber.toLowerCase() == elem.toLowerCase()) {
				return jsonSCPNames[i].scpName ? jsonSCPNames[i].scpName : null;
			}
		}
	};

	const href = await page.evaluate(() => document.URL);
	const insideSCP = `SCP-${scpNum(href)}`;
	
	currentSCPArray.push(insideSCP);
	try {
		await page.waitForTimeout(1000);
		try {
			await page.waitForSelector("div.anom-bar-container", { timeout: 5000 });
			let itemNumber = `SCP-${scpNum(href)}`;
			let itemName = await findSCPName(insideSCP);
			let clearanceLevel = await page.evaluate(() => document.querySelectorAll("div.top-right-box > div.level")[0].innerText.trim());
			let containClass= await page.evaluate(() => document.querySelectorAll("div.contain-class > div.class-text")[0].innerText.trim());
			let secondaryClass= await page.evaluate(() => document.querySelectorAll("div.second-class > div.class-text")[0].innerText.trim());
			let disruptClass= await page.evaluate(() => document.querySelectorAll("div.disrupt-class > div.class-text")[0].innerText.trim());
			let riskClass= await page.evaluate(() => document.querySelectorAll("div.risk-class > div.class-text")[0].innerText.trim());
			let url = href;
			acsResult = {
				itemName: itemName ? itemName : "none",
				itemNumber: itemNumber ? itemNumber : "none",
				clearance: clearanceLevel ? clearanceLevel : "none",
				contain: containClass ? containClass : "none",
				secondary: secondaryClass ? secondaryClass : "none",
				disrupt: disruptClass ? disruptClass : "none",
				risk: riskClass ? riskClass : "none",
				url: url ? url : "none"
			};
			try {
				await page.screenshot({ path: `${reqPath}/screenshots/acs-pages/styled/acs-styled-page-${scpNum(url)}.png` });
			} catch (e) {
				//errorLog(`Screenshot Exists Styled: SCP-${scpNum(url)}`);
			}
		} catch (e) {
			try {
				//console.log(`style failure: ${e}`);
				await page.waitForSelector("div.acs-hybrid-text-bar", { timeout: 5000 });
				let itemNumber = `SCP-${scpNum(href)}`;
				let itemName = await findSCPName(insideSCP);
				let clearanceLevel = await page.evaluate(() => document.querySelectorAll("div.acs-hybrid-text-bar div.acs-clear")[0].innerText.replace(/([^0-9])/g, ""));
				let containClass= await page.evaluate(() => document.querySelectorAll("div.acs-hybrid-text-bar div.acs-contain div.acs-text > span")[1].innerText.trim());
				let secondaryClass= await page.evaluate(() => document.querySelectorAll("div.acs-hybrid-text-bar div.acs-secondary div.acs-text > span")[1].innerText.trim());
				let disruptClass= await page.evaluate(() => document.querySelectorAll("div.acs-hybrid-text-bar div.acs-disrupt > div.acs-text")[0].childNodes[3].nodeValue.replace(/[^a-zA-Z ]/g, ""));
				let riskClass= await page.evaluate(() => document.querySelectorAll("div.acs-hybrid-text-bar div.acs-risk div.acs-text")[0].childNodes[3].nodeValue.replace(/[^a-zA-Z ]/g, ""));
				let url = href;

				acsResult = {
					itemName: itemName ? itemName : "none",
					itemNumber: itemNumber ? itemNumber : "none",
					clearance: clearanceLevel ? clearanceLevel : "none",
					contain: containClass ? containClass : "none",
					secondary: secondaryClass ? secondaryClass : "none",
					disrupt: disruptClass ? disruptClass : "none",
					risk: riskClass ? riskClass : "none",
					url: url ? url : "none"
				};
				try {
					await page.screenshot({ path: `${reqPath}/screenshots/acs-pages/hybrid/acs-hybrid-page-${scpNum(url)}.png` });
				} catch (e) {
					//errorLog(`Screenshot Exists Hybrid: SCP-${scpNum(url)}`);
				}
			} catch (e) {
				//console.log(`Hybrid Error: ${e}`);
			}	
		}
	} catch (e) {
		// errorLog(`No ACS Element on ${url}. Brute force scraping instead.`);	
		//console.log(`style & hybrid failure: ${e}`);		
		const containClass = await page.evaluate(() => window.find("Containment Class"));
		const disruptClass = await page.evaluate(() => window.find("Disrution Class"));
		const riskClass = await page.evaluate(() => window.find("Risk Class"));

		let itemNumber = `SCP-${scpNum(href)}`;
		let contain;
		let second;
		let clear;
		let disrupt;
		let risk;
		let url = href;

		try {
			if (containClass == true || disruptClass == true || riskClass == true) {

				let itemName = await findSCPName(itemNumber);

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
							//secondErrorLog(`contain single value Error:${e}`);
						}

						if (containContainer.nextSibling && containContainer.nextSibling.textContent.length > 1 && testString.test(containContainer.nextSibling.textContent.trim())) {
							return containContainer.nextSibling.textContent.trim();
						} else if (containContainer.nextSibling && containContainer.nextSibling.textContent.length > 1 && testString.test(containContainer.nextElementSibling.textContent.trim())) {
							return containContainer.nextElementSibling.textContent.trim();
						} else if (containContainer.parentNode.childNodes[1] && containContainer.parentNode.childNodes[1].textContent.length > 1 && testString.test(containContainer.parentNode.childNodes[1].textContent.trim())) {
							return containContainer.parentNode.childNodes[1].textContent.trim();
						} else if (containContainer.parentNode.childNodes[2] && containContainer.parentNode.childNodes[2].textContent.length > 1 && testString.test(containContainer.parentNode.childNodes[2].textContent.trim())) {
							return containContainer.parentNode.childNodes[2].textContent.trim();
						} else if (containContainer.parentNode.parentNode.childNodes[1] && containContainer.parentNode.parentNode.childNodes[1].textContent.length > 1 && testString.test(containContainer.parentNode.parentNode.childNodes[1].textContent.trim())) {
							return containContainer.parentNode.parentNode.childNodes[1].textContent.trim();
						} else if (containContainer.parentNode.parentNode.childNodes[2] && containContainer.parentNode.parentNode.childNodes[2].textContent.length > 1 && testString.test(containContainer.parentNode.parentNode.childNodes[2].textContent.trim())) {
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
							//secondErrorLog(`second single value Error:${e}`);
						}
						if (secondContainer.nextSibling && secondContainer.nextSibling.textContent.length > 1 && testString.test(secondContainer.nextSibling.textContent.trim())) {
							return secondContainer.nextSibling.textContent.trim();
						} else if (secondContainer.nextSibling && secondContainer.nextSibling.textContent.length > 1 && testString.test(secondContainer.nextElementSibling.textContent.trim())) {
							return secondContainer.nextElementSibling.textContent.trim();
						} else if (secondContainer.parentNode.childNodes[1] && secondContainer.parentNode.childNodes[1].textContent.length > 1 && testString.test(secondContainer.parentNode.childNodes[1].textContent.trim())) {
							return secondContainer.parentNode.childNodes[1].textContent.trim();
						} else if (secondContainer.parentNode.childNodes[2] && secondContainer.parentNode.childNodes[2].textContent.length > 1 && testString.test(secondContainer.parentNode.childNodes[2].textContent.trim())) {
							return secondContainer.parentNode.childNodes[2].textContent.trim();
						} else if (secondContainer.parentNode.parentNode.childNodes[1] && secondContainer.parentNode.parentNode.childNodes[1].textContent.length > 1 && testString.test(secondContainer.parentNode.parentNode.childNodes[1].textContent.trim())) {
							return secondContainer.parentNode.parentNode.childNodes[1].textContent.trim();
						} else if (secondContainer.parentNode.parentNode.childNodes[2] && secondContainer.parentNode.parentNode.childNodes[2].textContent.length > 1 && testString.test(secondContainer.parentNode.parentNode.childNodes[2].textContent.trim())) {
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

				acsResult = {
					itemName: itemName ? itemName : "none",
					itemNumber: itemNumber ? itemNumber : "none",
					clearance: clear ? clear : "none",
					contain: contain ? contain : "none",
					secondary: second ? second : "none",
					disrupt: disrupt ? disrupt : "none",
					risk: risk ? risk : "none",
					url: url ? url : "none"
				};
				try {
					await page.screenshot({ path: `${reqPath}/screenshots/acs-pages/plain/acs-plain-page-${scpNum(url)}.png` });
				} catch (e) {
					//errorLog(`Screenshot Exists Plain: SCP-${scpNum(url)}`);
				}
			}
		} catch (e) {
			//errorLog(`No ACS On: SCP-${scpNum(url)} | ${e}`);
		}
	}
	await page.close();
	// await currentDoc(`Current Document Being Evaluated: ${href}`);
	if (acsResult) {
		let itemNameTest = (acsResult.itemName !== "none" || acsResult.itemName !== "[ACCESS DENIED]") ? true : false;
		let itemNumTest = (acsResult.itemNumber !== "none") ? true : false;
		let clearTest = (acsResult.clearance !== "none") ? true : false;
		let containTest = (acsResult.contain !== "none") ? true : false;
		let secondTest = (acsResult.secondary !== "none") ? true : false;
		let disruptTest = (acsResult.disrupt !== "none") ? true : false;
		let riskTest = (acsResult.risk !== "none") ? true : false;
		if ((itemNameTest && itemNumTest) && (clearTest || containTest || secondTest || disruptTest || riskTest)) {
			// console.log(`acs: ${JSON.stringify(acs, null, 4)} | acsResult: ${JSON.stringify(acsResult, null, 4)}`);
			// console.log(`acs type: ${typeof acs} | acsResult type: ${typeof acsResult}`);
			currentDoc(`==================================================
-=============${acsResult.itemNumber} Pushed : acs!=============-
==================================================`);
			acs.push(acsResult);
			acsCount = acsCount + 1;
		}
	}
	//let index = currentSCPArray.indexOf(insideSCP);
	try {
		perNum = Math.floor((remainNum / totalNum) * 100);
	} catch (e) {
		//secondErrorLog(`cannot divide by zero:${e}`);
	}
	//if (currentSCPArray[index]) {
	//	arrayRemove = async (arr, value) => arr.filter(function (ele) {
	//		return ele != value;
	//	});
	//	//errorLog(`index: ${index} | ${currentSCPArray[index]}`);
	//	currentSCPArrayTemp = await arrayRemove(currentSCPArray, currentSCPArray[index]);
	//}
	barLine(await progressBar(perNum, barLength));
	await draft(`% done: ${perNum} | ACS Count: ${acsCount}`);
	write(acs, "The temp file has failed!", "The temp file is successfully still saved", "acs-database-temp.json");
	/* try {
		let jsonfiltered = acs.filter((el) => el != null);
		jsonTempData = JSON.stringify(jsonfiltered, null, 4);
	} catch (e) {
		scpPageErrorLog(`jsonTempData redefine Error: ${e}`);
	} */
	//errorLog(write(acs, "The temp file has failed!", "The temp file is successfully still saved", "acs-database-temp.json"));
}

function getSCPNamesProducer() {
	const SCPurl = seriesURLS.pop();
	return SCPurl ? getSCPNames(SCPurl) : null;
}

function crawlUrlProducer() {
	const Singleurl = scpsURLS.pop();
	return Singleurl ? crawlUrl(Singleurl) : null;
}

async function mainFunc() {	
	// Starts browser.
	browser = await puppeteer.launch({
		ignoreHTTPSErrors: true,
		product: "chrome",
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});	
	try {
		// Create or Empty Directories
		if (fs.existsSync(`${reqPath}/screenshots`)) {
			// errorLog(`Path Empty: ${reqPath}`);
			fsExtra.emptyDirSync(`${reqPath}/screenshots`);
		}
		if (!fs.existsSync(`${reqPath}/screenshots`)) {
			// errorLog(`Path /screenshots: ${reqPath}`);
			fs.mkdirSync(`${reqPath}/screenshots`);
		}

		if (!fs.existsSync(`${reqPath}/screenshots/*`)) {
			// errorLog(`Path /screenshots/*: ${reqPath}`);
			fs.mkdirSync(`${reqPath}/screenshots/error-pages`);
			fs.mkdirSync(`${reqPath}/screenshots/acs-pages`);
			fs.mkdirSync(`${reqPath}/screenshots/acs-pages/plain`);
			fs.mkdirSync(`${reqPath}/screenshots/acs-pages/hybrid`);
			fs.mkdirSync(`${reqPath}/screenshots/acs-pages/styled`);
		}	
		try {	
			popNameURLs();
			popSCPURLs();
		} catch (e) {
			//console.log(e);
		} finally {
			// Runs thru all the urls in a series pool of given concurrency.
			const namespool = new PromisePool(getSCPNamesProducer, 5);
			const namespoolStart = namespool.start();

			await namespoolStart.then(async function () {
				//console.log("All namespool promises fulfilled");				
			}, function () {
				// console.log("Some namespool promise rejected: " + e.message);
			});	
			
			// Runs thru all the urls in a scp pool of given concurrency.
			const scppool = new PromisePool(crawlUrlProducer, CONCURRENCY);
			const scppoolStart = scppool.start();

			await scppoolStart.then(function () {
				//console.log("All scppool promises fulfilled");
			}, function () {
				// console.log("Some scppool promise rejected: " + e.message);
				
			});
		}
	} catch (e) {
		//secondErrorLog(e);
		await browser.close();
	} finally {
		await browser.close();
		// Print results.
		write(acs, "The file failed to write!", "The file was saved!", "acs-database.json");
		//errorLog(write(acs, "The file failed to write!", "The file was saved!", "acs-database.json"));
		// await jsonMergeData(jsonTempData, jsonMainData);
	}
}
mainFunc().catch(() => {
	//secondErrorLog(`mainFunc Error: ${e}`);
});

