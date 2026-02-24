'use strict';

const router = require('express').Router();
const middleware = require('../../middleware');
const controllers = require('../../controllers');
const routeHelpers = require('../helpers');

const { setupApiRoute } = routeHelpers;

module.exports = function () {
	const middlewares = [middleware.ensureLoggedIn];

	setupApiRoute(router, 'post', '/:cid/join', [...middlewares], controllers.write.ohqueue.join);
	setupApiRoute(router, 'post', '/:cid/leave', [...middlewares], controllers.write.ohqueue.leave);
	setupApiRoute(router, 'get', '/:cid', [...middlewares], controllers.write.ohqueue.getQueue);
	setupApiRoute(router, 'get', '/:cid/position', [...middlewares], controllers.write.ohqueue.getPosition);

	setupApiRoute(router, 'put', '/entry/:id/assign', [...middlewares], controllers.write.ohqueue.assign);
	setupApiRoute(router, 'put', '/entry/:id/start', [...middlewares], controllers.write.ohqueue.startSession);
	setupApiRoute(router, 'put', '/entry/:id/resolve', [...middlewares], controllers.write.ohqueue.resolve);
	setupApiRoute(router, 'put', '/entry/:id/requeue', [...middlewares], controllers.write.ohqueue.requeue);

	setupApiRoute(router, 'post', '/:cid/take-next', [...middlewares], controllers.write.ohqueue.takeNext);
	setupApiRoute(router, 'put', '/:cid/open', [...middlewares], controllers.write.ohqueue.setQueueOpen);

	return router;
};
