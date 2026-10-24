const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const projectsStart = html.indexOf('<section id="projects"');
const beyondStart = html.indexOf('<section id="beyond"', projectsStart);
const projects = html.slice(projectsStart, beyondStart);

assert.ok(projects.includes('id="project-source-to-screen"'), 'Source-to-Screen appears in Projects');
assert.match(projects, /<h3>Source-to-Screen Workflow<\/h3>/, 'the project has the approved title');
assert.match(projects, /https:\/\/github\.com\/MythriP\/Source-to-Screen-Workflow/, 'the card links to its renamed repository');
assert.match(projects, /AI\/ML research/i, 'the project describes its research inputs');
assert.match(projects, /human review/i, 'the project explains the review step');
assert.doesNotMatch(projects, /Predictive Toxicology using GANs|project-toxicology/, 'the toxicology card is removed');

console.log('PASS: Source-to-Screen replaces toxicology in Projects and links to the renamed repository.');
