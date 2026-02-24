'use strict';

const user = require('../user');
const ohqueue = require('../ohqueue');
const events = require('../events');

const ohqueueAPI = module.exports;

ohqueueAPI.join = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	const entry = await ohqueue.join(data.cid, caller.uid);
	await logEvent(caller, 'oh-queue-join', {
		cid: data.cid, entryId: entry.id,
	});
	return entry;
};

ohqueueAPI.leave = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	const entry = await ohqueue.leave(data.cid, caller.uid);
	await logEvent(caller, 'oh-queue-leave', {
		cid: data.cid, entryId: entry.id,
	});
	return entry;
};

ohqueueAPI.assign = async function (caller, data) {
	await ensureStaff(caller.uid);
	const taUid = data.taUid || caller.uid;
	const entry = await ohqueue.assign(data.id, taUid);
	await logEvent(caller, 'oh-queue-assign', {
		entryId: data.id, taUid,
	});
	return entry;
};

ohqueueAPI.startSession = async function (caller, data) {
	await ensureStaff(caller.uid);
	const entry = await ohqueue.startSession(data.id);
	await logEvent(caller, 'oh-queue-start', {
		entryId: data.id,
	});
	return entry;
};

ohqueueAPI.resolve = async function (caller, data) {
	await ensureStaff(caller.uid);
	const entry = await ohqueue.resolve(data.id);
	await logEvent(caller, 'oh-queue-resolve', {
		entryId: data.id,
	});
	return entry;
};

ohqueueAPI.requeue = async function (caller, data) {
	await ensureStaff(caller.uid);
	const entry = await ohqueue.requeue(data.id);
	await logEvent(caller, 'oh-queue-requeue', {
		entryId: data.id,
	});
	return entry;
};

ohqueueAPI.takeNext = async function (caller, data) {
	await ensureStaff(caller.uid);
	const entry = await ohqueue.takeNext(data.cid, caller.uid);
	if (entry) {
		await logEvent(caller, 'oh-queue-take-next', {
			cid: data.cid, entryId: entry.id,
		});
	}
	return entry;
};

ohqueueAPI.getQueue = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	return await ohqueue.getQueueByCid(data.cid, data.filter);
};

ohqueueAPI.getPosition = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	return await ohqueue.getPosition(data.cid, caller.uid);
};

ohqueueAPI.setQueueOpen = async function (caller, data) {
	await ensureStaff(caller.uid);
	await ohqueue.setQueueOpen(data.cid, data.open);
	await logEvent(caller, 'oh-queue-toggle', {
		cid: data.cid, open: data.open,
	});
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

async function logEvent(caller, type, data) {
	await events.log({
		type,
		uid: caller.uid,
		ip: caller.ip,
		...data,
	});
}
