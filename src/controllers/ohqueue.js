'use strict';

const user = require('../user');
const ohqueue = require('../ohqueue');
const helpers = require('./helpers');

const ohqueueController = module.exports;

ohqueueController.get = async function (req, res) {
	if (!req.uid) {
		return helpers.notAllowed(req, res);
	}
	if (!ohqueue.isEnabled()) {
		return helpers.notAllowed(req, res);
	}

	const cid = parseInt(req.params.cid, 10);
	if (!cid) {
		return helpers.redirect(res, '/');
	}

	const [isStaff, queueOpen] = await Promise.all([
		user.isAdminOrGlobalMod(req.uid),
		ohqueue.isQueueOpen(cid),
	]);

	const entries = await ohqueue.getQueueByCid(cid);
	const position = await ohqueue.getPosition(cid, req.uid);
	const activeEntry = await ohqueue.getActiveEntryByCidAndUid(cid, req.uid);

	res.render('ohqueue', {
		title: 'OH Queue',
		cid,
		isStaff,
		queueOpen,
		entries,
		position,
		inQueue: !!activeEntry,
		activeEntry,
	});
};
