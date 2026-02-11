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
});
