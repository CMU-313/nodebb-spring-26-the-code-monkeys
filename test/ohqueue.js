'use strict';

const assert = require('assert');
const db = require('./mocks/databasemock');

const Categories = require('../src/categories');
const User = require('../src/user');
const groups = require('../src/groups');
const meta = require('../src/meta');
const ohqueue = require('../src/ohqueue');
const ohqueueAPI = require('../src/api/ohqueue');

async function cleanupQueue(targetCid) {
	const entries = await ohqueue.getQueueByCid(targetCid);
	await Promise.all(entries.map(e => ohqueue.removeEntry(e)));
}

describe('OH Queue', () => {
	let adminUid;
	let studentUid;
	let taUid;
	let cid;

	before(async () => {
		adminUid = await User.create({ username: 'ohq_admin' });
		await groups.join('administrators', adminUid);
		studentUid = await User.create({ username: 'ohq_student' });
		taUid = await User.create({ username: 'ohq_ta' });
		await groups.join('Global Moderators', taUid);
		const category = await Categories.create({ name: 'OH Queue Course' });
		cid = category.cid;
		meta.config.ohQueueEnabled = 1;
		await ohqueue.setQueueOpen(cid, true);
	});

	afterEach(async () => { await cleanupQueue(cid); });

	describe('data model', () => {
		it('should enable/disable via config', () => {
			assert.strictEqual(ohqueue.isEnabled(), true);
			meta.config.ohQueueEnabled = 0;
			assert.strictEqual(ohqueue.isEnabled(), false);
			meta.config.ohQueueEnabled = 1;
		});

		it('should open and close the queue', async () => {
			await ohqueue.setQueueOpen(cid, false);
			assert.strictEqual(await ohqueue.isQueueOpen(cid), false);
			await ohqueue.setQueueOpen(cid, true);
			assert.strictEqual(await ohqueue.isQueueOpen(cid), true);
		});

		it('should add a student to the queue', async () => {
			const entry = await ohqueue.join(cid, studentUid);
			assert.strictEqual(entry.status, 'waiting');
			assert.strictEqual(entry.uid, studentUid);
			assert.strictEqual(entry.cid, cid);
		});

		it('should reject duplicate join', async () => {
			await ohqueue.join(cid, studentUid);
			await assert.rejects(ohqueue.join(cid, studentUid), /already-joined/);
		});

		it('should reject join when queue is closed', async () => {
			await ohqueue.setQueueOpen(cid, false);
			await assert.rejects(ohqueue.join(cid, studentUid), /queue-closed/);
			await ohqueue.setQueueOpen(cid, true);
		});

		it('should let a student leave', async () => {
			await ohqueue.join(cid, studentUid);
			const entry = await ohqueue.leave(cid, studentUid);
			assert(entry);
			const active = await ohqueue.getActiveEntryByCidAndUid(cid, studentUid);
			assert.strictEqual(active, null);
		});

		it('should reject leave when not in queue', async () => {
			await assert.rejects(ohqueue.leave(cid, studentUid), /not-in-queue/);
		});

		it('should assign a waiting entry to a TA', async () => {
			const e = await ohqueue.join(cid, studentUid);
			const entry = await ohqueue.assign(e.id, taUid);
			assert.strictEqual(entry.status, 'assigned');
			assert.strictEqual(entry.assignedTo, taUid);
		});

		it('should reject assign on non-waiting entry', async () => {
			const e = await ohqueue.join(cid, studentUid);
			await ohqueue.assign(e.id, taUid);
			await assert.rejects(ohqueue.assign(e.id, taUid), /invalid-state/);
		});

		it('should resolve an assigned entry', async () => {
			const e = await ohqueue.join(cid, studentUid);
			await ohqueue.assign(e.id, taUid);
			const entry = await ohqueue.resolve(e.id);
			assert.strictEqual(entry.status, 'done');
		});

		it('should reject resolve on non-assigned entry', async () => {
			const e = await ohqueue.join(cid, studentUid);
			await assert.rejects(ohqueue.resolve(e.id), /invalid-state/);
		});

		it('should list entries and return position', async () => {
			await ohqueue.join(cid, studentUid);
			const entries = await ohqueue.getQueueByCid(cid);
			assert.strictEqual(entries.length, 1);
			const pos = await ohqueue.getPosition(cid, studentUid);
			assert.strictEqual(pos.position, 1);
			assert.strictEqual(pos.ahead, 0);
		});

		it('should return -1 position when not in queue', async () => {
			const pos = await ohqueue.getPosition(cid, studentUid);
			assert.strictEqual(pos.position, -1);
		});
	});

	describe('API layer', () => {
		it('should reject guests', async () => {
			await assert.rejects(ohqueueAPI.join({ uid: 0 }, { cid }), /not-logged-in/);
			await assert.rejects(ohqueueAPI.leave({ uid: 0 }, { cid }), /not-logged-in/);
			await assert.rejects(ohqueueAPI.getQueue({ uid: 0 }, { cid }), /not-logged-in/);
			await assert.rejects(ohqueueAPI.getPosition({ uid: 0 }, { cid }), /not-logged-in/);
		});

		it('should let a student join and leave', async () => {
			const entry = await ohqueueAPI.join({ uid: studentUid }, { cid });
			assert.strictEqual(entry.status, 'waiting');
			const left = await ohqueueAPI.leave({ uid: studentUid }, { cid });
			assert(left);
		});

		it('should restrict assign/resolve to staff', async () => {
			const e = await ohqueue.join(cid, studentUid);
			await assert.rejects(ohqueueAPI.assign({ uid: studentUid }, { id: e.id }), /no-privileges/);
			await ohqueue.assign(e.id, taUid);
			await assert.rejects(ohqueueAPI.resolve({ uid: studentUid }, { id: e.id }), /no-privileges/);
		});

		it('should let staff assign and resolve', async () => {
			const e = await ohqueue.join(cid, studentUid);
			const assigned = await ohqueueAPI.assign({ uid: taUid }, { id: e.id, taUid });
			assert.strictEqual(assigned.status, 'assigned');
			const resolved = await ohqueueAPI.resolve({ uid: taUid }, { id: e.id });
			assert.strictEqual(resolved.status, 'done');
		});

		it('should restrict setQueueOpen to staff', async () => {
			await assert.rejects(ohqueueAPI.setQueueOpen({ uid: studentUid }, { cid, open: false }), /no-privileges/);
			await ohqueueAPI.setQueueOpen({ uid: adminUid }, { cid, open: false });
			assert.strictEqual(await ohqueue.isQueueOpen(cid), false);
			await ohqueueAPI.setQueueOpen({ uid: adminUid }, { cid, open: true });
		});
	});
});
