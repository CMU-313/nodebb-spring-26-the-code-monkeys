<!-- IF !queueOpen -->
<div class="alert alert-warning">
	<strong>Queue is currently closed.</strong>
</div>
<!-- ENDIF !queueOpen -->

<div class="oh-queue" data-cid="{cid}">
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

	<!-- IF !isStaff -->
	<div class="card mb-3">
		<div class="card-body">
			<!-- IF inQueue -->
			<p>You are in the queue at position <strong>{position.position}</strong>.</p>
			<button class="btn btn-danger" data-action="leave">Leave Queue</button>
			<!-- ELSE -->
			<!-- IF queueOpen -->
			<button class="btn btn-primary" data-action="join">Join Queue</button>
			<!-- ELSE -->
			<p class="text-muted">The queue is closed. You cannot join at this time.</p>
			<!-- ENDIF queueOpen -->
			<!-- ENDIF inQueue -->
		</div>
	</div>
	<!-- ENDIF !isStaff -->

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
