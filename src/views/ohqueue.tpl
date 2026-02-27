<div class="oh-queue" data-cid="{cid}" data-selected-cid="{selectedCid}">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h2>OH Queue</h2>
		<!-- IF isStaff -->
		<div>
			<button class="btn btn-sm <!-- IF queueOpen -->btn-danger<!-- ELSE -->btn-success<!-- ENDIF queueOpen -->" data-action="toggle-queue">
				<!-- IF queueOpen -->Close Queue<!-- ELSE -->Open Queue<!-- ENDIF queueOpen -->
			</button>
		</div>
		<!-- ENDIF isStaff -->
	</div>

	<div class="card mb-3">
		<div class="card-body">
			<label class="form-label">Course</label>
			<div class="d-flex gap-2">
				<select class="form-select" id="ohq-course-select">
					<option value="">Select a course…</option>
					<!-- BEGIN courses -->
					<option value="{courses.cid}">{courses.name}</option>
					<!-- END courses -->
				</select>
				<button class="btn btn-primary" id="ohq-go">Go</button>
			</div>
			<div class="form-text mt-2">
				Direct entry to OH Queue (no category browsing needed).
			</div>
		</div>
	</div>

	<div class="card mb-3" id="ohq-student-panel" style="display:none;">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<h4 class="mb-0" id="ohq-course-title"></h4>
				<span class="badge text-bg-secondary" id="ohq-open-badge">Loading…</span>
			</div>

			<div class="mb-3">
				<div class="mb-1">
					<strong>Status:</strong> <span id="ohq-status">—</span>
				</div>
				<div class="mb-1">
					<strong>Position:</strong> <span id="ohq-position">—</span>
				</div>
				<div class="mb-1">
					<strong>People ahead:</strong> <span id="ohq-ahead">—</span>
				</div>
				<div>
					<strong>Estimated wait:</strong> <span id="ohq-wait">—</span>
				</div>
			</div>

			<div class="d-flex gap-2">
				<button class="btn btn-success" id="ohq-join">Join Queue</button>
				<button class="btn btn-outline-danger" id="ohq-leave">Leave Queue</button>
			</div>

			<div class="alert alert-warning mt-3 mb-0" id="ohq-closed-alert" style="display:none;">
				<strong>Queue is currently closed.</strong>
			</div>

			<div class="alert alert-info mt-3 mb-0" id="ohq-note" style="display:none;"></div>
		</div>
	</div>

	<!-- IF !queueOpen -->
	<div class="alert alert-warning">
		<strong>Queue is currently closed.</strong>
	</div>
	<!-- ENDIF !queueOpen -->

	<div class="table-responsive">
		<table class="table table-striped">
			<thead>
				<tr>
					<th>#</th>
					<th>Student</th>
					<th>Status</th>
					<th>Joined</th>
					<!-- IF isStaff -->
					<th>Actions</th>
					<!-- ENDIF isStaff -->
				</tr>
			</thead>
			<tbody>
				<!-- IF !entries.length -->
				<tr>
					<td colspan="5" class="text-center text-muted">Queue is empty</td>
				</tr>
				<!-- ENDIF !entries.length -->
				{{{each entries}}}
				<tr data-entry-id="{entries.id}">
					<td>{@index}</td>
					<td>{entries.uid}</td>
					<td><span class="badge bg-secondary">{entries.status}</span></td>
					<td>{entries.joinedAt}</td>
					<!-- IF isStaff -->
					<td>
						<!-- IF function.isWaiting, entries.status -->
						<button class="btn btn-sm btn-primary" data-action="assign" data-id="{entries.id}">Assign</button>
						<!-- ENDIF function.isWaiting -->
						<!-- IF function.isAssigned, entries.status -->
						<button class="btn btn-sm btn-success" data-action="resolve" data-id="{entries.id}">Resolve</button>
						<!-- ENDIF function.isAssigned -->
					</td>
					<!-- ENDIF isStaff -->
				</tr>
				{{{end}}}
			</tbody>
		</table>
	</div>
</div>
