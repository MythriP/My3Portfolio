# My3Portfolio redesign

Local static-site refresh, October 4, 2026. No build system or deployment change.

## Design and scope
Navy and mint drawn from the supplied Gazi-V2 reference, with My3's existing DM Sans, Space Grotesk, and handwritten Caveat fonts. Larger body text, bolder headings, and matching My/3 logo sizes. The portrait uses Mythri's existing photograph to render interactive dots, using sparse, muted mint dots with softened edges. It suggests the portrait without rendering a full-color face. A tiny, three-line southwest note gradually becomes readable when nearby dots move; Enter/Space provides keyboard discovery.

Direct reading is the default. Optional game mode is a continuous document-space playground starting just above “Hello humans.” A seeded random trail of reachable ledges varies across restarts, with a turn back near Explore my work and an About me waypoint, with five persistent sparks near the introduction, skills, experience, projects, and human-side sections. There are no rounds or Next buttons. The cat stays attached to its current ledge as scrolling moves both together on screen; scrolling never changes its document position or grounding. Ledges are nudged between text lines to avoid crossing the copy.

Arrow keys/A/D move; Tab, Space, Up, or W jump about 276 CSS pixels; Down/S drops through a ledge. Game keys are scoped to the focused canvas. Escape pauses and focuses Resume; Shift+Tab leaves the game normally. Touch controls, local fall recovery, restart, progress retention across layout changes, and default-off reload are supported. Reduced motion disables decorative game animation and portrait movement.

DailyMy3 remains a separate page with its original writing and artwork. Only metadata, relative asset URLs, and a portfolio return link changed.

## Content sources and decisions
Existing index.html supplies titles, dates, project links, contact details, and credentials. Rufus/Mythri_Career_Context_Concise.md supplies accomplishment context and metrics. User requested AI Engineer at InRhythm and separate LaunchX and University of California, Berkeley entries retaining existing titles. That instruction overrides Rufus's consolidation guidance. Berkeley's existing 2024 date and bullets remain; ranking metrics are not duplicated under both roles.

Order: About me, Skills, Experience, Projects, human side. Seven company tabs retain the original logos/photos, keyboard navigation, and direct role links. Pinch has the user-supplied LinkedIn Python SDK demo link. Pinch and Phylactics have black logo backgrounds; Phylactics is enlarged inside its frame.

Six projects: WeZaap! and Predictive Toxicology using GANs are featured cards. “More data. More possibility.” is toxicology's subtitle. Academic Performance Analytics, COVID-19 Image Classification, Cryptographic File Security, and Sign Language Recognition are compact entries 3–6 with their original images.

AI skills: RAG, LangChain, LangGraph, LLM evaluation, MCP, PyTorch. API integration is in Applications & APIs; mutation testing is removed. Opening availability reads “Open to opportunities.” Human-side heading is “Outside the code.” Closing heading is “Have something in mind? Let’s make it happen.”

## Files
- index.html: semantic portfolio content, available without JavaScript.
- assets/css/portfolio.css: base layout, responsive and print styles.
- assets/css/theme.css: navy/mint theme, type sizing, game overlay layout.
- assets/js/portfolio.js: portrait, company tabs, navigation, print behavior.
- assets/js/platform-game.js: game rendering, controls, continuous document-space exploration, testable physics.
- DailyMy3.html: original writing and artwork with relative image URLs and a home link.

## Local preview
Run `python3 -m http.server 8765 --bind 127.0.0.1` from the project root and open http://127.0.0.1:8765/?v=9.

## Verification
`tests/portfolio-smoke.cjs` passes using local Chrome and Playwright. Set CHROME_PATH for an installed Chrome and PORTFOLIO_URL for a different server address. It checks:
- Responsive widths 320, 390, 768, 1024, 1440px without horizontal overflow.
- All seven company tabs, keyboard arrows/Home/End, original images, direct links.
- Localized portrait discovery, gradual fade, keyboard discovery, reduced motion.
- Requested skills, project order, black logo backgrounds, Pinch demo link.
- Scroll anchoring in both directions; higher Tab jump, pause/resume, pointer controls, resize retaining progress, restart, closing, default-off reload.
- DailyMy3 round trip and loaded images; JavaScript-disabled portrait and all seven roles.
- No browser exceptions or failed local resources.

`node tests/platform-physics.cjs` checks every consecutive ledge in a continuous route at widths 1440, 927, 390, and 320, plus all five sparks, scroll invariance, 400 randomized route gap checks, higher jumps, fall recovery, and prevention of repeated midair jumps.

Additional browser checks confirmed two full cards/four compact rows, equal My/3 font sizes, no wordmark star, and compact game controls on phones. Desktop/full-page and mobile screenshots were visually inspected. `git diff --check` passes. Original DailyMy3 headings/paragraphs were checked against Git verbatim during the redesign.

Portrait refinement: scattered dots assemble over approximately 2.25 seconds on reload, with reduced-motion bypass. Local facial contrast brings out eyes, nose, and mouth without adding color. The hidden note has zero opacity until assembly finishes and the visitor deliberately explores it. Browser title is “Mythri Popuri”; the favicon is 🙃. Entrance, reload, timing, and reduced-motion checks passed.

## Featured workflow (October 2026)

Added one Featured case study between Skills and Experience. `featured.css` and
`featured.js` are scoped to the new section; DailyMy3 remains unchanged. The
illustrative refund specification animates through planning, scoped agents,
independent review, repair, and a human handoff. This is a local animation, not a
live agent execution or a client recording. Contribution copy is grounded in
`Mythri_Career_Context_Concise.md`; no new outcome metrics are asserted.

Playback begins when the demo enters the viewport, pauses offscreen or in a
background tab, and ends after one pass. Pause and Replay controls are available.
Reduced-motion visitors receive a still view; an HTML workflow transcript is
available without JavaScript. The timeline regression check is
`node tests/featured-timeline.cjs`.

### Terminal revision

Replaced the editor cards with a continuous terminal session. Every command is
typed, followed by an Enter cue and staggered output. Commands use yellow,
failures red, and successful checks green. The diagram follows specification,
planning, orchestration, build/test agents, a failing retry test, repair, passing
tests, and an independently spawned reviewer. The final state awaits human
review; it never claims an actual release or approval. The 10-stage sequence is
deterministic and testable in `featured-sequence.js`.

### Source-grounded orchestration revision

Read the supplied `workbench-main (2).zip` without executing its contents.
`lib/cmd/run.sh` spawns developer agents for ready tasks (with dependency/file
conflict checks), invokes `gates_run` after completion, and invokes a debugger
on failed quality gates. `lib/shared.sh` feeds diagnosis into recovery;
`lib/cmd/review.sh` implements a separate review command. Test execution is a
quality gate, not a dedicated test-agent role. The animation now reflects these
distinctions, including separate developer sub-agents for example tasks and a
failure-triggered debugger.

Only the initial request is typed/submitted. Subsequent short labels are
automatically played orchestration activities, not literal shell commands.
The sequence compresses planning, execution, retry, and review into an
illustrative session; the repository does not establish that one initial
prompt automatically invokes every separate command. The example and outcome
remain fictional and labeled as an illustration. No ZIP content is published.
