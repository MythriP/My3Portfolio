/* Deterministic illustration: sample commands and output, never executed. */
(function (root) {
  'use strict';
  const line = (text, tone = 'info', node, state, detail) => ({ text, tone, node, state, detail });
  const stages = [
    { title: 'Type the intent. Press Enter.', description: 'The request becomes a specification with explicit behavior and constraints.', command: 'Add a refund endpoint. Repeated requests must never issue a second refund. Check permissions and test the retry path.', typing: 4200, node: 'spec', status: 'Writing the specification', outputs: [line('↳ Calling specification workflow…'), line('✓ Created refund.spec.md', 'pass'), line('✓ Requirements: permissions · refunds · safe retries', 'pass','spec','passed','3 requirements captured')] },
    { title: 'Check the specification before writing code.', description: 'Audit the requirements so the agents have a clear target.', command: 'speed audit refund.spec.md', node:'spec', status:'Auditing the specification', outputs:[line('↳ Reading behavior and acceptance criteria…'),line('✓ Constraints are explicit; ready to plan.', 'pass','spec','passed','Audit complete')] },
    { title: 'Split the request into scoped tasks.', description: 'The planner maps the work and its dependencies before agents start.', command:'speed plan refund.spec.md --feature refunds',node:'plan',wire:'plan',status:'Planner creating tasks',outputs:[line('01  API contract + permission checks'),line('02  Refund handler + duplicate-request guard'),line('03  Tests for permissions, refunds, and retries'),line('✓ Plan saved · 3 tasks with dependencies','pass','plan','passed','3 scoped tasks')] },
    { title: 'Verify the plan against the specification.',description:'Each requirement must have a place in the plan.',command:'speed verify --feature refunds',node:'plan',wire:'plan',status:'Verifying requirement coverage',outputs:[line('✓ Permissions → task 01','pass'),line('✓ Refund behavior → task 02','pass'),line('✓ Retry verification → task 03','pass','plan','passed','Coverage verified')] },
    { title:'Delegate the work with context.',description:'The orchestrator assigns scoped implementation and test work to separate agents.',command:'speed run --feature refunds',node:'dispatch',wire:'dispatch',status:'Orchestrator assigning agents',outputs:[line('↳ Spawn Developer agent · refund handler','spawn','build','spawned','Isolated task workspace'),line('↳ Spawn Test agent · behavior tests','spawn','build2','spawned','Separate task workspace'),line('↳ Ready tasks run within dependency + file boundaries','info','build','running','Implementing handler'),line('✓ Test agent → behavior tests written','pass','build2','passed','Test changes ready'),line('✓ Developer agent → handler ready for quality gates','pass','build','passed','Changes ready')] },
    { title:'The retry test catches a real behavior gap.',description:'The same request creates two refunds. The failed check blocks the handoff.',command:'speed eval --feature refunds --task 03',node:'test',wire:'test',status:'Running behavior checks',phase:'testing',outputs:[line('✓ PASS  rejects_unauthorized_request','pass'),line('✓ PASS  creates_refund','pass'),line('✗ FAIL  repeated_request_returns_same_refund','fail','test','failed','Retry test failed'),line('  Expected refund count: 1\n  Received refund count: 2','fail'),line('✗ Handoff blocked. Return failure to build agent.','fail')],hold:2000 },
    { title:'Send the failure back. Repair the cause.',description:'The build agent uses the failed assertion to fix duplicate-request handling.',command:'speed run --feature refunds',node:'build',wire:'repair',status:'Repairing duplicate-request handling',phase:'repair',outputs:[line('↳ Spawn debugger-01 · failed task + diff + logs','spawn','debug','spawned','Diagnosing failure'),line('✓ Diagnosis: retry creates a new refund','pass','debug','passed','Root cause identified'),line('↳ Retry Developer agent with diagnosis attached','spawn','build','running','Repairing retry guard'),line('✓ Duplicate-request guard updated','pass','build','passed','Repair complete')] },
    { title:'Run the checks again. Show the evidence.',description:'The retry test now passes alongside permission and refund checks.',command:'speed eval --feature refunds --task 03',node:'test',wire:'test',status:'Rechecking the repaired change',outputs:[line('✓ PASS  rejects_unauthorized_request','pass'),line('✓ PASS  creates_refund','pass'),line('✓ PASS  repeated_request_returns_same_refund','pass','test','passed','3 / 3 checks passed'),line('✓ 3 passed · 0 failed · evidence attached','pass')] },
    { title:'Spawn an independent reviewer.',description:'A separate reviewer checks the changes against the spec and test evidence.',command:'speed review --feature refunds --task 02',node:'dispatch',wire:'review',status:'Spawning reviewer sub-agent',outputs:[line('↳ Spawning reviewer-01 · independent context','spawn','review','spawned','reviewer-01 · starting'),line('  Attached: specification + diff + test evidence','info'),line('↳ reviewer-01 checking requirement coverage…','spawn','review','running','Reviewing evidence'),line('✓ Review complete · no blocking findings in this example','pass','review','passed','Evidence reviewed')],hold:1600 },
    { title:'Bring the evidence to a human.',description:'The agents prepare the handoff. A person makes the final decision.',command:'',typing:0,node:'human',wire:'human',status:'Awaiting human review',outputs:[line('✓ Specification linked','pass'),line('✓ Code changes + passing tests attached','pass'),line('✓ Independent review attached','pass','dispatch','passed','Handoff prepared'),line('◎ Ready for human review. No automatic release.','info','human','running','Awaiting decision')],hold:1800 }
  ];
  const initial = {
    spec:['waiting','Awaiting prompt'],plan:['waiting','Tasks + dependencies'],dispatch:['waiting','Assign scoped work'],
    build:['waiting','Implementation'],test:['waiting','Automatic quality gates'],build2:['waiting','Test implementation'],debug:['waiting','Spawned on failure'],review:['waiting','Not spawned yet'],human:['waiting','Final decision']
  };
  // Short activity labels describe the illustrative orchestration, not shell syntax.
  const activities=['','audit spec','plan tasks','verify plan','dispatch tasks','run checks','diagnose → retry','recheck','independent review','prepare handoff'];
  stages.forEach((stage,i)=>{
    stage.automatic=i>0;
    if(stage.automatic){stage.command=activities[i];stage.typing=0;}
  });
  stages[4].description='Separate developer sub-agents take ready tasks in isolated workspaces, respecting dependencies and file conflicts.';
  stages[5].description='Automatic quality gates find two refunds for one repeated request. The task fails and cannot move forward.';
  stages[6].description='A debugger sub-agent diagnoses the failure. The retry receives that diagnosis along with the original task.';
  stages[8].description='A separate review step delegates to a reviewer with the spec, diff, and evidence—not the developer’s reasoning.';
  let start=0;
  stages.forEach(stage=>{
    stage.typing ??= Math.min(2300,stage.command.length*38);
    stage.start=start;
    stage.submit=stage.automatic?0:stage.typing+350;
    stage.duration=stage.submit+stage.outputs.length*800+(stage.hold||1000);
    start+=stage.duration;
  });
  function frameAt(time) {
    time=Math.max(0,Math.min(start,time));
    const nodes=Object.fromEntries(Object.entries(initial).map(([key,value])=>[key,{state:value[0],detail:value[1]}]));
    const wires={};let phase='ready';let index=0;
    for(let i=0;i<stages.length;i++) {
      const stage=stages[i];if(time<stage.start)break;index=i;
      const local=time-stage.start;
      if(local<stage.submit)break;
      // A new command takes ownership of the highlighted path.
      Object.keys(wires).forEach(key=>{if(wires[key]==='live')wires[key]='done';});
      nodes[stage.node]={state:'running',detail:stage.status};
      if(stage.wire)wires[stage.wire]=stage.wire==='repair'?'error':'live';
      phase=stage.phase||'running';
      stage.outputs.forEach((output,j)=>{
        if(local<stage.submit+(j+1)*800)return;
        if(output.node)nodes[output.node]={state:output.state,detail:output.detail};
        if(output.state==='failed'){phase='failed';wires.test='error';}
        if(output.node==='build'&&output.state==='running')wires.build='live';
        if(output.node==='build2')wires.build2=output.state==='passed'?'done':'live';
        if(output.node==='debug')wires.debug=output.state==='passed'?'done':'live';
        if(output.node==='test'&&output.state==='passed'){wires.test='done';wires.repair='done';}
        if(output.node==='review'&&output.state==='passed'){wires.review='done';wires.context='done';}
      });
    }
    const stage=stages[index],local=time-stage.start;
    return {index,local,nodes,wires,phase,submitted:local>=stage.submit,typed:stage.typing?Math.min(stage.command.length,Math.floor(stage.command.length*local/stage.typing)):stage.command.length,complete:time>=start};
  }
  const api={stages,duration:start,frameAt};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.My3FeaturedSequence=api;
})(typeof globalThis==='object'?globalThis:this);
