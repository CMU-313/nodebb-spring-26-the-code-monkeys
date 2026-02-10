'use strict';

const db = require('../../database');
const categories = require('../../categories');

module.exports = {
	name: 'Create Questions category with Project 1, Exam 1, and General subcategories',
	timestamp: Date.UTC(2026, 1, 8),
	method: async () => {
		// Check if a "Questions" category already exists to avoid duplicates
		const allCids = await db.getSortedSetRange('categories:cid', 0, -1);
		const allCategories = await categories.getCategoriesFields(allCids, ['cid', 'name']);
		const existing = allCategories.find(c => c && c.name === 'Questions');
		if (existing) {
			// Already exists, ensure subcategories exist
			const childCids = await db.getSortedSetRange(`cid:${existing.cid}:children`, 0, -1);
			const children = await categories.getCategoriesFields(childCids, ['cid', 'name']);
			const childNames = children.map(c => c && c.name);

			const subcats = ['Project 1', 'Exam 1', 'General'];
			for (const name of subcats) {
				if (!childNames.includes(name)) {
					// eslint-disable-next-line no-await-in-loop
					await categories.create({
						name: name,
						parentCid: existing.cid,
						isQandA: 1,
					});
				}
			}

			// Ensure parent is marked as Q&A
			await db.setObjectField(`category:${existing.cid}`, 'isQandA', 1);
			return;
		}

		// Create the parent Questions category
		const parent = await categories.create({
			name: 'Questions',
			description: 'Ask and answer questions',
			icon: 'fa-question-circle',
			isQandA: 1,
		});

		// Create subcategories
		const subcategories = ['Project 1', 'Exam 1', 'General'];
		for (const name of subcategories) {
			// eslint-disable-next-line no-await-in-loop
			await categories.create({
				name: name,
				parentCid: parent.cid,
				isQandA: 1,
			});
		}
	},
};
