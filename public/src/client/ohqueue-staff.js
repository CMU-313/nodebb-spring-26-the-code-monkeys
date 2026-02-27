/* eslint-env browser */
'use strict';

define('forum/ohqueue-staff', ['api', 'jquery'], function (api, $) {
	function root() {
		return document.querySelector('.oh-queue[data-cid]');
	}

	function cid() {
		const r = root();
		if (!r) return null;
		const v = r.getAttribute('data-cid');
		const n = v ? parseInt(v, 10) : NaN;
		return Number.isFinite(n) ? n : null;
	}

	function toggleBtn() {
		return document.querySelector('[data-action="toggle-queue"]');
	}

	function isOpenFromButton(btn) {
		if (!btn) return null;
		const t = (btn.textContent || '').toLowerCase();
		if (t.includes('close')) return true;
		if (t.includes('open')) return false;
		return null;
	}

	async function setQueueOpen(courseId, open) {
		return await api.put(`/api/v3/ohqueue/${courseId}/open`, { open: !!open });
	}

	function bind() {
		const courseId = cid();
		const btn = toggleBtn();
		if (!courseId || !btn) return;

		btn.addEventListener('click', async function () {
			btn.disabled = true;
			const cur = isOpenFromButton(btn);
			const next = cur == null ? true : !cur;
			try {
				await setQueueOpen(courseId, next);
				window.location.reload();
			} catch (e) {
				btn.disabled = false;
				window.alert('Failed to update queue state.');
			}
		});
	}

	$(window).on('action:ajaxify.end', function () {
		bind();
	});

	setTimeout(function () {
		bind();
	}, 250);

	return {};
});