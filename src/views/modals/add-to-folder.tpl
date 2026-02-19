<div class="add-to-folder">
	<div class="mb-2 fw-semibold">Choose a folder</div>

	<div class="list-group">
		{{{ each folders }}}
		<label class="list-group-item d-flex align-items-center gap-2">
			<input class="form-check-input m-0 folder-radio" type="radio" name="folder" value="{./id}" {{{ if @first }}}checked{{{ end }}}>
			<span class="flex-grow-1">{./name}</span>
		</label>
		{{{ end }}}
	</div>

	<div class="d-flex justify-content-end gap-2 mt-3">
		<button type="button" class="btn btn-light" data-action="cancel">Cancel</button>
		<button type="button" class="btn btn-primary" data-action="add">Add</button>
	</div>
</div>
