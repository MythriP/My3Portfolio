const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const markdown = fs.readFileSync('assets/case-studies/continuum-case-study.md', 'utf8');
const highlightStart = html.indexOf('<section id="featured"');
const projectStart = html.indexOf('<section id="projects"', highlightStart);
const projectEnd = html.indexOf('<section id="beyond"', projectStart);
assert.notEqual(highlightStart, -1, 'highlights section exists');
assert.notEqual(projectStart, -1, 'projects section exists');
const highlights = html.slice(highlightStart, projectStart);
const projects = html.slice(projectStart, projectEnd);
const frameworkStart = highlights.indexOf('<article class="framework-feature"');
const continuumHighlightStart = highlights.indexOf('<div class="agent-projects highlight-agent-projects"');
const frameworkFeature = highlights.slice(frameworkStart, continuumHighlightStart);
const modalStart = html.indexOf('<dialog id="case-continuum"');
const modalEnd = html.indexOf('</dialog>', modalStart);
assert.notEqual(modalStart, -1, 'Continuum case study dialog exists');
const caseStudy = html.slice(modalStart, modalEnd);

assert.doesNotMatch(frameworkFeature, /Read the case study|Read the workflow/,
  'the InRhythm framework no longer exposes a case-study disclosure');
for (const projectName of ['Persistent Agent Memory', 'Rufus Office']) {
  assert.ok(projects.includes(projectName), `${projectName} is listed in Projects`);
  assert.doesNotMatch(highlights, new RegExp(projectName), `${projectName} is removed from Highlights`);
}
const frameworkPosition = highlights.indexOf('<article class="framework-feature"');
const continuumPosition = highlights.indexOf('id="agent-card-1"');
const pinchPosition = highlights.indexOf('id="featured-pinch"');
assert.ok(frameworkPosition < continuumPosition && continuumPosition < pinchPosition,
  'Continuum appears second in Highlights, after the framework and before Pinch');
assert.match(highlights, /INDEPENDENT WORK/, 'Continuum is labeled as independent work');
assert.doesNotMatch(projects, /Continuum/, 'Continuum is removed from Projects');
assert.match(projects, /Persistent Agent Memory/, 'Persistent Agent Memory remains in Projects');
assert.match(projects, /Rufus Office/, 'Rufus Office remains in Projects');
for (const [metric, description] of [
  ['&lt;1%', 'materially incorrect recommendations'],
  ['0', 'duplicate or unauthorized actions'],
  ['95%', 'accepted without substantive analyst correction'],
]) {
  assert.ok(caseStudy.includes(metric) && caseStudy.includes(description), `case study includes ${metric} ${description}`);
}
assert.match(caseStudy, /target/i, 'the requested future-facing percentages are labeled as targets');
assert.match(caseStudy, /Google Cloud/ , 'case study keeps the Google Cloud architecture context');
for (const obsolete of ['83% → 0%', 'not yet built', 'not deployed', 'video has no sound']) {
  assert.ok(!html.includes(obsolete), `portfolio omits obsolete phrase: ${obsolete}`);
  assert.ok(!markdown.includes(obsolete), `downloadable case study omits obsolete phrase: ${obsolete}`);
}
assert.match(highlights, /href="https:\/\/github\.com\/MythriP\/continuum"[^>]*>Explore Continuum on GitHub/i, 'Continuum exposes the public repository from its highlight card');
assert.doesNotMatch(caseStudy, /github\.com\/MythriP\/continuum/i, 'the public repository link stays outside the case study');
assert.match(markdown, /Production success targets/i, 'downloadable case study explains the target metrics');
assert.match(markdown, /github\.com\/MythriP\/continuum/i, 'downloadable case study links to the public repository');

console.log('PASS: Continuum targets, project placement, deployment wording, and public repository link are consistent.');
