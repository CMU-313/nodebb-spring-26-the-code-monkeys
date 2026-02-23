'use strict';

const db = require('../database');

const Folders = {};

Folders.list = async function (uid) {
	const ids = await db.getSortedSetRevRange(`uid:${uid}:folders`, 0, -1);
	if (!ids.length) return [];
	const metas = await db.getObjects(ids.map(id => `folder:${uid}:${id}`));
	return ids.map((id, i) => ({
		id: String(id),
		name: metas[i] ? metas[i].name : '',
		createdAt: metas[i] ? metas[i].createdAt : 0,
	})).filter(f => f.name);
};

Folders.create = async function (uid, name) {
	name = String(name || '').trim();
	if (!name || name.length > 50) throw new Error('[[error:invalid-data]]');

	const id = await db.incrObjectField(`uid:${uid}`, 'nextFolderId');
	const now = Date.now();

	await Promise.all([
		db.sortedSetAdd(`uid:${uid}:folders`, now, id),
		db.setObject(`folder:${uid}:${id}`, { name, createdAt: now }),
	]);

	return { id: String(id), name, createdAt: now };
};

Folders.delete = async function (uid, folderId) {
	await Promise.all([
		db.sortedSetRemove(`uid:${uid}:folders`, folderId),
		db.delete(`folder:${uid}:${folderId}`),
		db.delete(`folder:${uid}:${folderId}:pids`),
	]);
};

Folders.addPid = async function (uid, folderId, pid) {
	await db.sortedSetAdd(`folder:${uid}:${folderId}:pids`, Date.now(), pid);
};

Folders.getPids = async function (uid, folderId, start, stop) {
	const pids = await db.getSortedSetRevRange(`folder:${uid}:${folderId}:pids`, start, stop);
	return (pids || []).map(p => parseInt(p, 10)).filter(Number.isFinite);
};

Folders.countPids = async function (uid, folderId) {
	return await db.sortedSetCard(`folder:${uid}:${folderId}:pids`);
};

Folders.getMeta = async function (uid, folderId) {
	const meta = await db.getObject(`folder:${uid}:${folderId}`);
	if (!meta || !meta.name) return null;
	return { id: String(folderId), name: meta.name, createdAt: meta.createdAt };
};


module.exports = Folders;
