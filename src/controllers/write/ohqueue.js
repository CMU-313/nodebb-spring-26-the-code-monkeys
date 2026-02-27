'use strict';

const api = require('../../api');
const helpers = require('../helpers');

const OHQueue = module.exports;

OHQueue.join = async (req, res) => {
	const entry = await api.ohqueue.join(req, { cid: req.params.cid });
	helpers.formatApiResponse(200, res, entry);
};

OHQueue.leave = async (req, res) => {
	const entry = await api.ohqueue.leave(req, { cid: req.params.cid });
	helpers.formatApiResponse(200, res, entry);
};

OHQueue.getQueue = async (req, res) => {
	const entries = await api.ohqueue.getQueue(req, {
		cid: req.params.cid,
	});
	helpers.formatApiResponse(200, res, entries);
};

OHQueue.getPosition = async (req, res) => {
	const pos = await api.ohqueue.getPosition(req, {
		cid: req.params.cid,
	});
	helpers.formatApiResponse(200, res, pos);
};

OHQueue.assign = async (req, res) => {
	const entry = await api.ohqueue.assign(req, {
		id: req.params.id,
		taUid: req.body.taUid,
	});
	helpers.formatApiResponse(200, res, entry);
};

OHQueue.resolve = async (req, res) => {
	const entry = await api.ohqueue.resolve(req, {
		id: req.params.id,
	});
	helpers.formatApiResponse(200, res, entry);
};

OHQueue.setQueueOpen = async (req, res) => {
	const result = await api.ohqueue.setQueueOpen(req, {
		cid: req.params.cid,
		open: req.body.open,
	});
	helpers.formatApiResponse(200, res, result);
};