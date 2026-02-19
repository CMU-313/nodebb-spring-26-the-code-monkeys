<div class="d-flex justify-content-between align-items-center mb-3">
	<h2 class="text-uppercase fw-bold mb-0">Folders</h2>
	<button class="btn btn-primary btn-sm" id="new-folder-btn">New Folder</button>
</div>

<div class="list-group mb-3" style="max-width: 420px;">
	{{{ each folders }}}
	<div class="list-group-item d-flex align-items-center justify-content-between">
		<a class="text-decoration-none flex-grow-1" href="{./href}">{./name}</a>
		{{{ if ./id }}}
		<button class="btn btn-outline-danger btn-sm delete-folder-btn" data-folder-id="{./id}" data-folder-name="{./name}">
			<i class="fa fa-trash"></i>
		</button>
		{{{ end }}}
	</div>
	{{{ end }}}
</div>

<p class="text-muted small mb-0">
	Choose a folder to view its contents.
</p>

<script src="{config.relative_path}/assets/client/folders.js"></script>
