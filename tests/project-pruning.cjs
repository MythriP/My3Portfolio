const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const projectsStart = html.indexOf('<section id="projects"');
const projectsEnd = html.indexOf('<section id="beyond"', projectsStart);
const projects = html.slice(projectsStart, projectsEnd);
for (const id of ['project-analytics', 'project-covid', 'project-security', 'project-sign-language']) {
  assert.ok(!projects.includes(`id="${id}"`), `${id} is removed from Projects`);
}

const continuumStart = html.indexOf('<article class="agent-card agent-card--case"');
const continuumEnd = html.indexOf('</article>', continuumStart);
const continuumCard = html.slice(continuumStart, continuumEnd);
assert.match(continuumCard, /https:\/\/github\.com\/MythriP\/continuum/, 'Continuum GitHub link is on the highlight card');
assert.match(continuumCard, /Explore Continuum on GitHub/i, 'the repository link has a clear label');
const modalStart = html.indexOf('<dialog id="case-continuum"');
const modalEnd = html.indexOf('</dialog>', modalStart);
const caseStudy = html.slice(modalStart, modalEnd);
assert.doesNotMatch(caseStudy, /github\.com\/MythriP\/continuum/i, 'the repository link is not inside the case study');

console.log('PASS: requested project cards are removed and Continuum GitHub is on its highlight card.');
