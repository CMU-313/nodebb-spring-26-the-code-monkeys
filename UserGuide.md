# User Guide — The Code Monkeys (NodeBB Spring 26)

This document describes every new feature our team implemented, how to use and user-test each one, and where the automated tests live.

---

## Table of Contents

0. [Setup & Running NodeBB](#0-setup--running-nodebb)
1. [Anonymous Posting](#1-anonymous-posting)
2. [Q&A Infrastructure (Categories, Resolved/Unresolved, Accepted Answer)](#2-qa-infrastructure)
3. [Office Hours Queue](#3-office-hours-queue)
4. [Folders & Bookmarks](#4-folders--bookmarks)
5. [Project 1 Code-Smell Refactors](#5-project-1-code-smell-refactors)
6. [Automated Tests](#6-automated-tests)

---

## 0. Setup & Running NodeBB

### Initial Setup

If this is your first time running NodeBB, run the setup wizard:

```bash
./nodebb setup
```

This will walk you through creating an admin account and configuring the database. Follow the on-screen prompts.

### Installing Dependencies

Install all NodeBB development dependencies:

```bash
npm install
```

### Starting the Server

Launch the server from the integrated terminal in VS Code:

```bash
./nodebb start
```

Navigate to **http://localhost:4567** in your browser to see the main forum page.

NodeBB listens on port 4567 inside the container and is forwarded to `localhost:4567` on your machine (configured by the DevContainer). If you need to change the host port (e.g., to avoid a conflict), use the **Ports** tab at the bottom of VS Code and modify the Forwarded Address.

### Stopping the Server

```bash
./nodebb stop
```

You can also run `./nodebb --help` to learn about other available commands.

### Lint and Test

When working on this codebase, use the linter and test suite to verify your changes:

```bash
npm run lint
npm run test
```

---

## 1. Anonymous Posting

**PR:** `feature/anonymous-posting`
**Issue:** [#21](https://github.com/CMU-313/nodebb-spring-26-the-code-monkeys/issues/21)

### What It Does

Users can publish posts and replies anonymously. When the "Post Anonymously" checkbox is checked in the composer, the post is stored with an `anonymous` flag. Everywhere that post appears (topic view, post summaries, category teasers, recent posts), the author's name, avatar, and profile link are replaced with a generic **"Anonymous"** identity.

### Step-by-Step Usage

1. **Log in** to any account on the forum at `http://localhost:4567`.
2. On the home page, click on any **category name** (e.g., "General Discussion") to enter it.
3. Click the blue **"New Topic"** button in the top-right of the category page. The composer panel opens at the bottom of the screen.
4. Type a title and body for your post.
5. Look directly to the left of the **Submit** button — you will see a checkbox labeled **"Post Anonymously"**. Check it.
6. Click **Submit**.
7. The new topic appears. Where the author name/avatar would normally be, it instead shows **"Anonymous"** with a generic "A" avatar and no profile link.
8. To test with a **reply**: open any existing topic, click the **Reply** button, check **"Post Anonymously"** in the composer, and submit. The reply also shows "Anonymous".

### How to User-Test

| # | Action | Where to Click | Expected Result |
|---|--------|----------------|-----------------|
| 1 | Log in | Top-right **Log In** button → enter credentials → **Login** | Redirected to home page |
| 2 | Enter a category | Click any category name on the home page (e.g., "General Discussion") | Category topic list loads |
| 3 | Open composer | Click blue **"New Topic"** button (top-right) | Composer panel slides up |
| 4 | Check anonymous | Check the **"Post Anonymously"** checkbox next to Submit | Checkbox becomes checked |
| 5 | Submit the topic | Click **Submit** | Topic is created; author shows **"Anonymous"** with an "A" avatar |
| 6 | View as another user | Log out (hamburger menu → **Logout**), or open an incognito window | Author still shows "Anonymous"; no profile link |
| 7 | Post a non-anonymous reply | Open a topic → **Reply** → leave checkbox unchecked → **Submit** | Reply shows the real username and avatar |
| 8 | Check recent posts | Click **"Recent"** in the navigation bar | Anonymous posts show "Anonymous" in the teaser |

### Key Files Changed

| File | Purpose |
|------|---------|
| `public/src/app.js` | Injects the checkbox into the composer UI; sets `composerData.anonymous` via the `filter:composer.submit` hook |
| `src/posts/create.js` | Stores `anonymous: 1` or `0` when creating a post |
| `src/posts/data.js` | Parses `anonymous` as an integer field from the database |
| `src/topics/posts.js` | Replaces user identity with "Anonymous" in topic post view |
| `src/topics/create.js` | Replaces user identity with "Anonymous" in real-time new-post events |
| `src/posts/summary.js` | Replaces user identity with "Anonymous" in post summaries |
| `public/openapi/components/schemas/PostObject.yaml` | Documents the `anonymous` field |
| `public/openapi/write/topics.yaml`, `tid.yaml` | Documents `anonymous` in request schemas |

---

## 2. Q&A Infrastructure

**PRs:** `add-q&A-features`, `feature/qanda-resolved-and-accepted`, `feature/qanda-accepted-answer`

### What It Does

This feature suite adds full Q&A (Question and Answer) support to NodeBB:

- **Q&A Categories:** Admins can mark any category as a Q&A category via a toggle in the admin category settings.
- **Resolved / Unresolved:** Topics in Q&A categories can be marked as Resolved or Unresolved using Topic Tools. Users can filter the topic list by resolved/unresolved status.
- **Accepted Answer:** Admins and moderators can mark a reply as the Accepted Answer. The accepted reply gets a visible badge, and there are inline Accept/Unaccept buttons on each reply. State updates are pushed in real-time via socket events.
- **Seeded Categories:** An upgrade script creates a default "Questions" parent category with "Project 1", "Exam 1", and "General" subcategories.

### Step-by-Step Usage

#### Creating a Q&A Category (Admin)
1. Log in as an **administrator**.
2. Click the **user avatar** in the top-right → click **Admin** (or navigate to `http://localhost:4567/admin`).
3. In the admin sidebar, click **Manage** → **Categories**.
4. Click on an existing category name to edit it, or click **"+ Create Category"** at the top to make a new one.
5. In the category settings panel, scroll down and find the **"Is Q & A"** toggle/checkbox. Turn it **ON**.
6. Click **Save** at the top of the settings panel.

#### Resolving / Unresolving a Topic
1. Navigate to a topic inside a Q&A category.
2. Click the **Topic Tools** button (wrench/gear icon at the top of the topic, near the reply button).
3. In the dropdown that appears, click **"Resolve"** to mark the topic as resolved.
4. The topic now shows a **"Resolved"** badge. To revert, open Topic Tools again and click **"Unresolve"**.

#### Filtering by Resolved / Unresolved
1. Go to the main topic list (click **"Recent"** in the top nav bar, or enter a category).
2. Look for the **filter dropdown** (near the top of the topic list, next to the sort controls).
3. Select **"Resolved"** to see only resolved Q&A topics, or **"Unresolved"** to see only open questions.

#### Accepting / Unaccepting an Answer
1. Open a topic in a Q&A category that has at least one reply.
2. On any **reply** (not the original/main post), look for the **"Accept Answer"** button (appears for admins and moderators, shown as an inline action on the post).
3. Click **"Accept Answer"**. The reply receives a green **"Accepted Answer"** badge visible to all users.
4. To remove the accepted status, click **"Unaccept Answer"** on the same reply.

### How to User-Test

| # | Action | Where to Click | Expected Result |
|---|--------|----------------|-----------------|
| 1 | Create a Q&A category | Admin → Manage → Categories → edit a category → toggle "Is Q & A" ON → Save | Category is now a Q&A category |
| 2 | Create a topic in the Q&A category | Enter the Q&A category → **New Topic** → fill in title/body → Submit | Topic created with `resolved: 0` |
| 3 | Resolve the topic | Open topic → **Topic Tools** (wrench icon) → **Resolve** | "Resolved" badge appears on the topic |
| 4 | Unresolve the topic | **Topic Tools** → **Unresolve** | Badge switches back to "Unresolved" |
| 5 | Filter by Resolved | Go to Recent or category → filter dropdown → **Resolved** | Only resolved Q&A topics appear |
| 6 | Filter by Unresolved | Filter dropdown → **Unresolved** | Only unresolved Q&A topics appear |
| 7 | Reply to the topic | Open topic → **Reply** → type content → Submit | Reply posted under the main post |
| 8 | Accept the reply as answer | On the reply post, click **"Accept Answer"** | Green "Accepted Answer" badge appears on the reply |
| 9 | Unaccept the answer | On the accepted reply, click **"Unaccept Answer"** | Badge is removed |
| 10 | Try accepting the main post | On the original post, the "Accept Answer" button should not be available | Cannot accept the main post (only replies) |
| 11 | Try resolving in a non-Q&A category | Create a topic in a regular category → Topic Tools | "Resolve" option should not appear or should be rejected |

### Key Files Changed

| File | Purpose |
|------|---------|
| `src/categories/create.js` | Added `isQandA` field to category creation |
| `src/categories/data.js` | Added `isQandA` to `intFields` |
| `src/categories/index.js` | Added `isQandACategory()` helper; passes `isQandA` to topic list context |
| `src/topics/create.js` | Added `resolved` and `acceptedPid` fields to topic creation |
| `src/topics/data.js` | Added `resolved` and `acceptedPid` to `intFields` |
| `src/topics/tools.js` | Implemented `resolve`, `unresolve`, `acceptAnswer`, `unacceptAnswer` with permission checks |
| `src/topics/index.js` | Passes `isQandA` to topic list and topic page |
| `src/topics/sorted.js` | Adds resolved/unresolved filter support |
| `src/topics/unread.js` | Handles unread counts for resolved/unresolved filters |
| `src/controllers/write/topics.js` | Write API controllers for resolve/accept endpoints |
| `src/routes/write/topics.js` | Route definitions for `PUT/DELETE /:tid/resolve` and `PUT/DELETE /:tid/answer/:pid` |
| `public/src/client/topic/postTools.js` | Frontend accept/unaccept button logic and real-time state updates |
| `public/src/client/topic/threadTools.js` | Frontend resolve/unresolve button logic and real-time state updates |
| `src/upgrades/4.8.0/create_questions_categories.js` | Seeds default Questions categories |
| Various `.tpl` and `.yaml` files | Templates and OpenAPI schemas for new fields |

---

## 3. Office Hours Queue

**PR:** `oh-queue-infra`
**Issue:** [#21](https://github.com/CMU-313/nodebb-spring-26-the-code-monkeys/issues/21)

### What It Does

A real-time office hours queue system built into NodeBB. Students can join a per-course queue and see their position; TAs and admins can assign themselves to students and resolve entries. The queue follows a simple three-state lifecycle: **WAITING → ASSIGNED → DONE**.

Features:
- **Global toggle:** An admin can enable/disable the OH Queue system from Admin → Settings → OH Queue.
- **Per-course queue:** Each category can have its own queue, opened/closed independently.
- **Student actions:** Join queue, leave queue, view position.
- **Staff actions (admins & global moderators):** Assign a queue entry to a TA, resolve a completed entry, open/close the queue.
- **One active entry per student per course** — duplicate joins are rejected.
- **Real-time updates** via socket.io.
- **REST API** at `/api/v3/ohqueue/`.

### Step-by-Step Usage

#### Enabling the OH Queue (Admin)
1. Log in as an **administrator**.
2. Click the **user avatar** in the top-right → click **Admin**.
3. In the admin sidebar, click **Settings** → scroll down to find **OH Queue** (or navigate directly to `http://localhost:4567/admin/settings/ohqueue`).
4. Check the **"Enable OH Queue"** checkbox.
5. Click the **Save** button at the top of the settings page.

#### Opening a Queue for a Course (Staff)
1. First, note the **category ID** (cid) of the course category. You can find this in Admin → Manage → Categories (the number shown in the URL when editing a category, or in the category list).
2. Navigate to `http://localhost:4567/ohqueue/<cid>` (replace `<cid>` with the actual number, e.g., `/ohqueue/2`).
3. As staff, you will see an **"Open Queue"** button at the top-right of the page. Click it to allow students to join. The button changes to **"Close Queue"**.

#### Joining the Queue (Student)
1. Log in as a **student** (any non-admin, non-moderator account).
2. Navigate to `http://localhost:4567/ohqueue/<cid>`.
3. If the queue is open, you see a **"Join Queue"** button. Click it.
4. Your position is displayed (e.g., "You are in the queue at position 1").
5. To leave, click the red **"Leave Queue"** button.

#### Managing the Queue (TA / Admin)
1. Navigate to `http://localhost:4567/ohqueue/<cid>` while logged in as staff.
2. The page shows a **table** with columns: #, Student, Status, Joined, Actions.
3. For a WAITING entry, click the blue **"Assign"** button in the Actions column to assign it to yourself.
4. For an ASSIGNED entry, click the green **"Resolve"** button to mark it as done.
5. Click **"Close Queue"** (top-right) to stop new students from joining.

### REST API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v3/ohqueue/:cid/join` | Join the queue | Logged-in user |
| `POST` | `/api/v3/ohqueue/:cid/leave` | Leave the queue | Logged-in user |
| `GET` | `/api/v3/ohqueue/:cid` | Get all queue entries | Logged-in user |
| `GET` | `/api/v3/ohqueue/:cid/position` | Get your position | Logged-in user |
| `PUT` | `/api/v3/ohqueue/entry/:id/assign` | Assign an entry to a TA | Staff only |
| `PUT` | `/api/v3/ohqueue/entry/:id/resolve` | Resolve an entry | Staff only |
| `PUT` | `/api/v3/ohqueue/:cid/open` | Open/close the queue | Staff only |

### How to User-Test

| # | Action | Where to Click / Navigate | Expected Result |
|---|--------|--------------------------|-----------------|
| 1 | Enable OH Queue | Admin → Settings → OH Queue → check "Enable OH Queue" → **Save** | Setting saved |
| 2 | Open a queue | Navigate to `/ohqueue/<cid>` as staff → click **"Open Queue"** | Button changes to "Close Queue"; students can now join |
| 3 | Join the queue (student) | Log in as student → navigate to `/ohqueue/<cid>` → click **"Join Queue"** | Position displayed (e.g., "position 1"); "Leave Queue" button appears |
| 4 | Try to join again | Click **"Join Queue"** again (if still shown) | Rejected — "already joined" |
| 5 | Leave the queue | Click red **"Leave Queue"** button | Entry removed; "Join Queue" reappears |
| 6 | Staff assigns entry | As staff, in the queue table, click **"Assign"** on a waiting row | Status changes to "assigned" |
| 7 | Staff resolves entry | Click **"Resolve"** on the assigned row | Status changes to "done" |
| 8 | Close the queue | Click **"Close Queue"** (top-right) | "Queue is currently closed" banner shown; students cannot join |
| 9 | Non-staff tries assign | Log in as a regular user → try the assign API | Rejected — "no privileges" |

### Key Files Changed

| File | Purpose |
|------|---------|
| `src/ohqueue.js` | Core data model — join, leave, assign, resolve, getPosition, getQueueByCid |
| `src/api/ohqueue.js` | API business logic with permission enforcement |
| `src/controllers/write/ohqueue.js` | Write API controller |
| `src/routes/write/ohqueue.js` | Route definitions for `/api/v3/ohqueue/*` |
| `src/controllers/ohqueue.js` | Page controller for `/ohqueue/:cid` |
| `src/socket.io/ohqueue.js` | Socket.io module for real-time queue updates |
| `src/views/ohqueue.tpl` | Queue page template (student + staff views) |
| `src/views/admin/settings/ohqueue.tpl` | Admin settings template |
| `src/controllers/admin/settings.js` | Admin settings route handler |
| `install/data/defaults.json` | Default `ohQueueEnabled: 0` |

---

## 4. Folders & Bookmarks

**PRs:** `feature/p2b-folder-tab-with-bookmarks`, `p3-folders`

### What It Does

A personal folder system that lets users organize posts into named collections. Every user gets a default **Bookmarks** folder that auto-collects their bookmarked posts. Users can also create custom folders, delete them, and add any post to a folder from the post's dropdown menu.

### Step-by-Step Usage

#### Viewing Folders
1. **Log in** to your account.
2. Navigate to `http://localhost:4567/folders` in your browser (or, if using the Peace theme, click the **"Folders"** tab in the left sidebar).
3. You will see a page titled **"Folders"** with a list of all your folders. The default **"Bookmarked"** folder is always shown.

#### Creating a Folder
1. On the `/folders` page, click the blue **"New Folder"** button (top-right, next to the "Folders" heading).
2. A prompt appears asking for a folder name. Type a name (up to 50 characters) and confirm.
3. The new folder appears in the list with a folder icon and a trash-can delete button.

#### Deleting a Folder
1. On the `/folders` page, find the folder you want to delete.
2. Click the red **trash can icon** (🗑) to the right of the folder name.
3. The folder and all its saved posts are removed. (The default "Bookmarked" folder cannot be deleted — it has no trash icon.)

#### Adding a Post to a Folder
1. Open any topic on the forum.
2. On any post, click the **three-dot menu** (⋮ kebab icon) on the post — this is the post actions dropdown.
3. In the dropdown, click **"Add to Folder"**.
4. A modal dialog appears showing all your folders as radio buttons. Select the folder you want and click the **"Add"** button.
5. The post is now saved in that folder. (Adding the same post to the same folder again has no effect — no duplicates.)

#### Viewing Folder Contents
1. On the `/folders` page, click any **folder name** (e.g., "Bookmarked" or a custom folder name).
2. The folder opens, showing all saved posts with excerpts and clickable links back to the original topic.
3. Pagination is supported — 20 posts per page.

#### Using the Default Bookmarks Folder
1. Open any topic. On any post, click the **bookmark icon** (🔖) — this is NodeBB's built-in bookmark feature.
2. Navigate to `/folders/bookmarks`.
3. The bookmarked post appears in the list with a link back to the original.

### How to User-Test

| # | Action | Where to Click / Navigate | Expected Result |
|---|--------|--------------------------|-----------------|
| 1 | View folders | Log in → navigate to `/folders` | Page shows "Folders" heading and the "Bookmarked" folder |
| 2 | Bookmark a post | Open a topic → click the **bookmark icon** (🔖) on any post | Post is bookmarked (icon highlights) |
| 3 | View bookmarks | Navigate to `/folders/bookmarks` | The bookmarked post appears with excerpt and link |
| 4 | Create a folder | On `/folders` page → click **"New Folder"** → type "Exam Notes" → confirm | "Exam Notes" folder appears in the list with a folder icon and trash button |
| 5 | Add a post to folder | Open a topic → click **three-dot menu** (⋮) on a post → **"Add to Folder"** → select "Exam Notes" → **"Add"** | Post is saved to the folder |
| 6 | View folder contents | Navigate to `/folders` → click **"Exam Notes"** | The added post appears with excerpt and link |
| 7 | Add same post again | Repeat step 5 for the same post and folder | No duplicate; folder contents unchanged |
| 8 | Delete a folder | On `/folders` → click the **trash icon** (🗑) next to "Exam Notes" | Folder removed from the list |
| 9 | Verify deletion | Navigate to `/folders` | "Exam Notes" no longer appears; "Bookmarked" still present |
| 10 | Access while logged out | Log out → navigate to `/folders` | Redirected to the login page |

### Key Files Changed

| File | Purpose |
|------|---------|
| `src/user/folders.js` | Data model — create, delete, list, addPid, getPids, getMeta |
| `src/controllers/folders.js` | Page controllers for `/folders`, `/folders/bookmarks`, `/folders/:folderId` |
| `src/routes/folders.js` | Route definitions |
| `public/src/client/folders.js` | Client-side folder creation/deletion logic |
| `public/src/client/topic/postTools.js` | "Add to Folder" button in post menu |
| `src/views/folders.tpl` | Main folders listing template |
| `src/views/folders_bookmarks.tpl` | Bookmarks folder view template |
| `src/views/folders_custom.tpl` | Custom folder view template |
| `src/views/modals/add-to-folder.tpl` | "Add to Folder" modal template |

---

## 5. Project 1 Code-Smell Refactors

These are cherry-picked refactors from individual Project 1 submissions. Each is isolated and introduces no new behavior—only cleaner code.

### 5a. `translateEventArgs` Parameter Reduction (Ethan)

**Original PR:** [NodeBB#55](https://github.com/CMU-313/NodeBB/pull/55)
**File:** `src/topics/events.js`

Reduced the parameters of `translateEventArgs` from multiple positional arguments to a single configuration object `{ event, language, prefix, args }`. All internal callers were updated.

### 5b. `parseAndTranslate` Parameter Reduction (Shreyas)

**Original PR:** [NodeBB#181](https://github.com/CMU-313/NodeBB/pull/181)
**File:** `public/src/app.js`

Reduced parameters in `parseAndTranslate` by supporting a combined `{ blockName, data }` object signature alongside the existing positional signatures, with no behavior change.

### 5c. `Translator.prototype.translate` Refactor (Daniel)

**Original PR:** [NodeBB#140](https://github.com/CMU-313/NodeBB/pull/140)
**File:** `public/src/modules/translator.common.js`

Refactored `Translator.prototype.translate()` to reduce deeply nested control flow, improving readability without changing behavior.

### 5d. `getNonPrivilegeGroups` Parameter Reduction (Jing)

**Original PR:** [NodeBB#127](https://github.com/CMU-313/NodeBB/pull/127)
**File:** `src/groups/index.js` (and 4 related admin/grouping files)

Reduced the parameters of `Groups.getNonPrivilegeGroups` from four positional arguments (`set`, `start`, `stop`, `flags`) to a single configuration object `group_info`.

---

## 6. Automated Tests

### Test Locations and Coverage

| Feature | Test File | # of Tests | What's Tested |
|---------|-----------|------------|---------------|
| **Anonymous Posting** | `test/posts.js` (search for `describe('anonymous posting')`) | 4 | Stores `anonymous` flag as integer `1`; hides user identity in topic view; hides user identity in post summaries; does **not** hide identity for non-anonymous posts |
| **Q&A Infrastructure** | `test/qanda.js` | 23 | Category `isQandA` field creation and persistence; `isQandACategory()` helper; topic `resolved`/`acceptedPid` default values and persistence; resolve/unresolve with permission checks; accept/unaccept answer with validation (wrong topic, main post, non-Q&A category); upgrade script existence; `isQandA` in topic list context; resolved/unresolved filter correctness |
| **Office Hours Queue** | `test/ohqueue.js` | 18 | Enable/disable via config; open/close queue; student join and duplicate rejection; join-when-closed rejection; leave and leave-when-not-in-queue; assign waiting entry and reject re-assign; resolve assigned entry and reject premature resolve; list entries and position tracking; position when not in queue; API guest rejection; API student join/leave; API staff-only assign/resolve; API staff-only setQueueOpen |
| **Folders** | `test/folders.js` | 11 | Folder creation with valid name; empty/long name rejection; listing folders; empty list for new user; getMeta by id; getMeta for non-existent folder; addPid to folder; countPids; no-duplicate addPid; delete folder and verify metadata + posts removed |

### Why These Tests Are Sufficient

- **Anonymous Posting (4 tests):** Covers the complete data lifecycle — storage, display in the two main rendering paths (topic view and post summaries), and the critical negative case (non-anonymous posts still show real identity). These tests exercise the backend changes in `create.js`, `data.js`, `posts.js`, and `summary.js`.

- **Q&A Infrastructure (23 tests):** Covers every data model field (`isQandA`, `resolved`, `acceptedPid`), every tool action (`resolve`, `unresolve`, `acceptAnswer`, `unacceptAnswer`), every validation rule (non-Q&A category rejection, main-post rejection, cross-topic rejection), the upgrade script, and the topic list filtering by resolved/unresolved status.

- **Office Hours Queue (18 tests):** Covers every state transition in the `WAITING → ASSIGNED → DONE` lifecycle, every error case (duplicate join, closed queue, invalid state transitions, not-in-queue leave), the position tracking system, and the API permission layer (guest rejection, staff-only enforcement for assign/resolve/setQueueOpen).

- **Folders (11 tests):** Covers the full CRUD lifecycle of the folders data model — creation with validation (valid name, empty name, name too long), listing and metadata retrieval, post addition with deduplication, counting, and deletion with verification that both metadata and associated posts are cleaned up.

### Running the Tests

Stop NodeBB first if it is running (tests need port 4567 free):

```bash
./nodebb stop
```

Then run each test suite:

```bash
npm run test                    # Run the full test suite

# Or run individual test files:
npx mocha test/posts.js         # Anonymous posting tests (132 total, 4 anonymous-specific)
npx mocha test/qanda.js         # Q&A tests (23 tests)
npx mocha test/ohqueue.js       # OH Queue tests (18 tests)
npx mocha test/folders.js       # Folders tests (11 tests)
```
