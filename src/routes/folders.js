'use strict';

const controllers = require('../controllers');
const { setupPageRoute } = require('./helpers');

module.exports = function (router, middleware) {
	// Logged-in only
	setupPageRoute(router, '/folders', [middleware.ensureLoggedIn], controllers.folders.get);
	setupPageRoute(router, '/folders/bookmarks', [middleware.ensureLoggedIn], controllers.folders.bookmarks.get);
};
