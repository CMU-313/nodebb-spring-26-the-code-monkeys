'use strict';

define('forum/ohqueue-student', ['api'], function (api) {
	const AVG_MIN_PER_STUDENT = 10;

	function el(id) {
		return document.getElementById(id);
	}

	function selectedCid() {
		const root = document.querySelector('[data-selected-cid]');
		const v = root && root.getAttribute('data-selected-cid');
		const n = v ? parseInt(v, 10) : NaN;
		return Number.isFinite(n) ? n : null;
	}

	function showNote(msg) {
		const n = el('ohq-note');
		if (!n) return;
		if (!msg) {
			n.style.display = 'none';
			n.textContent = '';
			return;
		}
		n.style.display = '';
		n.textContent = msg;
	}

	function setOpenUI(open) {
		const badge = el('ohq-open-badge');
		const closed = el('ohq-closed-alert');
		if (badge) {
			badge.className = `badge ${open ? 'text-bg-success' : 'text-bg-danger'}`;
			badge.textContent = open ? 'Open' : 'Closed';
		}
		if (closed) closed.style.display = open ? 'none' : '';
	}

	function formatWait(ahead) {
		if (ahead == null || Number.isNaN(ahead)) return '—';
		const m = Math.max(0, ahead) * AVG_MIN_PER_STUDENT;
		if (m === 0) return '0 min';
		if (m < 60) return `${m} min`;
		const h = Math.floor(m / 60);
		const r = m % 60;
		return r ? `${h}h ${r}m` : `${h}h`;
	}

	function mapStatus(entry) {
		if (!entry) return 'not in queue';
		const st = (entry.status || entry.state || '').toUpperCase();
		if (st === 'WAITING') return 'waiting';
		if (st === 'ASSIGNED') return 'in progress';
		if (st === 'DONE') return 'done';
		return (entry.status || entry.state || 'unknown').toString().toLowerCase();
	}

	async function getQueue(cid) {
		return await api.get(`/api/v3/ohqueue/${cid}`);
	}

	async function getPosition(cid) {
		return await api.get(`/api/v3/ohqueue/${cid}/position`);
	}

	async function join(cid) {
		return await api.post('/api/v3/ohqueue/join', { cid });
	}

	async function leave(cid) {
		return await api.post('/api/v3/ohqueue/leave', { cid });
	}

	function setButtons(open, inQueue) {
		const bJoin = el('ohq-join');
		const bLeave = el('ohq-leave');
		if (bJoin) bJoin.disabled = !open || inQueue;
		if (bLeave) bLeave.disabled = !inQueue;
	}

	async function refresh(cid) {
		showNote('');

		const panel = el('ohq-student-panel');
		if (panel) panel.style.display = '';

		const title = el('ohq-course-title');
		if (title) title.textContent = `Course ${cid}`;

		let q;
		try {
			q = await getQueue(cid);
		} catch (e) {
			showNote('Unable to load queue.');
			return;
		}

		const open = !!(q && (q.queueOpen ?? q.isOpen ?? q.open));
		setOpenUI(open);

		const myEntry = q && (q.myEntry || q.entry || q.self || q.activeEntry);
		const inQueue = !!myEntry;

		const status = el('ohq-status');
		if (status) status.textContent = mapStatus(myEntry);

		let pos = null;
		try {
			pos = await getPosition(cid);
		} catch (e) {}

		const p = pos && (pos.position ?? pos.pos);
		const a = pos && (pos.ahead ?? pos.peopleAhead ?? pos.numAhead);

		const position = el('ohq-position');
		const ahead = el('ohq-ahead');
		const wait = el('ohq-wait');

		if (position) position.textContent = p == null ? '—' : `${p}`;
		if (ahead) ahead.textContent = a == null ? '—' : `${a}`;
		if (wait) wait.textContent = formatWait(a == null ? null : Number(a));

		setButtons(open, inQueue);
	}

	function bindSelector() {
		const cid = selectedCid();
		const sel = el('ohq-course-select');
		const go = el('ohq-go');

		if (sel && cid != null) sel.value = String(cid);

		if (go) {
			go.addEventListener('click', function () {
				if (!sel || !sel.value) return;
				window.location.href = `/ohqueue/${sel.value}`;
			});
		}
	}

	function bindActions(cid) {
		const bJoin = el('ohq-join');
		const bLeave = el('ohq-leave');

		if (bJoin) {
			bJoin.addEventListener('click', async function () {
				bJoin.disabled = true;
				showNote('');
				try {
					await join(cid);
				} catch (e) {
					showNote(e && e.message ? e.message : 'Join failed.');
				}
				await refresh(cid);
			});
		}

		if (bLeave) {
			bLeave.addEventListener('click', async function () {
				bLeave.disabled = true;
				showNote('');
				try {
					await leave(cid);
				} catch (e) {
					showNote(e && e.message ? e.message : 'Leave failed.');
				}
				await refresh(cid);
			});
		}
	}

	function bindRealtime(cid) {
		if (typeof socket === 'undefined' || !socket) return;

		socket.on(`event:ohqueue:update:${cid}`, function () {
			refresh(cid);
		});
		socket.on('event:ohqueue:update', function (payload) {
			if (!payload) return;
			const pcid = payload.cid != null ? parseInt(payload.cid, 10) : null;
			if (pcid === cid) refresh(cid);
		});
	}

	$(window).on('action:ajaxify.end', function () {
		bindSelector();

		const cid = selectedCid();
		const panel = el('ohq-student-panel');
		if (!cid) {
			if (panel) panel.style.display = 'none';
			return;
		}

		bindActions(cid);
		bindRealtime(cid);
		refresh(cid);
	});

	setTimeout(function () {
		bindSelector();
		var initCid = selectedCid();
		if (initCid) {
			bindActions(initCid);
			bindRealtime(initCid);
			refresh(initCid);
		}
	}, 250);

	return {};
});