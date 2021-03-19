/**
 * findElemByText - Find an Element By Text
 *
 * @param  {String} str                case-insensitive string to search
 * @param  {String} selector = "*"     selector to search
 * @param  {String} leaf = "outerHTML" leaf of the element
 * @return {Array}                     array of elements
 */
// eslint-disable-next-line no-unused-vars
function findElemByText({str, selector = "*", leaf = "outerHTML"}){
  // generate regex from string
  const regex = new RegExp(str, "gmi");

  // search the element for specific word
  const matchOuterHTML = e => (regex.test(e[leaf]));

  // array of elements
  const elementArray = [...document.querySelectorAll(selector)];

  // return filtered element list
  return elementArray.filter(matchOuterHTML);
}

// usage
// findElemByText({str: "Example", leaf: "innerHTML", selector: "title"});
// findElemByText({str: "Example", selector: "h1"});
// findElemByText({str: "Example"});