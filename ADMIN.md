# OBRII content administration

The `/admin` interface manages tours, the three hero images, both portraits per co-owner, home/page copy, legal text, contacts and SEO. The editor is Ukrainian; existing English content remains editable separately. Public pages continue to use the current design and Telegram request endpoint.

## One-time activation on Vercel

1. Merge this branch after reviewing it. The production site must contain `content/site.json` before the admin can read it.
2. Run `node scripts/admin-credentials.mjs` **locally**. Save the generated password in your password manager. Add `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` to Vercel as sensitive server-side environment variables.
3. Create a fine-grained GitHub token for **vbezia/obrii only**, with **Contents: read/write**. Add it as `CMS_GITHUB_TOKEN`. The token account must have repository access and permission to commit to the configured content branch. Never paste the token into chat or source code.
4. Set `CMS_GITHUB_REPOSITORY=vbezia/obrii` and `CMS_GITHUB_BRANCH=main` for **Production**. Retain the existing Telegram variables.
5. Redeploy and sign in at `https://obrii.vercel.app/admin` using the generated password.

No environment variable should use `NEXT_PUBLIC_`. Credentials are never sent to the browser. Rotate the session secret to invalidate all sessions. The admin password is a generated 192-bit secret stored only as a salted scrypt hash; sessions expire after eight hours. Per-instance login throttling is supplemental and is not a distributed rate limiter. Vercel Firewall can add distributed request limits if required.

For a Preview deployment, use separate credentials and set `CMS_GITHUB_BRANCH` to a dedicated test branch containing this implementation. The server rejects preview writes configured against `main`. Never inherit production CMS credentials into untrusted branch previews.

## Editing and publishing

- Add/edit tours, toggle visibility and homepage placement, set ordering, and upload images. Hidden tours disappear from the catalog, homepage, detail route and sitemap after deployment. They are **not private**: this repository is public and hidden records must not contain confidential data.
- The homepage shows the first six visible, featured tours by order.
- Use JPG, PNG or WebP images (2 MiB each, 3 MiB combined per publish), or HTTPS image URLs. Uploads and content are committed together. Larger image batches can be published in successive updates. Uploaded files are retained in Git history; deleting a tour does not delete its image.
- Each Publish creates one Git commit, then Vercel's existing Git integration builds the site. A successful save means Git accepted the content, **not that deployment has completed**. Check the Vercel build if changes do not appear. No deploy hook is necessary when the production branch integration is enabled.
- Competing edits or code changes cause a conflict instead of overwriting another revision. Export your current copy, reload the latest content, and reapply the changes.
- The editor warns before leaving with unpublished changes. Changes are not auto-saved. Download a backup before refreshing or signing out if needed.
- Text fields are plain text, not HTML. Page bodies and detailed tour descriptions preserve line breaks. Hero motion/layout and page structure remain developer-owned.
- Existing menu labels are editable; menu destinations, form validation/messages and some structural labels are code-owned.
- Restore a published version by reverting its content commit in GitHub. Reverting a commit restores its published data after Vercel rebuilds.

## Validation

Run `npm run test:admin`, `npx tsc --noEmit`, and `npm run build`. Security and repository tests mock GitHub and never modify production. Perform the first live publish against the dedicated preview branch, then verify its Vercel deployment, before enabling production editing.

GitHub integration uses [Git database endpoints](https://docs.github.com/en/rest/git) and [non-forced reference updates](https://docs.github.com/en/rest/git/refs) to retain existing code and reject concurrent changes.
