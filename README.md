# Learn X — professional training with Ibrahim Hossain

![Learn X website preview](docs/preview.png)

The interactive design demo is prepared for GitHub Pages. To activate it, open [Settings → Pages](https://github.com/nazmus-saqib/PMCoursesByIbrahim/settings/pages), select **Deploy from a branch**, choose **main** and **/docs**, then save. GitHub displays the live demo address when deployment succeeds. Until then, the image above shows the design.

A responsive portfolio and course website for Ibrahim Hossain, a PMP trainer with 10 years of experience. Visitors can explore Project Management, Agile, PRINCE2, and ITIL training, review learning outcomes, see published class dates, and send an enrollment request for personal follow-up. Requests are saved to a private SQLite database. Sending a request does not take payment, reserve a confirmed seat, or send an email automatically. The current contact address is saqib.bd.ca@gmail.com. The preferred domain is learnx.ca; availability, purchase, and connection remain pending.

The website has been prepared for development and deployment. It is not automatically published by creating these files.

For an account-by-account launch checklist, start with [LAUNCH.md](LAUNCH.md). Domain availability and current provider prices have not been verified; check them in the provider's own checkout before purchasing.

## Preview the design without hosting

The owner is reviewing the demo before choosing hosting. To regenerate a single-file interactive demo, run `npm run demo`. Open `artifacts/learn-x-demo.html` directly in a browser: it includes the image, fonts, and interactive course information, and requires no server or installation for the person viewing it. Its banner and registration form identify it as a design demo. Preview submissions are not stored or sent. `npm run build` and `npm start` remain the separate production workflow with real enrollment storage.

### GitHub Pages demo

Run `npm run demo:pages` to refresh the standalone demo in `docs/index.html`, then commit and push those files. In this repository's **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/docs**, and save. GitHub displays the live address after deployment succeeds. Pages availability depends on the repository's visibility and GitHub plan.

This publishes only a design demo. The enrollment form is explicitly disabled in this demo, and no paid hosting or custom domain is needed. The production enrollment server still requires the separate hosting setup below. Do not upload ordinary `dist/` to Pages: that build expects its server and different asset paths.

## Run the website

Install **Node.js 24** and run these commands from this repository's folder:

```sh
npm ci
npm run dev
```

The development command runs both the website and its registration server. Vite prints the local address to open in your browser. The registration server uses port 3001; Vite forwards `/api` requests to it.

For a production build and the checks:

```sh
npm test
npm run build
npm start
```

`npm start` serves the built website and API from the same server. The default port is 3001. On a host, use the port supplied by the host. `/api/health` is the server's health check.

If this cloud environment cannot write npm's default cache, use `npm ci --cache /tmp/ibrahim-npm-cache`.

`.env.example` documents optional settings. The default commands work without an `.env` file. If you create one locally, Node can load it explicitly: `node --env-file=.env --run dev`. Keep `.env` private.

## Make it yours

Most wording is in **`src/data/site.ts`**:

- Review `site.name`, `brand`, `bio`, public `email`, and your optional LinkedIn address. The supplied Learn X identity and working contact address are included. `site.preferredDomain` records learnx.ca as a preference only; it does not configure hosting or DNS. Change to a custom email only after its domain and mailbox work.
- Review course titles, descriptions, learning outcomes, format, and fees.
- Replace each course's empty `cohorts` list with your real class dates. Keep the course IDs unchanged unless you also update server validation.

For example, a cohort takes this shape; replace every example value with your own confirmed schedule:

```ts
cohorts: [
  {
    id: 'pm-your-cohort-name',
    label: 'Weekend class',
    startDate: '2027-02-06',
    endDate: '2027-03-06',
    timezone: 'Asia/Dhaka',
  },
],
```

Use ISO dates (`YYYY-MM-DD`) and an IANA timezone. Publish session times and duration in the course information as appropriate. The example dates above are not an advertised class.

The trainer identity, experience, PMP training background, contact address, and ITIL course name reflect details supplied by the owner. No accreditations, reviews, employer logos, or success statistics have been invented. Dates, fees, and teaching timezone remain unannounced until supplied. Confirm any certification or exam arrangements before advertising them. Any workshop illustration is not a photograph of the trainer or proof of a past class.

## Put it online with Render

This project includes `render.yaml`, a deployment recipe for [Render](https://render.com). The recipe uses a **paid web service and a 1 GB persistent disk**. Review the current hosting and disk prices in your account before approving them. A free or temporary filesystem would lose registration requests when the service is replaced, so it is not a suitable substitute for this setup.

1. Add your verified details and courses, then save the project to your GitHub repository. If you are using the GitHub website, use **Add file → Upload files**; upload the source files, not `node_modules`, `dist`, `data`, or `.env`. Preserve the folder structure. Alternatively, ask for help committing and pushing this project.
2. Sign in to Render and connect the GitHub repository. Choose **New → Blueprint** and select this repository.
3. Review the proposed web service, disk, and charges. Create the service only when you are ready to approve the hosting cost. The recipe installs dependencies, builds the site, and starts the server.
4. Wait for a successful deployment. Render supplies your public HTTPS address. Test a course and submit one test registration there before sharing it publicly.
5. To use a domain you own, open the service's **Settings → Custom Domains**, add the domain, and follow Render's DNS instructions at your domain provider. Wait for the HTTPS certificate to become active.

The database is stored in `/var/data` on the attached disk. Keep that disk attached during updates. For reliable preservation, arrange regular private backups and test restoring them. Do not run several independent app instances against separate local databases and expect them to share registrations. The recipe sets `TRUST_PROXY=1` for Render's reverse proxy so the request limiter can identify clients correctly; keep proxy trust disabled for direct local access.

Changing repository files does not by itself deploy the site until GitHub and hosting are connected. No hosting account, billing, domain purchase, or public deployment has been created by this project.

## Receive and manage requests

The form records requests in the server's database. There is no public administration page and no automatic email notification yet. Plan to review requests regularly and contact learners yourself. Do not promise automatic confirmation or payment collection.

From your computer or the host's private shell, export requests to a new private CSV file:

```sh
node server/export-registrations.mjs --out /tmp/enrollment-requests.csv
```

Run it with the same `DATA_DIR` as the website. Render already sets that variable to `/var/data`. The export command refuses to overwrite an existing file. Retrieve the file through your host's secure tools, store it somewhere private, and delete temporary copies when finished. Never place exports in `public`, `dist`, or another directory served by the website.

Registration data is personal information. Keep exports private, limit who can access hosting and backups, and agree on a retention period. Before publishing, review the privacy wording and contact details for your business and applicable requirements. Do not commit the database or exports to GitHub.

## Optional: Docker hosting

A Dockerfile is included for hosts that support containers and persistent storage:

```sh
docker build -t learn-x-training .
docker volume create learn-x-training-data
docker run --rm -p 3001:3001 \
  --mount source=learn-x-training-data,target=/app/data \
  learn-x-training
```

Keep the named volume for durable requests. Expose the service through your host's HTTPS setup before inviting public registrations. `PORT`, `HOST`, and `DATA_DIR` can be set by your hosting provider.
