/* eslint-disable */

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search, this_len) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}

/* global ENVIRONMENT */
if (ENVIRONMENT === 'production' || ENVIRONMENT === 'lproduction') {
  console.log('ENV:', ENVIRONMENT);
  const baseHref = document.getElementsByTagName('base')[0].href;
  console.log('before __webpack_public_path__/baseHref', __webpack_public_path__, baseHref);
  if (!baseHref.endsWith('/table-editor/')) {
    __webpack_public_path__ = baseHref + 'table-editor/';
    console.log('after __webpack_public_path__', __webpack_public_path__);
  }
}



/* eslint-enable */
