// Run against a local server: PORTFOLIO_URL=http://127.0.0.1:8765 node tests/portfolio-smoke.cjs
// Requires Playwright; CHROME_PATH can select an installed browser.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:8765';
const failures = [];
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}) });
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    await page.addInitScript(() => {
      const translate = CanvasRenderingContext2D.prototype.translate;
      CanvasRenderingContext2D.prototype.translate = function(x,y) { if(this.canvas.id === 'game-canvas') window.gamePlayer = {x,y}; return translate.call(this,x,y); };
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
        if (this.canvas.id === 'portrait' && text === 'Dude, I just') window.portraitNote = {font:this.font,alpha:this.globalAlpha,x,y,width:this.canvas.getBoundingClientRect().width,height:this.canvas.getBoundingClientRect().height};
        if (this.canvas.id === 'portrait' && text === 'Dude, I just' && this.canvas.dataset.phase === 'forming') { window.sawFormation = true; if (this.globalAlpha !== 0) window.earlyNote = true; }
        return original.call(this, text, x, y, ...rest);
      };
    });
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if(response.url().startsWith(base) && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(base, {waitUntil:'networkidle'});
    await page.locator('#portrait').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.querySelector('#portrait').dataset.phase === 'ready');
    assert.equal(await page.title(),'Mythri Popuri');
    assert.equal(await page.evaluate(()=>window.sawFormation),true);
    assert.equal(await page.evaluate(()=>Boolean(window.earlyNote)),false);
    assert.equal(await page.evaluate(()=>window.portraitNote.alpha),0);
    assert.equal(await page.locator('#game-toggle').getAttribute('aria-checked'),'false');
    assert.equal(await page.locator('#game-canvas').isVisible(),false);
    assert.equal(await page.locator('[data-quest]:visible').count(),0);
    assert.equal(await page.locator('.experience').count(),7);
    for (const text of ['AI Engineer','LaunchX','University of California, Berkeley','Technical Associate - Developer Experience']) assert.ok(await page.getByText(text,{exact:true}).count(),text);
    assert.equal(await page.getByText('AI Support Engineer',{exact:true}).count(),0);
    assert.deepEqual(await page.locator('main > section').evaluateAll(items=>items.map(item=>item.id)), ['intro','about','skills','experience','projects','beyond','contact']);
    assert.equal(await page.locator('#projects article').count(), 6);
    assert.equal(await page.locator('.role-story, .portrait-coordinate, .side-label').count(), 0);
    assert.equal(await page.locator('.experience-tabs [role=tab]').count(), 7);
    for(const id of ['inrhythm','pinch','phylactics','launchx','unt','berkeley','cognizant']) {
      await page.locator(`#tab-work-${id}`).click();
      assert.equal(await page.locator('.experience:visible').count(),1);
      assert.equal(await page.locator(`#work-${id}`).isVisible(),true);
      await page.locator(`#work-${id} .experience-logo`).scrollIntoViewIfNeeded();
      await page.waitForFunction(key=>document.querySelector(`#work-${key} .experience-logo`).naturalWidth>0,id);
    }
    await page.locator('#tab-work-inrhythm').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-work-pinch').getAttribute('aria-selected'),'true');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#tab-work-cognizant').getAttribute('aria-selected'),'true');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#tab-work-inrhythm').getAttribute('aria-selected'),'true');
    await page.goto(base+'/#work-pinch',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#work-pinch').isVisible(),true);
    await page.goto(base,{waitUntil:'networkidle'});
    console.log('PASS: requested order, six projects, original logos, company tabs, keyboard navigation and direct links');

    const before = await page.locator('#portrait').evaluate(c=>c.toDataURL());
    const box = await page.locator('#portrait').boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.waitForFunction(snapshot=>document.querySelector('#portrait').toDataURL() !== snapshot,before);
    assert.equal(await page.locator('#portrait-secret, #portrait-discover').count(),0);
    const portraitLayout = await page.evaluate(() => {
      const canvas = document.querySelector('#portrait').getBoundingClientRect();
      const caption = document.querySelector('#portrait-hint');
      const cue = caption.getBoundingClientRect();
      return {
        captionPosition: getComputedStyle(caption).position,
        captionFontSize: getComputedStyle(caption).fontSize,
        captionBelowPortrait: cue.top >= canvas.bottom,
        selectionColor: getComputedStyle(document.body, '::selection').backgroundColor,
        selectionText: getComputedStyle(document.body, '::selection').color
      };
    });
    assert.equal(portraitLayout.captionPosition, 'absolute');
    assert.equal(portraitLayout.captionFontSize, '22px');
    assert.equal(portraitLayout.captionBelowPortrait, true);
    assert.equal(portraitLayout.selectionColor, 'rgb(51, 71, 99)');
    assert.equal(portraitLayout.selectionText, 'rgb(230, 241, 255)');
    assert.ok((await page.evaluate(()=>window.portraitNote.alpha)) < .1, 'The note must stay faint when hovering the center');
    await page.mouse.move(box.x+box.width*.28,box.y+box.height*.66);
    await page.waitForFunction(()=>window.portraitNote.alpha > .9);
    const note = await page.evaluate(()=>window.portraitNote);
    assert.equal(note.font,'8px monospace');
    assert.ok(note.x < note.width*.35 && note.y > note.height*.6);
    await page.mouse.move(0,0);
    await page.waitForFunction(()=>window.portraitNote.alpha < .1);
    await page.locator('#portrait').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.portraitNote.alpha > .9);
    await page.locator('#game-toggle').focus();
    await page.waitForFunction(()=>window.portraitNote.alpha < .1);
    assert.equal(await page.locator('#work-pinch .experience-logo').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
    assert.equal(await page.locator('#work-phylactics .experience-logo-frame').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
    assert.match(await page.locator('#work-pinch .experience-demo').getAttribute('href'),/7427003529220861954/);
    assert.deepEqual(await page.locator('#projects article').evaluateAll(items=>items.map(item=>item.id)),['project-wezaap','project-toxicology','project-analytics','project-covid','project-security','project-sign-language']);
    assert.equal(await page.locator('#skills').getByText(/Mutation testing/).count(),0);
    assert.ok(await page.locator('#skills').getByText(/API integration/).count());
    assert.ok(await page.locator('#skills').getByText('RAG · LangChain · LangGraph · LLM evaluation · MCP · PyTorch',{exact:true}).count());
    console.log('PASS: tiny southwest canvas note, localized gradual discovery, keyboard discovery, black logos, demo link, project order and skills');
    console.log('PASS: portrait renders and responds to the pointer');
    const brokenAnchors = await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id)));
    assert.deepEqual(brokenAnchors,[]);

    for (const width of [320,390,768,1024,1440]) {
      await page.setViewportSize({width,height:844});
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,`Horizontal overflow at ${width}`);
      assert.equal(await page.locator('#portrait-hint').evaluate(e=>getComputedStyle(e).position),'absolute');
      assert.equal(await page.locator('#portrait-hint').evaluate(e=>e.getBoundingClientRect().top >= document.querySelector('#portrait').getBoundingClientRect().bottom),true,`Portrait hint should sit below the dots at ${width}px`);
    }
    console.log('PASS: no horizontal overflow at 320, 390, 768, 1024, 1440px');

    await page.setViewportSize({width:927,height:668});
    await page.locator('#game-toggle').click();
    assert.equal(await page.locator('#game-toggle').getAttribute('aria-checked'),'true');
    assert.equal(await page.locator('#game-canvas').isVisible(),true);
    assert.equal(await page.evaluate(()=>scrollY),0);
    assert.equal(await page.locator('#game-next').count(),0);
    const startPlayer=await page.evaluate(()=>window.gamePlayer);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(230);
    assert.ok((await page.evaluate(()=>window.gamePlayer.y))<startPlayer.y-100,'Tab makes a high jump');
    await page.waitForTimeout(1450);
    // Scrolling is camera movement only: the grounded cat stays on the same ledge.
    const grounded = await page.evaluate(()=>({...window.gamePlayer,scroll:scrollY}));
    for(const top of [200,900,0]) {
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top);
      await page.waitForTimeout(200);
      const moved = await page.evaluate(()=>({...window.gamePlayer,scroll:scrollY}));
      assert.ok(Math.abs((moved.y+moved.scroll)-(grounded.y+grounded.scroll))<=1,'Scrolling must not change the cat’s document position');
      assert.equal(moved.x,grounded.x);
    }
    await page.locator('#game-restart').click();
    assert.equal(await page.locator('#game-progress').innerText(),'0 / 5 sparks');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#game-pause').innerText(),'Resume');
    const pausedPlayer = await page.evaluate(()=>window.gamePlayer);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    assert.deepEqual(await page.evaluate(()=>window.gamePlayer),pausedPlayer);
    await page.locator('#game-pause').click();
    await page.setViewportSize({width:390,height:844});
    const touchStart=await page.evaluate(()=>window.gamePlayer);
    const right=page.locator('[data-move=right]');
    const rightBox=await right.boundingBox();
    await page.mouse.move(rightBox.x+rightBox.width/2,rightBox.y+rightBox.height/2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.up();
    assert.ok((await page.evaluate(()=>window.gamePlayer.x))>touchStart.x);
    await page.locator('#game-restart').click();
    assert.equal(await page.locator('#game-progress').innerText(),'0 / 5 sparks');
    await page.locator('#game-close').click();
    assert.equal(await page.locator('#game-canvas').isVisible(),false);
    await page.locator('#game-toggle').click();
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('#game-toggle').getAttribute('aria-checked'),'false');
    console.log('PASS: scroll anchoring in both directions, no Next, high Tab jump, pause, pointer input, restart, close and default-off reload');

    await page.locator('.daily-nav').click();
    await page.waitForURL('**/DailyMy3.html');
    assert.ok(await page.getByText('Probably Uncool, Definitely Me',{exact:true}).isVisible());
    const images=await page.evaluate(()=>[...document.images].filter(img=>!img.complete||!img.naturalWidth).map(img=>img.getAttribute('src')));
    assert.deepEqual(images,[],'DailyMy3 images');
    await page.locator('.back-to-my3').click();
    await page.waitForURL('**/index.html');
    console.log('PASS: DailyMy3 round trip and all original images load');

    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(base,{waitUntil:'networkidle'});
    await page.locator('#portrait').waitFor({state:'visible'});
    const reducedBefore = await page.locator('#portrait').evaluate(c=>c.toDataURL());
    const reducedBox=await page.locator('#portrait').boundingBox();
    await page.mouse.move(reducedBox.x+reducedBox.width/2,reducedBox.y+reducedBox.height/2);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#portrait').evaluate(c=>c.toDataURL()),reducedBefore);
    console.log('PASS: reduced-motion portrait remains still');

    const noJs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await noJs.goto(base);
    assert.equal(await noJs.locator('#portrait-fallback').isVisible(),true);
    assert.equal(await noJs.locator('#game-toggle').isVisible(),false);
    assert.equal(await noJs.locator('.experience:visible').count(),7);
    assert.ok(await noJs.getByText(/50\+ interns/).isVisible());
    console.log('PASS: portrait fallback, all seven roles work without JavaScript');
    await noJs.close();
    assert.deepEqual(failures,[],'Browser errors / local asset errors');
    console.log('PASS: no browser exceptions or failed local resources');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
