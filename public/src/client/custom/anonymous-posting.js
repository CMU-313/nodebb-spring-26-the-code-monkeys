'use strict';

define('forum/custom/anonymous-posting', function () {
	const AnonymousPosting = {};

	AnonymousPosting.init = function () {
		// Add checkbox when composer loads
		$(window).on('action:composer.loaded', function (ev, data) {
			addAnonymousCheckbox(data.post_uuid);
		});

		// Intercept post data before submission
		$(window).on('action:composer.submit', function (ev, data) {
			const composer = $('[data-uuid="' + data.post_uuid + '"]');
			const checkbox = composer.find('[data-anonymous-checkbox]');
			
			if (checkbox.length && checkbox.is(':checked')) {
				data.anonymous = true;
			} else {
				data.anonymous = false;
			}
		});
	};

	function addAnonymousCheckbox(postUuid) {
		const composer = $('[data-uuid="' + postUuid + '"]');
		
		// Avoid duplicates
		if (composer.find('.anonymous-posting-container').length) {
			return;
		}

		// Create checkbox HTML
		const checkboxHtml = `
			<div class="form-check anonymous-posting-container" style="display: inline-block; margin-right: 10px;">
				<input class="form-check-input" type="checkbox" id="anonymous-${postUuid}" data-anonymous-checkbox>
				<label class="form-check-label" for="anonymous-${postUuid}" style="font-size: 0.9rem;">
					Post Anonymously
				</label>
			</div>
		`;
		
		// Find the submit button in mobile navbar
		const mobileSubmit = composer.find('.mobile-navbar [data-action="post"]');
		if (mobileSubmit.length) {
			mobileSubmit.parent().before(checkboxHtml);
		}
		
		// Also add to desktop composer submit area
		const desktopSubmit = composer.find('.write [data-action="post"]');
		if (desktopSubmit.length && !desktopSubmit.parent().parent().find('.anonymous-posting-container').length) {
			desktopSubmit.parent().before(checkboxHtml);
		}
	}

	return AnonymousPosting;
});