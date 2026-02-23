<div class="d-flex justify-content-between align-items-start mb-3">
	<div>
		<h2 class="text-uppercase fw-bold mb-1">{folderName}</h2>
		{{{ if user.username }}}
		<div class="text-muted small">{folderName} for {user.username}</div>
		{{{ end }}}
	</div>
</div>

<div class="list-group mb-3">
	{{{ each folders }}}
	<a class="list-group-item {{{ if ./active }}}active{{{ end }}}" href="{./href}">{./name}</a>
	{{{ end }}}
</div>

{{{ if !hasItems }}}
<div class="alert alert-info mb-0">
	You don’t have any posts in this folder yet.
</div>
{{{ end }}}

{{{ if hasItems }}}
<ul class="list-unstyled">
	{{{ each posts }}}
	<li class="py-2 border-bottom">
		<div class="d-flex justify-content-between align-items-start gap-3">
			<div class="flex-grow-1">
				<div class="fw-semibold">
					<a href="{./postUrl}" class="text-decoration-none">
						{{{ if ./postTitle }}}
							{./postTitle}
						{{{ else }}}
							Post #{./pid}
						{{{ end }}}
					</a>
				</div>

				{{{ if ./topicTitle }}}
				<div class="text-muted small">
					in {./topicTitle}
				</div>
				{{{ end }}}
			</div>

			{{{ if ./timestampISO }}}
			<div class="text-muted small text-nowrap">
				<span class="timeago" title="{./timestampISO}"></span>
			</div>
			{{{ end }}}
		</div>
	</li>
	{{{ end }}}
</ul>

<nav class="mt-3">
	<ul class="pagination mb-0">
		{{{ if pagination.prev }}}
		<li class="page-item">
			<a class="page-link" href="?page={pagination.prev}">Previous</a>
		</li>
		{{{ end }}}

		<li class="page-item disabled">
			<span class="page-link">
				Page {pagination.currentPage} of {pagination.pageCount}
			</span>
		</li>

		{{{ if pagination.next }}}
		<li class="page-item">
			<a class="page-link" href="?page={pagination.next}">Next</a>
		</li>
		{{{ end }}}
	</ul>
</nav>
{{{ end }}}
