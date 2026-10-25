# Put Learn X online

Your website files are built. The next step is to create accounts that you own, connect the files, and test the public website. No domain has been purchased and no hosting subscription has been created.

Current preference: review the interactive design demo first, then decide on hosting. The preferred domain is **learnx.ca**, with availability and registration still unverified. The working public contact is **saqib.bd.ca@gmail.com**.

For a public design demo first, use the prepared GitHub Pages files in `docs/`. Open the repository's **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/docs**, then save. Wait for GitHub to display a successful deployment and its public address. This demo does not accept real enrollment requests and does not require buying the preferred domain.

You do not need to buy a domain to test the website online. Start with the secure web address supplied by your hosting provider, then connect your chosen domain.

## 1. Choose hosting

The website currently stores course enquiries in a private database. The prepared [Render](https://render.com) setup uses paid hosting with a persistent disk, which keeps those enquiries when the website restarts or updates. Review the current monthly service and disk charges in your own account before approving them. Provider prices have not been verified here.

If you prefer to start with free hosting, tell me before creating a paid service. That route needs a different registration setup, such as a hosted form service; the current database cannot be preserved on a temporary free filesystem. A free static upload alone will not run the enrollment server.

## 2. Put the website files in GitHub

Your existing repository is [nazmus-saqib/PMCoursesByIbrahim](https://github.com/nazmus-saqib/PMCoursesByIbrahim). The built files are currently in this workspace, not yet in GitHub.

1. Download and extract `learn-x-website.zip` supplied in this chat.
2. Sign in to GitHub and open that repository.
3. Use the option to upload existing files. Upload the **contents** of the extracted `learn-x-website` folder, keeping `package.json` and `render.yaml` directly at the repository root.
4. Include `src`, `server`, `public`, the lockfile, and the other supplied source/configuration files. Include hidden configuration files if your file picker shows them. Do not upload `node_modules`, `dist`, `.env`, or registration data.
5. Save the upload as the first commit on `main`. Verify you can see `src/data/site.ts` and `public/images/workshop.webp` in GitHub.

You can also ask me to prepare and push the files using this workspace's Git connection. Passwords and GitHub tokens should never be pasted into chat.

## 3. Launch the prepared Render service

1. Create a Render account, or sign in using GitHub.
2. Connect the GitHub account that has access to the repository above. Grant access to this repository.
3. Choose **New → Blueprint**, then select the repository and its `main` branch.
4. Review the proposed `learn-x-training` web service and its 1 GB persistent disk. Confirm the charges in your own account only if they fit your budget.
5. Let Render build and start the website. Once deployment succeeds, open the HTTPS address supplied in the service dashboard. Do not share a localhost address.

The deployment recipe is already in `render.yaml`. It builds the website, starts the enrollment server, checks its health, and stores requests on the attached disk. The public deployment itself remains untested until you complete these account steps.

## 4. Choose and buy a domain

Use a registrar's live search, such as [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) or [Namecheap](https://www.namecheap.com/domains/), to check your preferred address. A name suggested in chat is not a reservation or proof of availability.

Start by checking **learnx.ca**, the owner's preferred address. Its availability is unverified. For a .ca domain, review the registrar's Canadian presence eligibility requirements before purchasing. If it is unavailable, compare a short Learn X variation or an address based on Ibrahim Hossain. Compare the ordinary renewal price as well as any first-year offer, and decide whether to enable automatic renewal.

Buy the domain in your own account so you control renewals and future changes. Keep account credentials private. Domain registration, website hosting, and email hosting are separate services and may have separate charges.

## 5. Connect the domain

In the Render service, open **Settings → Custom Domains**, add the domain you bought, and follow the exact DNS records Render displays. Enter those records in your domain provider's DNS settings. Values depend on the actual domain and service; do not copy an invented target from a tutorial.

Wait until the domain verifies and its HTTPS certificate is active. Confirm both the main address and any `www` address you intend to use load the correct website.

## 6. Set up a working contact address

The website currently uses **saqib.bd.ca@gmail.com**. Buying a domain does not automatically create an inbox. After owning learnx.ca, an address such as info@learnx.ca would also require email setup before publishing it.

After you own your final domain, choose an email provider if you want `info@your-domain`. Follow that provider's mailbox and DNS instructions, then test sending and receiving mail. Add the working address to `site.email` in `src/data/site.ts` and deploy the change.

The course form saves requests in the website database. It does not currently send an email notification. Use the private review process below until email notifications or an owner dashboard are added.

## 7. Test before announcing the website

- Add a working public contact address, and review your profile and course wording.
- Open the public website on your phone and a computer; test search, course details, and FAQs.
- Submit one clearly identified test enrollment with an email address you control. Save its request reference.
- In Render's private **Shell**, run `node server/export-registrations.mjs --out /tmp/learn-x-test-requests.csv`. The command uses Render's configured data directory. Verify the request is present and arrange a private way to review real requests regularly. Do not put exports in the public website or GitHub.
- Agree a regular process for replying to enquiries and backing up the registration database. Sending a request does not confirm a seat.
- Keep dates and fees marked as unannounced until you have confirmed them. Add real start/end dates and the teaching timezone when available.

Then share your public HTTPS address. The remaining account creation, purchases, DNS changes, and public deployment have not been performed by preparing this guide.
