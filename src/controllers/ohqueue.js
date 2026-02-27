'use strict';

const user = require('../user');
const categories = require('../categories');
const privileges = require('../privileges');
const ohqueue = require('../ohqueue');
const helpers = require('./helpers');

const ohqueueController = module.exports;

async function buildCourseList(uid) {
	const all = await categories.getAllCategories(['cid', 'name', 'slug', 'disabled']);
	const cids = all.map(c => c && c.cid).filter(Boolean);
	const allowedCids = await privileges.categories.filterCids('topics:read', cids, uid);
	const allowed = new Set(allowedCids);

	return all
		.filter(c => c && allowed.has(c.cid) && !c.disabled)
		.map(c => ({
			cid: c.cid,
			name: c.name,
			slug: c.slug,
		}))
		.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function setCommonTemplateData(base, selectedCid) {
	base.selectedCid = selectedCid || '';
	base.scripts = base.scripts || [];
	if (!base.scripts.includes('forum/ohqueue-student.js')) {
		base.scripts.push('forum/ohqueue-student.js');
	}
	if (base.isStaff && !base.scripts.includes('forum/ohqueue-staff.js')) {
		base.scripts.push('forum/ohqueue-staff.js');
	}
	return base;
}

ohqueueController.index = async function (req, res) {
	if (!req.uid) {
		return helpers.notAllowed(req, res);
	}
	if (!ohqueue.isEnabled()) {
		return helpers.notAllowed(req, res);
	}

	const [isStaff, courses] = await Promise.all([
		user.isAdminOrGlobalMod(req.uid),
		buildCourseList(req.uid),
	]);

	res.render('ohqueue', setCommonTemplateData({
		title: 'OH Queue',
		isStaff,
		courses,
		cid: '',
		queueOpen: false,
		entries: [],
		position: null,
		inQueue: false,
		activeEntry: null,
	}, ''));
};

ohqueueController.get = async function (req, res) {
	if (!req.uid) {
		return helpers.notAllowed(req, res);
	}
	if (!ohqueue.isEnabled()) {
		return helpers.notAllowed(req, res);
	}

	const cid = parseInt(req.params.cid, 10);
	if (!cid) {
		return helpers.redirect(res, '/ohqueue');
	}

	const [
		isStaff,
		queueOpen,
		entries,
		position,
		activeEntry,
		courses,
	] = await Promise.all([
		user.isAdminOrGlobalMod(req.uid),
		ohqueue.isQueueOpen(cid),
		ohqueue.getQueueByCid(cid),
		ohqueue.getPosition(cid, req.uid),
		ohqueue.getActiveEntryByCidAndUid(cid, req.uid),
		buildCourseList(req.uid),
	]);

	res.render('ohqueue', setCommonTemplateData({
		title: 'OH Queue',
		cid,
		isStaff,
		queueOpen,
		entries,
		position,
		inQueue: !!activeEntry,
		activeEntry,
		courses,
	}, cid));
};