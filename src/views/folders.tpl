<div class="d-flex justify-content-between align-items-center mb-3">
	<h2 class="text-uppercase fw-bold mb-0">Folders</h2>
</div>

<ul class="nav nav-pills gap-2 mb-3">
	{{{ each folders }}}
	<li class="nav-item">
		<a class="nav-link btn btn-sm" href="{./href}">{./name}</a>
	</li>
	{{{ end }}}
</ul>

<p class="text-muted small mb-0">
	Choose a folder to view its contents.
</p>
