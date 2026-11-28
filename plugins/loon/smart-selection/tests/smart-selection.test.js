"use strict";
const createSmartSelection = require("../Smart_Selection.js");
function mockTests(factory){
  return (async()=>{
    let passed=0;const check=(v,label)=>{if(!v)throw Error("FAIL: "+label);passed++;};
    function mock(custom={}){
      let time=Date.UTC(2026,10,28,8),store=new Map(),calls=[],logs=[],writes=0;
      const groups=custom.groups||{"所有可用线路":["JP-fast","JP-slow","US","HK","DIRECT","剩余流量: 100 GB"],"美国线路":["US"],"香港线路":["HK"],"日本线路":["JP-fast","JP-slow"]};
      const selected=custom.selected||{"所有可用线路":"JP-slow","美国线路":"US","香港线路":"HK","日本线路":"JP-slow"};
      const api={now:()=>time,random:()=>.123,config:()=>JSON.stringify({all_policy_groups:Object.keys(groups),all_buildin_nodes:["DIRECT","REJECT"],ssid:"mock-wifi"}),members:(n,cb)=>cb(JSON.stringify(custom.typed?groups[n].map(x=>typeof x==="string"?{name:x,type:Object.prototype.hasOwnProperty.call(groups,x)?"group":"node"}:x):groups[n])),selected:n=>selected[n]||"",read:k=>store.get(k)||"",write:(k,v)=>{writes++;if(custom.writeFail)return false;store.set(k,v);return true;},timer:()=>0,clear:()=>{},log:s=>logs.push(s),request:(method,o,cb)=>{
        calls.push({method,node:o.node,url:o.url,timeout:o.timeout,secure:o.insecure===false});
        let fail=(custom.fail||[]).includes(o.node);
        if(fail){time+=1000;cb("timeout",null,null);return;}
        if(o.url.includes("/cdn-cgi/trace")){
          time+=200;const ip=o.node==="JP-fast"?"203.0.113.11":"203.0.113.22";
          cb(null,{status:200,headers:{"content-type":"text/plain"}},"ip="+ip+"\ncolo=NRT\n");return;
        }
        const m=/bytes=(\d+)/.exec(o.url),n=m?Number(m[1]):0;
        if(method==="head"){time+=o.node==="JP-slow"?70:130;cb(null,{status:o.url.includes("gstatic")?204:200,headers:{}},new Uint8Array(0));return;}
        time+=o.node==="JP-slow"?4000:400;
        cb(null,{status:200,headers:{"content-type":"application/octet-stream"}},new Uint8Array(custom.badLength?n-1:n));
      }};
      return {api,store,calls,logs,advance:ms=>time+=ms};
    }
    const m=mock(),core=factory(m.api);
    const r=(await core.run({dailyMB:200},{})).report;
    check(r.groups.length===4,"four independent groups");
    check(r.groups[0].count===4&&r.groups[0].skipped===2,"built-in and pseudo-node excluded");
    check(new Set(r.batch.tested).size===r.batch.tested.length,"shared probe dedupe");
    check(m.calls.filter(x=>x.node==="JP-fast"&&x.method==="get").length===1,"overlapping group download once");
    check(r.groups[3].rows[0].node==="JP-fast","faster throughput outranks lower delay");
    check(r.groups[1].rows.every(x=>x.node==="US"),"regional isolation");
    check(m.calls.every(x=>x.secure),"TLS validation");
    check(r.chargedMB>=r.receivedMB&&r.chargedMB<=16,"budget reserve");
    const count=m.calls.length;
    const rr=(await core.run({dailyMB:200},{tag:"质量报告"})).report;
    check(m.calls.length===count&&rr.batch===null,"read-only report");
    const a=mock({fail:["US"]}),fa=(await factory(a.api).run({},{})).report;
    check(fa.groups[1].rows[0].score===null&&fa.groups[3].ranked>0,"failed group isolated");
    const b=mock({badLength:true}),br=(await factory(b.api).run({},{})).report;
    check(br.groups.every(g=>g.ranked===0),"truncated body not scored");
    const c=mock(),cc=factory(c.api);
    for(let i=0;i<8;i++)await cc.run({dailyMB:50},{});
    const cr=(await cc.run({dailyMB:50},{tag:"质量报告"})).report;
    check(cr.chargedMB<=50&&cr.chargedMB>45,"daily budget shared");
    c.advance(24*3600000);
    check((await cc.run({dailyMB:50},{tag:"质量报告"})).report.chargedMB===0,"day rollover");
    const d=mock({groups:{A:["B","JP-fast"],B:["JP-fast","REJECT"]},selected:{A:"B",B:"JP-fast"}});
    const dr=(await factory(d.api).run({},{})).report;
    check(dr.groups[0].count===1&&dr.groups[0].skipped===1,"nested group safely excluded");
    const e=mock({writeFail:true});let threw=false;try{await factory(e.api).run({},{});}catch(_){threw=true;}
    check(threw&&e.calls.length===0,"fail closed on storage error");
    const f=mock();f.store.set("routingrules.smart-selection.v1.lease",JSON.stringify({token:"other",until:f.api.now()+50000}));
    check((await factory(f.api).run({},{})).report===undefined&&f.calls.length===0,"active lease");
    const g=mock(),gr=(await factory(g.api).run({groups:"日本线路"},{group:"日本线路"})).report;
    check(gr.groups.length===1&&g.calls.every(x=>x.node.startsWith("JP")),"manual group scope");
    const z=mock();z.store.set("routingrules.smart-selection.v1","not-json");let err=false;try{await factory(z.api).run({},{});}catch(_){err=true;}
    check(err&&z.calls.length===0,"corrupt state fail closed");
    const typed=mock({typed:true}),tr=(await factory(typed.api).run({},{})).report;
    check(tr.groups[0].count===4&&tr.groups[3].ranked===2,"Loon typed object arrays parsed");
    check(tr.groups[3].selected==="JP-slow"&&tr.groups[3].rows[0].node==="JP-fast","typed nodes retain current selection and ranking");
    const mixed=mock({typed:true,groups:{A:["B","JP-fast",{name:"unexpected",type:"other"},{bad:true}],B:["JP-fast","DIRECT"]},selected:{A:"B",B:"JP-fast"}});
    const mr=(await factory(mixed.api).run({},{})).report;
    check(mr.groups[0].count===1&&mr.groups[0].skipped===3,"typed non-node and unknown entries excluded");
    check(mixed.calls.every(x=>x.node==="JP-fast"),"never probe unknown object or nested group");
    const empty=mock({groups:{A:[{bad:true}]},selected:{A:"old"}}),er=(await factory(empty.api).run({},{})).report;
    check(er.groups[0].error==="候选节点条目格式未识别"&&er.groups[0].selected==="old"&&empty.calls.length===0,"malformed entries fail safely, selected preserved");
    check(typed.logs.some(x=>x.includes('"nodes":')),"safe shape-only discovery diagnostics");
    const one=mock({typed:true}),oneResult=(await factory(one.api).run({dailyMB:200},{tag:"Smart Selection · 一键诊断",group:"日本线路",node:"JP-fast"})).report;
    check(oneResult.groups.length===4&&oneResult.diagnostic.scope==="all_configured_groups","one click includes all configured groups");
    check(oneResult.batch.samples.length===oneResult.batch.tested.length&&oneResult.batch.samples.every(x=>x.sample.targets.length>0),"consolidated raw per-node probes");
    check(oneResult.groups.every(g=>g.discovery&&Array.isArray(g.rows)),"consolidated discovery and rankings");
    check(oneResult.diagnostic.checks.downloadProbe==="pass"&&oneResult.diagnostic.checks.policySwitch==="not_attempted","diagnostic statuses");
    check(one.logs.filter(x=>x==="SMART_SELECTION_DIAGNOSTIC_BEGIN").length===1&&one.logs.filter(x=>x==="SMART_SELECTION_DIAGNOSTIC_END").length===1,"one complete diagnostic block");
    const many=mock({groups:{A:Array.from({length:12},(_,i)=>"node-"+i)},selected:{A:"node-0"}});
    const mr2=(await factory(many.api).run({}, {tag:"一键诊断"})).report;
    check(mr2.batch.tested.length<=6&&mr2.batch.remainingThisRun>0&&mr2.batch.stopReason==="达到单轮节点上限","bounded one-click coverage is explicit");
    check(r.groups[3].rows[0].deviation===null,"no cross-target jitter from single round");
    const repeat=await core.run({},{});check(repeat.report.groups[3].rows[0].deviation===0,"same-target repeat variation");
    check(m.calls.every(x=>x.timeout===(x.method==="head"?5000:15000)),"separate lightweight and download timeouts");
    const mismatch=mock({groups:{HK:["HK中转②"]},selected:{HK:"HK节点(中转)②"}});
    const mm=(await factory(mismatch.api).run({}, {tag:"一键诊断"})).report;
    check(mm.groups[0].selectedInCandidates===false&&mm.diagnostic.checks.selectedMembership==="mismatch_or_unknown","selection name mismatch flagged");
    check(mismatch.calls.every(x=>x.node==="HK中转②"),"no fuzzy route substitution");
    const follow=(await factory(many.api).run({}, {tag:"一键诊断"})).report;
    check(follow.batch.tested.every(x=>!mr2.batch.tested.includes(x)),"unattempted nodes prioritized next round");
    check(oneResult.diagnostic.checks.egressVerification==="distinct_egress_observed","distinct observed egress in manual diagnostic");
    check(oneResult.batch.egress.length===4&&oneResult.batch.egress.every(x=>/^E\d+$/.test(x.alias)),"anonymous within-run egress aliases");
    check(!JSON.stringify(oneResult).includes("203.0.113.")&&!one.logs.join("").includes("203.0.113.")&&!Array.from(one.store.values()).join("").includes("203.0.113."),"raw egress never persisted or logged");
    const fail=mock({fail:["US"]}),fc=factory(fail.api);
    await fc.run({},{});
    const next=(await fc.run({},{})).report;
    check(next.batch.deferred.some(x=>x.node==="US")&&!next.batch.tested.includes("US"),"failed node cooldown for automatic checks");
    const forced=(await fc.run({},{tag:"一键诊断"})).report;
    check(forced.batch.tested.includes("US"),"manual diagnostic can retest failed node");
    fail.advance(7*3600000);
    const recovery=(await fc.run({},{})).report;
    check(recovery.batch.tested.includes("US"),"failed nodes re-enter after cooldown");
    const ix=fail.calls.findIndex(x=>x.url.includes("/cdn-cgi/trace"));
    const lastUS=fail.calls.map(x=>x.node).lastIndexOf("US");
    check(ix>=0&&ix<lastUS,"manual egress evidence saved before known-failing candidates");
    return {passed};
  })();
}
mockTests(createSmartSelection).then(r=>console.log("Passed "+r.passed+" assertions")).catch(e=>{console.error(e);process.exitCode=1;});
