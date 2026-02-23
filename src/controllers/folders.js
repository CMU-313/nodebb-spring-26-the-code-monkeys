'use strict';

const nconf = require('nconf');

const db = require('../database');
const posts = require('../posts');
const user = require('../user');
const foldersService = require('../user/folders');

function buildPagination(page, perPage, totalCount) {
	const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
	const currentPage = Math.min(Math.max(1, page), totalPages);

	return {
		currentPage,
		pageCount: totalPages,
		prev: currentPage > 1 ? currentPage - 1 : null,
		next: currentPage < totalPages ? currentPage + 1 : null,
	};
}

function stripHtml(html) {
	return String(html || '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function makeExcerpt(text, maxLen = 80) {
	const t = stripHtml(text);
	if (!t) return '';
	return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

async function getBookmarkedPids(uid, start, stop) {
	const key = `uid:${uid}:bookmarks`;
	const pids = await db.getSortedSetRevRange(key, start, stop);
	return (pids || []).map(pid => parseInt(pid, 10)).filter(Number.isFinite);
}

async function getBookmarksCount(uid) {
	return await db.sortedSetCard(`uid:${uid}:bookmarks`);
}

async function hydratePosts(pids, viewerUid) {
	if (!pids.length) {
		return [];
	}
	if (typeof posts.getPostsByPids === 'function') {
		const postData = await posts.getPostsByPids(pids, viewerUid);
		const byPid = new Map(postData.filter(Boolean).map(p => [p.pid, p]));
		return pids.map(pid => byPid.get(pid)).filter(Boolean);
	}
	const loaded = await Promise.all(pids.map(pid => posts.getPostData(pid, viewerUid)));
	return loaded.filter(Boolean);
}

async function buildFoldersNav(uid, active) {
	const custom = await foldersService.list(uid);
	const rel = nconf.get('relative_path');

	const nav = [
		{
			slug: 'bookmarks',
			name: 'Bookmarked',
			href: `${rel}/folders/bookmarks`,
			icon: 'fa-bookmark',
			active: active === 'bookmarks',
		},
		...custom.map(f => ({
			id: f.id,
			slug: `f${f.id}`,
			name: f.name,
			href: `${rel}/folders/${f.id}`,
			icon: 'fa-folder',
			active: String(active) === String(f.id),
		})),
	];

	return nav;
}

const foldersController = {};

foldersController.get = async function (req, res, next) {
	try {
		if (!req.uid) {
			return res.redirect(`${nconf.get('relative_path')}/login`);
		}

		const rel = nconf.get('relative_path');
		const custom = await foldersService.list(req.uid);

		const folders = [
			{
				slug: 'bookmarks',
				name: 'Bookmarked',
				description: 'All of your bookmarked posts',
				href: `${rel}/folders/bookmarks`,
				icon: 'fa-bookmark',
			},
			...custom.map(f => ({
				id: f.id,
				slug: `f${f.id}`,
				name: f.name,
				description: '',
				href: `${rel}/folders/${f.id}`,
				icon: 'fa-folder',
			})),
		];

		res.render('folders', {
			title: 'Folders',
			folders,
		});
	} catch (err) {
		next(err);
	}
};

foldersController.bookmarks = {};
foldersController.bookmarks.get = async function (req, res, next) {
	try {
		if (!req.uid) {
			return res.redirect(`${nconf.get('relative_path')}/login`);
		}

		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const perPage = 20;
		const start = (page - 1) * perPage;
		const stop = start + perPage - 1;

		const [count, pids] = await Promise.all([
			getBookmarksCount(req.uid),
			getBookmarkedPids(req.uid, start, stop),
		]);

		const postData = await hydratePosts(pids, req.uid);
		postData.forEach((p) => {
			p.postUrl = `${nconf.get('relative_path')}/post/${p.pid}`;
			const body = p.content || p.rawContent || '';
			p.postTitle = makeExcerpt(body, 80);
			p.topicTitle = p.topic && p.topic.title ? p.topic.title : '';
		});

		const userData = await user.getUserFields(req.uid, ['uid', 'username', 'userslug', 'picture']);
		const folders = await buildFoldersNav(req.uid, 'bookmarks');

		res.render('folders_bookmarks', {
			title: 'Bookmarked',
			user: userData,
			folders,
			activeFolder: 'bookmarks',
			posts: postData,
			pagination: buildPagination(page, perPage, count),
			hasItems: postData.length > 0,
		});
	} catch (err) {
		next(err);
	}
};

foldersController.folder = {};
foldersController.folder.get = async function (req, res, next) {
	try {
		if (!req.uid) {
			return res.redirect(`${nconf.get('relative_path')}/login`);
		}

		const folderId = String(req.params.folderId || '').trim();
		if (!folderId || folderId === 'bookmarks') {
			return res.redirect(`${nconf.get('relative_path')}/folders/bookmarks`);
		}

		const meta = await foldersService.getMeta(req.uid, folderId);
		if (!meta) {
			return res.status(404).render('404', {});
		}

		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const perPage = 20;
		const start = (page - 1) * perPage;
		const stop = start + perPage - 1;

		const [count, pids] = await Promise.all([
			foldersService.countPids(req.uid, folderId),
			foldersService.getPids(req.uid, folderId, start, stop),
		]);

		const postData = await hydratePosts(pids, req.uid);
		postData.forEach((p) => {
			p.postUrl = `${nconf.get('relative_path')}/post/${p.pid}`;
			const body = p.content || p.rawContent || '';
			p.postTitle = makeExcerpt(body, 80);
			p.topicTitle = p.topic && p.topic.title ? p.topic.title : '';
		});

		const userData = await user.getUserFields(req.uid, ['uid', 'username', 'userslug', 'picture']);
		const folders = await buildFoldersNav(req.uid, folderId);

		res.render('folders_custom', {
			title: meta.name,
			user: userData,
			folders,
			activeFolder: folderId,
			posts: postData,
			pagination: buildPagination(page, perPage, count),
			hasItems: postData.length > 0,
			folderId,
			folderName: meta.name,
		});
	} catch (err) {
		next(err);
	}
};

module.exports = foldersController;
