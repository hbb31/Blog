# Publishing

This site goes from **edit in the CMS → preview of the full site → merge → live**. Nothing reaches the public site until you merge into `main`.

```
Keystatic (/keystatic)  ──save──▶  cms-* branch on GitHub  ──PR──▶  Netlify Deploy Preview
                                                                     (drafts visible, noindex)
                                         merge PR into main  ──▶  Netlify production deploy
```

- **Why Netlify:** it builds a preview for every pull request (and optionally every branch), runs Keystatic's two server routes as a Function via `@astrojs/netlify`, and handles the contact form natively with Netlify Forms, so there's no extra form service. Vercel has comparable previews but no built-in forms; Cloudflare Pages would also work but needs a different adapter and a form service.

---

## Part 1: One-time setup

### 1. Push the repo to GitHub

The repo is `hbb31/Blog`. If you use a different repo, change `PUBLIC_KEYSTATIC_GITHUB_REPO`.

### 2. Protect `main`

GitHub → **Settings → Branches → Add branch ruleset** for `main`:

- Require a pull request before merging
- Require status checks to pass: select the **CI** workflow job ("Lint, type check, build, test")

This stops the CMS (or anyone) from writing to `main` directly, so merging a PR is always the "publish" step.

### 3. Create the Netlify site

1. Netlify → **Add new project → Import an existing project → GitHub** → pick the repo. Netlify reads build settings from `netlify.toml` (`npm run build`, publish `dist`).
2. **Project configuration → Build & deploy → Branches and deploy contexts**:
   - Production branch: `main`
   - Deploy Previews: **Any pull request against your production branch**
   - Branch deploys: **All** (gives every `cms-*` branch its own URL even before you open a PR). Optional but recommended.
3. **Forms → Enable form detection.** Netlify only collects contact-form submissions after this is on. Then trigger a redeploy. Set up email notifications under **Forms → Form notifications**.
4. Note your site name (`<name>.netlify.app`), and add a custom domain if you have one.

### 4. Set the production URL

In the CMS (or `src/content/singletons/settings.json`), set **Site settings → Site URL** to your real domain, e.g. `https://example.com`. It is used for canonical links, RSS, the sitemap and social images.

### 5. Connect Keystatic to GitHub (GitHub App)

Keystatic creates the GitHub App for you:

1. Locally, create `.env` from `.env.example` and set:
   ```
   PUBLIC_KEYSTATIC_STORAGE=github
   PUBLIC_KEYSTATIC_GITHUB_REPO=hbb31/Blog
   ```
2. Run `npm run dev` and open http://127.0.0.1:4321/keystatic.
3. Keystatic shows a setup screen. Enter your **deployed URL** (e.g. `https://<name>.netlify.app` or your domain) and, optionally, a GitHub organization. Click **Create GitHub App**.
4. On GitHub, confirm creating the app, then **install it on the `Blog` repository only**.
5. You're redirected back, and Keystatic writes these to your local `.env`:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
   - `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`

   The app asks for: contents write, metadata read, pull requests read. Its OAuth callback is `<site>/api/keystatic/github/oauth/callback`. If you later change domain, add the new callback URL in the GitHub App settings.

### 6. Add environment variables in Netlify

Netlify → **Project configuration → Environment variables**. Add, for all deploy contexts:

| Variable                           | Value                                               |
| ---------------------------------- | --------------------------------------------------- |
| `PUBLIC_KEYSTATIC_STORAGE`         | `github`                                            |
| `PUBLIC_KEYSTATIC_GITHUB_REPO`     | `hbb31/Blog`                                        |
| `PUBLIC_NETLIFY_SITE_NAME`         | your site name (enables Preview buttons in the CMS) |
| `KEYSTATIC_GITHUB_CLIENT_ID`       | from `.env` (mark as secret)                        |
| `KEYSTATIC_GITHUB_CLIENT_SECRET`   | from `.env` (mark as secret)                        |
| `KEYSTATIC_SECRET`                 | from `.env` (mark as secret)                        |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | from `.env`                                         |

`SHOW_DRAFTS` is already set per context in `netlify.toml`: true for previews, false for production. Redeploy after adding the variables. Never commit `.env`.

To keep editing locally against files on disk, set `PUBLIC_KEYSTATIC_STORAGE=local` in your `.env` again (or remove it).

### 7. Check it works

- `https://<your-site>/keystatic` → **Log in with GitHub** → you see Posts, Pages, Categories, Author, Site settings.
- Open a PR and check that Netlify posts a Deploy Preview link, and that the preview's `/robots.txt` says `Disallow: /`.

---

## Part 2: How I publish a post

1. **Open the CMS**: go to `https://<your-site>/keystatic` and log in with GitHub.
2. **Start a branch**: click the branch picker (top left) → **New branch**, e.g. `cms-quiet-tools`. Every edit you save goes to this branch, not to the live site.
3. **Write**: **Posts → Add**. Fill in title, excerpt (max 200 characters), at least one **category**, tags, cover image and its **alt text**. Leave **Status: Draft** while you work. Click **Create**, then **Save** as you go.
   - Pull quotes and callouts: use the **+** menu in the editor.
   - Image captions: the image's title becomes the caption.
   - Footnotes: type `[^1]` where the marker goes, and add a paragraph `[^1]: Your note.` at the end.
4. **Preview**: within a couple of minutes Netlify builds the branch. Click **Preview** in the CMS (when `PUBLIC_NETLIFY_SITE_NAME` is set), or open `https://cms-quiet-tools--<name>.netlify.app/blog/<slug>/`. Previews show drafts with a "Draft" badge and are hidden from search engines.
5. **Ready to publish?** Set **Status: Published**, check the date, and save.
6. **Open a pull request**: in the CMS branch menu choose **Create pull request** (or open it on GitHub). Netlify adds a Deploy Preview link to the PR. Check the whole site there: home page, category pages, search.
7. **Confirm = merge**: once the CI check is green, merge the PR on GitHub. Netlify deploys `main` to production, usually within 1–3 minutes.
8. **Undo**: revert the merge commit on GitHub, or roll back to the previous deploy in Netlify (**Deploys → … → Publish deploy**).

Pages, categories, the author profile and site settings work exactly the same way: edit on a branch, preview, merge.
