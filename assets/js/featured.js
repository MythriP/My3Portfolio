/* Plays an illustrative terminal session; no commands are executed. */
(() => {
  'use strict';
  const demo=document.querySelector('.framework-demo');
  const sequence=window.My3FeaturedSequence;
  if(!demo||!sequence)return;
  const {stages,duration,frameAt}=sequence;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const history=demo.querySelector('.terminal-history');
  const viewport=demo.querySelector('.terminal-viewport');
  const pause=demo.querySelector('[data-demo-pause]');
  const replay=demo.querySelector('[data-demo-replay]');
  const title=demo.querySelector('[data-scene-title]');
  const description=demo.querySelector('[data-scene-description]');
  const number=demo.querySelector('[data-scene-number]');
  const status=demo.querySelector('[data-terminal-status]');
  const counter=demo.querySelector('[data-terminal-counter]');
  const nodes=[...demo.querySelectorAll('[data-node]')];
  const wires=[...demo.querySelectorAll('[data-wire]')];
  const symbols={waiting:'○',running:'◌',passed:'✓',failed:'✗',spawned:'+'};
  const entries=stages.map(stage=>{
    const root=document.createElement('div');root.className='terminal-entry';root.classList.toggle('is-automatic',stage.automatic);root.hidden=true;
    const command=document.createElement('p');command.className='terminal-command';
    const text=document.createElement('span');command.append(text);
    const enter=document.createElement('span');enter.className='terminal-enter';enter.textContent='↵ enter';enter.hidden=true;command.append(enter);
    if(stage.command)root.append(command);
    const outputs=stage.outputs.map(output=>{const p=document.createElement('p');p.className=`terminal-output ${output.tone}`;p.textContent=output.text;p.hidden=true;root.append(p);return p;});
    return {root,command,text,enter,outputs};
  });
  history.replaceChildren(...entries.map(entry=>entry.root));
  let elapsed=0,previous=null,raf=null,visible=false,paused=false,lastStage=-1,lastSignature='';
  function render() {
    const frame=frameAt(elapsed),stage=stages[frame.index];
    if(lastStage!==frame.index){
      title.textContent=stage.title;description.textContent=stage.description;
      number.textContent=`${String(frame.index+1).padStart(2,'0')} / ${stages.length}`;
      demo.dataset.scene=String(frame.index);lastStage=frame.index;
    }
    demo.dataset.phase=frame.phase;
    entries.forEach((entry,i)=>{
      const local=elapsed-stages[i].start;
      entry.root.hidden=i>frame.index;
      if(i>frame.index)return;
      const typed=i<frame.index?stages[i].command.length:frame.typed;
      const value=stages[i].command.slice(0,typed);
      if(entry.text.textContent!==value)entry.text.textContent=value;
      entry.enter.hidden=stages[i].automatic||local<stages[i].typing||local>stages[i].submit+500;
      entry.root.classList.toggle('is-typing',i===frame.index&&!frame.submitted);
      entry.outputs.forEach((output,j)=>{output.hidden=local<stages[i].submit+(j+1)*800;});
    });
    nodes.forEach(node=>{
      const state=frame.nodes[node.dataset.node];
      if(node.dataset.state!==state.state)node.dataset.state=state.state;
      // Keep the labels short enough for the diagram; the terminal carries details.
      const detail=state.state==='running'?({spec:'Reading requirements…',plan:'Mapping requirements…',dispatch:'Assigning agents…',build:'Working on the change…',test:'Running checks…',build2:'Writing behavior tests…',debug:'Diagnosing failure…',review:'Checking evidence…',human:'Awaiting decision'})[node.dataset.node]:state.detail;
      node.querySelector('[data-node-status]').textContent=detail;
      node.querySelector('.node-indicator').textContent=symbols[state.state];
    });
    wires.forEach(wire=>{const state=frame.wires[wire.dataset.wire];wire.classList.toggle('is-live',state==='live');wire.classList.toggle('is-done',state==='done');wire.classList.toggle('is-error',state==='error');});
    status.textContent=frame.submitted?stage.status:'Typing…';
    if(frame.phase==='failed')status.textContent='Test failed · handoff blocked';
    counter.textContent=({waiting:'checks pending',running:'checks running',failed:'2 passed / 1 failed',passed:'3 passed / 0 failed'})[frame.nodes.test.state];
    demo.style.setProperty('--demo-progress',`${elapsed/duration*100}%`);
    const signature=`${frame.index}:${frame.typed}:${Math.floor((frame.local-stage.submit)/800)}`;
    if(signature!==lastSignature){viewport.scrollTop=viewport.scrollHeight;lastSignature=signature;}
  }
  function playing(){return visible&&!paused&&!document.hidden&&!motion.matches&&elapsed<duration;}
  function sync(){
    const active=playing();demo.classList.toggle('is-idle',!active);demo.classList.toggle('is-paused',paused);
    pause.textContent=paused?'Resume':'Pause';pause.disabled=elapsed>=duration||motion.matches;
    if(active&&raf===null){previous=null;raf=requestAnimationFrame(tick);}
    else if(!active){if(raf!==null)cancelAnimationFrame(raf);raf=null;previous=null;}
  }
  function tick(now){raf=null;if(!playing()){sync();return;}if(previous!==null)elapsed=Math.min(duration,elapsed+now-previous);previous=now;render();if(elapsed<duration)raf=requestAnimationFrame(tick);else sync();}
  function preference(){elapsed=motion.matches?duration:0;lastStage=-1;lastSignature='';paused=false;demo.querySelector('.demo-controls').hidden=motion.matches;render();sync();}
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  replay.addEventListener('click',()=>{elapsed=0;previous=null;lastStage=-1;lastSignature='';paused=false;render();sync();});
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',preference);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.15}).observe(demo);
  demo.classList.add('is-enhanced');preference();
})();
