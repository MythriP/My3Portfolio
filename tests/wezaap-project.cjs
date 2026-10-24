const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<article class="project-card project-lilac" id="project-wezaap">');
const end = html.indexOf('</article>', start) + '</article>'.length;
const card = html.slice(start, end);

assert.ok(card.includes('assets/images/wezaap-hackathon.jpg'), 'WeZaap uses the supplied hackathon photo');
assert.match(card, /Hackathon winner/i, 'the subline calls out the hackathon win');
assert.match(card, /multimodal|voice.and.video/i, 'the description explains the project');
assert.match(card, /https:\/\/github\.com\/MythriP\/WeZaapCur/, 'the card links to the source repository');
assert.match(card, /https:\/\/we-zaap-cur\.vercel\.app\/login/, 'the card links to the live application');
assert.doesNotMatch(card, /UNT hackathon winner/i, 'the tagline does not name UNT');

console.log('PASS: WeZaap highlights the hackathon win, project, photo, repository, and live app.');
