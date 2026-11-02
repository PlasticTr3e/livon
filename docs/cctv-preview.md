# CCTV frontend preview

Route: `/cctv`. Navigation follows Community in the app and admin top navigation.

The camera list in `src/lib/cctv/cameras.ts` contains sample locations. Three cards intentionally share one recorded clip; one demonstrates the offline state. No live feed or backend integration is implemented. Replace the list with actual browser-playable sources when those become available.

The search toolbar filters camera names without case sensitivity and combines with RW and RT selections. RT options come from the selected RW (or all cameras when no RW is selected); changing RW resets the RT selection. Sample RT/RW identifiers are displayed on cards and in the player. Clear search, clear all filters, no-match feedback, and filtered result counts are included.

## Design decisions

- Reading this as a neighborhood camera viewer for residents, using LIVON's existing visual theme. Energy 1 / rhythm 1 / motion 1.
- Green highlights identify viewing actions and match existing navigation; slate backgrounds and the inherited font keep it consistent with Community.
- A responsive two-column grid gives each camera a readable 16:9 preview; phones show one column.
- Static thumbnails avoid downloading and playing several video streams at once. Only the selected camera mounts a player.
- Search and region filters replace the preview banner, keeping the most common lookup actions directly above the grid. Visible labels and native selects support keyboard and mobile input; the search field spans both columns on phones.
- A centered dialog gives a larger view while preserving page context; fullscreen is a separate user action. Radix handles focus trapping, Escape, and focus restoration.
- Small fade/zoom transitions explain the enlargement and respect reduced motion. Shadows are limited to existing card elevation and the dialog.
- Demo and offline labels communicate actual preview states. No fabricated live indicators or timestamps are shown.
- Navigation keeps text labels on large screens and uses named, titled icons on medium screens so the extra tab does not crowd the header.

## Verification

- TypeScript (`tsc --noEmit`) and targeted ESLint passed.
- `/cctv` returned 200; the thumbnail returned 200; the MP4 returned 206 for a byte-range request.
- DOM interaction checks in `tmp/cctv-verification/check.cjs` passed for all three playable cards, offline and empty states, opening and closing, loading and retry, Escape, and focus restoration. Fullscreen requests and media events were mocked in this test.
- Search checks passed for case and whitespace handling, combined name/RT/RW matching, no matches, clearing search and all filters, RT reset on RW change, offline search results, and opening a filtered result.
- No connected browser was available for visual inspection or real browser fullscreen/playback testing. Responsive breakpoints and theme classes are implemented, but viewport screenshots have not been verified.

## Media credit

`public/cctv/traffic-demo.mp4`: “Aerial View of Traffic in City” by Visual Standard Media, via [Pexels](https://www.pexels.com/video/aerial-view-of-traffic-in-city-11331398/), under the [Pexels License](https://www.pexels.com/license/). Uses Pexels' 720p encode (approximately 3.8 MB); footage content unchanged. `traffic-preview.jpg` is Pexels' resized preview frame of that footage.
