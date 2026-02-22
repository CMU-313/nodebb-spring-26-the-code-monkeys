'use strict';

const assert = require('assert');
const db = require('./mocks/databasemock');

const Categories = require('../src/categories');
const Topics = require('../src/topics');
const User = require('../src/user');
const groups = require('../src/groups');

describe('Q&A Features (Categories + Data Model)', () => {
	let adminUid;
	let qandaCid;
	let nonQandaCid;
	let topicData;
	let nonQandaTopicData;
	let qandaReplyPid;
	let nonQandaReplyPid;

	before(async () => {
		adminUid = await User.create({ username: 'qanda_admin' });
		await groups.join('administrators', adminUid);
	});

	describe('Category isQandA field', () => {
		it('should create a category with isQandA=1', async () => {
			const category = await Categories.create({
				name: 'Test Q&A Category',
				description: 'A Q&A category',
				isQandA: 1,
			});
			qandaCid = category.cid;
			assert.strictEqual(category.isQandA, 1);
		});

		it('should create a category with isQandA=0 by default', async () => {
			const category = await Categories.create({
				name: 'Test Normal Category',
				description: 'A regular category',
			});
			nonQandaCid = category.cid;
			assert.strictEqual(category.isQandA, 0);
		});

		it('should return true for isQandACategory on a Q&A category', async () => {
			const result = await Categories.isQandACategory(qandaCid);
			assert.strictEqual(result, true);
		});

		it('should return false for isQandACategory on a non-Q&A category', async () => {
			const result = await Categories.isQandACategory(nonQandaCid);
			assert.strictEqual(result, false);
		});

		it('should return false for isQandACategory with invalid cid', async () => {
			const result = await Categories.isQandACategory(null);
			assert.strictEqual(result, false);
		});

		it('should persist isQandA in category data', async () => {
			const data = await Categories.getCategoryData(qandaCid);
			assert.strictEqual(data.isQandA, 1);
		});

		it('should create subcategories under a Q&A parent', async () => {
			const child = await Categories.create({
				name: 'Q&A Sub Category',
				parentCid: qandaCid,
				isQandA: 1,
			});
			assert.strictEqual(child.isQandA, 1);
			assert.strictEqual(child.parentCid, qandaCid);
		});
	});

	describe('Topic resolved and acceptedPid fields', () => {
		it('should create a topic with resolved=0 and acceptedPid=0 by default', async () => {
			const result = await Topics.post({
				uid: adminUid,
				cid: qandaCid,
				title: 'Test Q&A Topic',
				content: 'This is a test question',
			});
			topicData = result.topicData;
			assert.strictEqual(topicData.resolved, 0);
			assert.strictEqual(topicData.acceptedPid, 0);
		});

		it('should persist resolved and acceptedPid fields in topic data', async () => {
			const data = await Topics.getTopicData(topicData.tid);
			assert.strictEqual(data.resolved, 0);
			assert.strictEqual(data.acceptedPid, 0);
		});

		it('should create a topic in a non-Q&A category for guard checks', async () => {
			const result = await Topics.post({
				uid: adminUid,
				cid: nonQandaCid,
				title: 'Test non-Q&A topic',
				content: 'This is a normal topic',
			});
			nonQandaTopicData = result.topicData;
			assert.strictEqual(nonQandaTopicData.resolved, 0);
		});

		it('should create replies for accepted answer tests', async () => {
			const [qandaReply, nonQandaReply] = await Promise.all([
				Topics.reply({
					uid: adminUid,
					tid: topicData.tid,
					content: 'This is a candidate accepted answer',
				}),
				Topics.reply({
					uid: adminUid,
					tid: nonQandaTopicData.tid,
					content: 'This is a non-Q&A reply',
				}),
			]);
			qandaReplyPid = qandaReply.pid;
			nonQandaReplyPid = nonQandaReply.pid;
			assert(qandaReplyPid);
			assert(nonQandaReplyPid);
		});
	});

	describe('Resolve/unresolve topic tools', () => {
		it('should resolve a topic in a Q&A category', async () => {
			const resolvedData = await Topics.tools.resolve(topicData.tid, adminUid);
			assert.strictEqual(resolvedData.resolved, 1);

			const persisted = await Topics.getTopicField(topicData.tid, 'resolved');
			assert.strictEqual(persisted, 1);
		});

		it('should unresolve a topic in a Q&A category', async () => {
			const unresolvedData = await Topics.tools.unresolve(topicData.tid, adminUid);
			assert.strictEqual(unresolvedData.resolved, 0);

			const persisted = await Topics.getTopicField(topicData.tid, 'resolved');
			assert.strictEqual(persisted, 0);
		});

		it('should reject resolving a topic in a non-Q&A category', async () => {
			await assert.rejects(
				Topics.tools.resolve(nonQandaTopicData.tid, adminUid),
				/\[\[error:invalid-data\]\]/
			);
		});
	});

	describe('Accept/unaccept answer topic tools', () => {
		it('should accept a reply in a Q&A category', async () => {
			const acceptedData = await Topics.tools.acceptAnswer(topicData.tid, qandaReplyPid, adminUid);
			assert.strictEqual(acceptedData.acceptedPid, qandaReplyPid);

			const persisted = await Topics.getTopicField(topicData.tid, 'acceptedPid');
			assert.strictEqual(persisted, qandaReplyPid);
		});

		it('should unaccept a reply in a Q&A category', async () => {
			const data = await Topics.tools.unacceptAnswer(topicData.tid, adminUid);
			assert.strictEqual(data.acceptedPid, 0);

			const persisted = await Topics.getTopicField(topicData.tid, 'acceptedPid');
			assert.strictEqual(persisted, 0);
		});

		it('should reject accepting the main post as an answer', async () => {
			await assert.rejects(
				Topics.tools.acceptAnswer(topicData.tid, topicData.mainPid, adminUid),
				/\[\[error:invalid-data\]\]/
			);
		});

		it('should reject accepting a reply from another topic', async () => {
			await assert.rejects(
				Topics.tools.acceptAnswer(topicData.tid, nonQandaReplyPid, adminUid),
				/\[\[error:invalid-data\]\]/
			);
		});

		it('should reject accepting an answer in a non-Q&A category', async () => {
			await assert.rejects(
				Topics.tools.acceptAnswer(nonQandaTopicData.tid, nonQandaReplyPid, adminUid),
				/\[\[error:invalid-data\]\]/
			);
		});
	});

	describe('Questions categories upgrade script', () => {
		it('should have the upgrade script file', () => {
			const script = require('../src/upgrades/4.8.0/create_questions_categories');
			assert(script);
			assert.strictEqual(typeof script.method, 'function');
			assert(script.name);
			assert(script.timestamp);
		});
	});

	describe('isQandA in topic list context', () => {
		it('should include isQandA=true for topics in Q&A categories in topic list', async () => {
			const topics = await Topics.getTopics([topicData.tid], { uid: adminUid });
			assert.strictEqual(topics.length > 0, true);
			assert.strictEqual(topics[0].isQandA, true);
		});
	});

	describe('resolved/unresolved filters', () => {
		it('should only include Q&A resolved topics in resolved filter', async () => {
			await Topics.tools.resolve(topicData.tid, adminUid);
			const data = await Topics.getSortedTopics({
				uid: adminUid,
				start: 0,
				stop: 20,
				filter: 'resolved',
				sort: 'recent',
				term: 'alltime',
			});
			assert.strictEqual(data.topics.some(t => t.tid === topicData.tid), true);
			assert.strictEqual(data.topics.every(t => t.isQandA && t.resolved === 1), true);
		});

		it('should only include Q&A unresolved topics in unresolved filter', async () => {
			await Topics.tools.unresolve(topicData.tid, adminUid);
			const data = await Topics.getSortedTopics({
				uid: adminUid,
				start: 0,
				stop: 20,
				filter: 'unresolved',
				sort: 'recent',
				term: 'alltime',
			});
			assert.strictEqual(data.topics.some(t => t.tid === topicData.tid), true);
			assert.strictEqual(data.topics.every(t => t.isQandA && t.resolved === 0), true);
		});
	});
});
