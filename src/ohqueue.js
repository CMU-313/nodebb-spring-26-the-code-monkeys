'use strict';

const db = require('./database');
const meta = require('./meta');

const OHQueue = module.exports;

OHQueue.STATUSES = {
	WAITING: 'waiting',
	ASSIGNED: 'assigned',
	DONE: 'done',
};

OHQueue.isEnabled = function () {
	return !!meta.config.ohQueueEnabled;
};

OHQueue.isQueueOpen = async function (cid) {
	const val = await db.getObjectField(`category:${cid}`, 'queueOpen');
	return parseInt(val, 10) === 1;
};

OHQueue.setQueueOpen = async function (cid, open) {
	await db.setObjectField(`category:${cid}`, 'queueOpen', open ? 1 : 0);
};

OHQueue.getEntry = async function (id) {
	const entry = await db.getObject(`ohqueue:entry:${id}`);
	if (entry) {
		entry.id = parseInt(entry.id, 10);
		entry.uid = parseInt(entry.uid, 10);
		entry.cid = parseInt(entry.cid, 10);
		entry.assignedTo = parseInt(entry.assignedTo, 10);
	}
	return entry;
};

OHQueue.getActiveEntryByCidAndUid = async function (cid, uid) {
	const ids = await db.getSortedSetRange(`cid:${cid}:ohqueue`, 0, -1);
	if (!ids.length) {
		return null;
	}
	const entries = await db.getObjects(ids.map(id => `ohqueue:entry:${id}`));
	const match = entries.find(
		e => e &&
			parseInt(e.uid, 10) === parseInt(uid, 10) &&
			e.status !== OHQueue.STATUSES.DONE
	);
	return match || null;
};

OHQueue.join = async function (cid, uid) {
	if (!OHQueue.isEnabled()) {
		throw new Error('[[error:oh-queue-disabled]]');
	}
	const open = await OHQueue.isQueueOpen(cid);
	if (!open) {
		throw new Error('[[error:oh-queue-closed]]');
	}
	const existing = await OHQueue.getActiveEntryByCidAndUid(cid, uid);
	if (existing) {
		throw new Error('[[error:oh-queue-already-joined]]');
	}

	const id = await db.incrObjectField('global', 'nextOhQueueId');
	const now = Date.now();
	const entry = {
		id,
		uid: parseInt(uid, 10),
		cid: parseInt(cid, 10),
		status: OHQueue.STATUSES.WAITING,
		assignedTo: 0,
		joinedAt: now,
		updatedAt: now,
	};
	await db.setObject(`ohqueue:entry:${id}`, entry);
	await db.sortedSetAdd(`cid:${cid}:ohqueue`, now, id);
	return entry;
};

OHQueue.leave = async function (cid, uid) {
	const entry = await OHQueue.getActiveEntryByCidAndUid(cid, uid);
	if (!entry) {
		throw new Error('[[error:oh-queue-not-in-queue]]');
	}
	await removeEntry(entry);
	return entry;
};

OHQueue.removeEntry = async function (entry) {
	await removeEntry(entry);
};

OHQueue.assign = async function (id, taUid) {
	const entry = await OHQueue.getEntry(id);
	if (!entry) {
		throw new Error('[[error:oh-queue-entry-not-found]]');
	}
	if (entry.status !== OHQueue.STATUSES.WAITING) {
		throw new Error('[[error:oh-queue-invalid-state]]');
	}
	await changeStatus(entry, OHQueue.STATUSES.ASSIGNED, {
		assignedTo: parseInt(taUid, 10),
	});
	return await OHQueue.getEntry(id);
};

OHQueue.resolve = async function (id) {
	const entry = await OHQueue.getEntry(id);
	if (!entry) {
		throw new Error('[[error:oh-queue-entry-not-found]]');
	}
	if (entry.status !== OHQueue.STATUSES.ASSIGNED) {
		throw new Error('[[error:oh-queue-invalid-state]]');
	}
	await changeStatus(entry, OHQueue.STATUSES.DONE);
	return await OHQueue.getEntry(id);
};

OHQueue.getQueueByCid = async function (cid) {
	const ids = await db.getSortedSetRange(`cid:${cid}:ohqueue`, 0, -1);
	if (!ids.length) {
		return [];
	}
	const entries = await db.getObjects(ids.map(id => `ohqueue:entry:${id}`));
	return entries.filter(Boolean).map(parseEntry);
};

OHQueue.getPosition = async function (cid, uid) {
	const entry = await OHQueue.getActiveEntryByCidAndUid(cid, uid);
	if (!entry || entry.status !== OHQueue.STATUSES.WAITING) {
		return { position: -1, ahead: 0 };
	}
	const allIds = await db.getSortedSetRange(`cid:${cid}:ohqueue`, 0, -1);
	const allEntries = await db.getObjects(allIds.map(id => `ohqueue:entry:${id}`));
	const waitingIds = allEntries
		.filter(e => e && e.status === OHQueue.STATUSES.WAITING)
		.map(e => String(e.id));
	const idx = waitingIds.indexOf(String(entry.id));
	const ahead = idx >= 0 ? idx : 0;
	return { position: idx + 1, ahead };
};

function parseEntry(entry) {
	if (!entry) {
		return entry;
	}
	return {
		...entry,
		id: parseInt(entry.id, 10),
		uid: parseInt(entry.uid, 10),
		cid: parseInt(entry.cid, 10),
		assignedTo: parseInt(entry.assignedTo, 10),
	};
}

async function removeEntry(entry) {
	const { id, cid } = entry;
	await db.sortedSetRemove(`cid:${cid}:ohqueue`, id);
	await db.delete(`ohqueue:entry:${id}`);
}

async function changeStatus(entry, newStatus, extra) {
	const { id } = entry;
	const now = Date.now();
	const updates = { status: newStatus, updatedAt: now, ...extra };
	await db.setObject(`ohqueue:entry:${id}`, updates);
}
