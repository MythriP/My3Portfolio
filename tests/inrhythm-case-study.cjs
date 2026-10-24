const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const featureStart = html.indexOf('<article class="framework-feature"');
const featureEnd = html.indexOf('</article>', featureStart) + '</article>'.length;
assert.notEqual(featureStart, -1, 'InRhythm framework feature exists');
const feature = html.slice(featureStart, featureEnd);
assert.doesNotMatch(feature, /Read the case study|Read the workflow/,
  'the old disclosure is removed from the workflow feature');

console.log('PASS: Enterprise agentic framework has no case-study disclosure.');
