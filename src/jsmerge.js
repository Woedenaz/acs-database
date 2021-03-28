/* jshint esversion: 8 */

const fs = require("fs").promises;
const path = require("path");

(async function mergeJSON() {
	const reqPath = path.join(__dirname, "../");
	const jsonTempData = require(path.join(reqPath, "html/acs-database-temp.json"));
	const jsonMainData = require(path.join(reqPath, "html/acs-database.json"));
		async function jsonMergeData(list1, list2) {
			try {
				console.log(list1);
				var tempMerg = list1.map((item) => {
					console.log(Object.assign({}, list2[item], item));
					return Object.assign({}, list2[item], item); 
				}); 
				let JSONfile = JSON.stringify(tempMerg, null, 4);
				fs.writeFile(`${reqPath}/html/acs-database-merge.json`, JSONfile, "utf8", { flag: "wx" }, (e) => {
					if (e) {
						return `Write Fail: ${e}`;
					}
				});
			} catch (e) {
				return Promise.resolve();
			} 
		}
		await jsonMergeData(jsonMergeData(jsonTempData, jsonMainData));
})();