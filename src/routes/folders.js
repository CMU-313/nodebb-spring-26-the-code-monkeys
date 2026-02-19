'use strict';

const controllers = require('../controllers');
const { setupPageRoute } = require('./helpers');

module.exports = function (router, middleware) {
	setupPageRoute(router, '/folders', [middleware.ensureLoggedIn], controllers.folders.get);
	setupPageRoute(router, '/folders/bookmarks', [middleware.ensureLoggedIn], controllers.folders.bookmarks.get);
	router.get('/folders/:folderId', middleware.ensureLoggedIn, controllers.folders.folder.get);
};
