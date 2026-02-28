'use strict';

const assert = require('assert');
const db = require('./mocks/databasemock');

const User = require('../src/user');
const Topics = require('../src/topics');
const Categories = require('../src/categories');
const Folders = require('../src/user/folders');

describe('Folders', () => {
	let uid;
	let cid;
	let pid;

	before(async () => {
		uid = await User.create({ username: 'folder_test_user' });
		const category = await Categories.create({ name: 'Folder Test Category' });
		cid = category.cid;
		const result = await Topics.post({
			uid: uid,
			cid: cid,
			title: 'Folder Test Topic',
			content: 'This is a test post for folders',
		});
		pid = result.postData.pid;
	});

	describe('create', () => {
		it('should create a folder and return its metadata', async () => {
			const folder = await Folders.create(uid, 'Study Notes');
			assert(folder);
			assert(folder.id);
			assert.strictEqual(folder.name, 'Study Notes');
			assert(folder.createdAt > 0);
		});

		it('should reject empty folder names', async () => {
			await assert.rejects(Folders.create(uid, ''), /invalid-data/);
			await assert.rejects(Folders.create(uid, '   '), /invalid-data/);
		});

		it('should reject folder names longer than 50 characters', async () => {
			const longName = 'a'.repeat(51);
			await assert.rejects(Folders.create(uid, longName), /invalid-data/);
		});
	});

	describe('list', () => {
		it('should list created folders', async () => {
			const folders = await Folders.list(uid);
			assert(Array.isArray(folders));
			assert(folders.length >= 1);
			const match = folders.find(f => f.name === 'Study Notes');
			assert(match);
		});

		it('should return empty array for user with no folders', async () => {
			const otherUid = await User.create({ username: 'folder_empty_user' });
			const folders = await Folders.list(otherUid);
			assert(Array.isArray(folders));
			assert.strictEqual(folders.length, 0);
		});
	});

	describe('getMeta', () => {
		it('should return folder metadata by id', async () => {
			const folder = await Folders.create(uid, 'Meta Test');
			const meta = await Folders.getMeta(uid, folder.id);
			assert(meta);
			assert.strictEqual(meta.name, 'Meta Test');
			assert.strictEqual(meta.id, folder.id);
		});

		it('should return null for non-existent folder', async () => {
			const meta = await Folders.getMeta(uid, 999999);
			assert.strictEqual(meta, null);
		});
	});

	describe('addPid / getPids / countPids', () => {
		let testFolder;

		before(async () => {
			testFolder = await Folders.create(uid, 'Post Folder');
		});

		it('should add a post to a folder', async () => {
			await Folders.addPid(uid, testFolder.id, pid);
			const pids = await Folders.getPids(uid, testFolder.id, 0, -1);
			assert(pids.includes(pid));
		});

		it('should count posts in a folder', async () => {
			const count = await Folders.countPids(uid, testFolder.id);
			assert.strictEqual(count, 1);
		});

		it('should not duplicate a post already in the folder', async () => {
			await Folders.addPid(uid, testFolder.id, pid);
			const count = await Folders.countPids(uid, testFolder.id);
			assert.strictEqual(count, 1);
		});
	});

	describe('delete', () => {
		it('should delete a folder and its posts', async () => {
			const folder = await Folders.create(uid, 'To Delete');
			await Folders.addPid(uid, folder.id, pid);
			await Folders.delete(uid, folder.id);

			const meta = await Folders.getMeta(uid, folder.id);
			assert.strictEqual(meta, null);

			const pids = await Folders.getPids(uid, folder.id, 0, -1);
			assert.strictEqual(pids.length, 0);
		});
	});
});
