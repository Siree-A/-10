# Research 10 website

Static HTML, CSS and JavaScript. There is no production build step.
Serve the folder over HTTP; the Portfolio directory loads researchers.json with fetch.

## Preview

Run from this folder:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ or /portfolio.html.

## Researcher directory

- researchers.json maps stable member codes to names, original image files and verified Google Drive folder URLs.
- Advanced: A01–A30, 30 members across 6 groups.
- Basic: B01–B50 excluding B08 and B11, 48 members across 10 groups.
- B08 and B11 were explicitly excluded by the project owner because these places have no students. Do not reuse the old 8.jpg / 11.jpg overrides: they show B09 and B13.
- Names and group membership come from the existing revised attendance PDF. Member codes, not display names, identify memberships.
- drive-folders.json records the existing parent, two course folders and 16 group folders. Each group contains its individual member folders.
- No sharing permissions were changed. New folders inherit the supplied parent folder's access.
- assets/portraits contains optimized WebP display copies and small previews; all original photos remain unchanged.
- To replace a photo, update the original and regenerate the corresponding code.webp and code-thumb.webp.

## Navigation and motion

Portfolio routes use URL fragments, so deep links and browser Back/Forward work on GitHub Pages:

- portfolio.html
- portfolio.html#Advanced
- portfolio.html#Basic/2

Search is scoped to the current level/group; the landing view searches all 78 members.
External member links use real anchors, open in a new tab, and use noopener/noreferrer.
Directory load failures show a retry action and the root Drive link.
CSS 3D uses transform-based motion. Animations pause when the scene is offscreen or the tab is hidden.
Reduced-motion users receive a static scene; others can pause motion explicitly.
Pointer tilt is only enabled on devices with a fine pointer and hover.

## Browser checks

Install Playwright in your development environment, with its Chromium browser, then start the preview server.
Run:

```sh
node scripts/verify.cjs
```

The script resolves the installed playwright package. If it is installed outside the project,
set PLAYWRIGHT_MODULE to its absolute module directory.
Screenshots go to the ignored test-results directory.

Checks cover 78 unique links, all 16 groups, original/optimized images, omitted codes,
search and empty states, route history, invalid routes, network failure/retry,
mobile navigation, viewport overflow, reduced motion, the video anchor and JavaScript errors.
Drive folders were separately read back through Google Drive and matched by ID, name and containing group.

## Landing page faculty gallery

- The supplied chair image and course banner are stored in assets/faculty/originals with optimized WebP copies next to them.
- The 26 supplied Google Drive images plus 6 later local Advisor Advanced images appear directly on the landing page. The second supplied Drive folder duplicates a subset of the first; duplicate source copies are not displayed twice.
- faculty.json records each source URL, original filename, display image and verified category/group.
- Categorization follows the text printed on the supplied images. The seven files named Advisor(Advence) actually show Co-Advisor Basic, groups 5, 4, 3, 2, 9, 8 and 7. Do not infer roles from those filenames.
- The supplied image set contains Advisor Basic (10 images), Advisor Advanced (6 images), Co-Advisor Basic (10 images), and Co-Advisor Advanced (6 images).
- The gallery shows 3 images on desktop, 2 on tablets, and 1 on phones, with manual category/page controls. Images do not auto-advance.
- Clicking an image opens a native modal with keyboard previous/next, Escape dismissal and focus restoration. Links to full originals still work without JavaScript.
- The RX and partner-logo display assets trim only transparent margins from existing originals; the original logos are preserved.
- Run node scripts/verify-faculty.cjs against the same preview server to verify all 32 images, category counts, pagination, modal controls and widths from 320 to 1440px.

## Publication status

The existing GitHub Pages workflow deploys on pushes to main.
Local changes do not update the public site until they are committed and pushed through the chosen review/release process.

The six local Advisor Advanced attachments are stored under advisor-advanced-1 through advisor-advanced-6 by the group printed on the image (source filename order is reversed). Earlier advanced-* files show Co-Advisor Basic and remain separate. The orbit-edition stylesheet restores the visible Rx sphere, orbit rings and compact chair card, with rounded luminous logo frames.
