$(window).on('action:ajaxify.end', function (ev, data) {
	if (!data || !data.url || !data.url.startsWith('folders')) return;

	$('#new-folder-btn').off('click').on('click', function () {
		bootbox.prompt('Folder name', function (name) {
			if (!name) return;
			socket.emit('user.foldersCreate', { name }, function (err) {
				if (err) return app.alertError(err.message);
				ajaxify.refresh();
			});
		});
	});

	$(document).off('click.foldersDelete').on('click.foldersDelete', '.delete-folder-btn', function (e) {
		e.preventDefault();
		const folderId = $(this).attr('data-folder-id');
		const folderName = $(this).attr('data-folder-name') || 'this folder';
		if (!folderId) return;

		bootbox.confirm(`Delete "${folderName}"?`, function (ok) {
			if (!ok) return;
			socket.emit('user.foldersDelete', { folderId }, function (err) {
				if (err) return app.alertError(err.message);
				ajaxify.refresh();
			});
		});
	});
});
