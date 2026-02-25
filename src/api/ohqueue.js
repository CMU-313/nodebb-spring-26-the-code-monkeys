'use strict';

const user = require('../user');
const ohqueue = require('../ohqueue');

const ohqueueAPI = module.exports;

ohqueueAPI.join = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	return await ohqueue.join(data.cid, caller.uid);
};

ohqueueAPI.leave = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	return await ohqueue.leave(data.cid, caller.uid);
};

ohqueueAPI.assign = async function (caller, data) {
	await ensureStaff(caller.uid);
	const taUid = data.taUid || caller.uid;
	return await ohqueue.assign(data.id, taUid);
};

ohqueueAPI.resolve = async function (caller, data) {
	await ensureStaff(caller.uid);
	return await ohqueue.resolve(data.id);
};

ohqueueAPI.getQueue = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	return await ohqueue.getQueueByCid(data.cid);
};

ohqueueAPI.getPosition = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	return await ohqueue.getPosition(data.cid, caller.uid);
};

ohqueueAPI.setQueueOpen = async function (caller, data) {
	await ensureStaff(caller.uid);
	const open = !!data.open;
	await ohqueue.setQueueOpen(data.cid, open);
	return { open };
};

async function ensureStaff(uid) {
	const [isAdmin, isGlobalMod] = await Promise.all([
		user.isAdministrator(uid),
		user.isGlobalModerator(uid),
	]);
	if (!isAdmin && !isGlobalMod) {
		throw new Error('[[error:no-privileges]]');
	}
}
