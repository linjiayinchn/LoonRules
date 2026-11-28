// Smart Selection 0.1.4 | RoutingRules | detection only
// Loon 3.5.1 (983)+. No policy writes, MitM, or credential collection.
function createSmartSelection(api) {
  "use strict";
  const VERSION="0.1.4", KEY="routingrules.smart-selection.v1", LOCK=KEY+".lease";
  const MB=1000000, H=3600000, BATCH=6, RUN_BYTES=16*MB, RUN_MS=155000;
  const now=api.now, own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const unique=a=>Array.from(new Set(a));
  const validName=x=>typeof x==="string"&&x.trim().length>0&&x.length<=300;
  const builtIn=x=>/^(DIRECT|PROXY|REJECT(?:[-_].*)?|DROP|PASS)$/i.test(x.trim());
  const pseudo=x=>/剩余|到期|套餐|联系邮箱|导航网址|续费|流量重置|^Q群|^QQ群|官网地址/i.test(x);
  const day=t=>{const d=new Date(t);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
  const median=a=>{const b=a.slice().sort((x,y)=>x-y);return b.length?(b[Math.floor((b.length-1)/2)]+b[Math.ceil((b.length-1)/2)])/2:null;};
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
  const safeParse=x=>typeof x==="string"?JSON.parse(x):x;
  const format=x=>typeof x==="number"&&Number.isFinite(x)?x.toFixed(1):"—";
  const fresh=(s,t,age)=>s&&Number.isFinite(s.at)&&t>=s.at&&t-s.at<=age;
  function config() {
    const c=safeParse(api.config())||{};
    if(!Array.isArray(c.all_policy_groups)||!c.all_policy_groups.every(validName))throw Error("无法识别 all_policy_groups；请检查 Loon 版本");
    return c;
  }
  function options(args) {
    args=args&&typeof args==="object"?args:{};
    let budget=Number(args.dailyMB==null?200:args.dailyMB);
    if(![50,100,200,300].includes(budget))throw Error("不支持的每日预算");
    const groups=String(args.groups||"").split(/[;；\n]/).map(x=>x.trim()).filter(Boolean);
    return {budget:budget*MB,groups:unique(groups)};
  }
  function network(c){
    // Never persist SSID itself. An unidentified network is deliberately not trusted
    // as a stable network identity: history is short-lived and marked unverified.
    return typeof c.ssid==="string"&&c.ssid.trim()?{key:"wifi-"+hash(c.ssid),label:"Wi-Fi",known:true}:{key:"unknown",label:"网络未识别",known:false};
  }
  function newState(t) {return {v:1,day:day(t),charged:0,actual:0,records:{},last:null,cursor:0};}
  function load(){
    const raw=api.read(KEY);
    if(!raw)return newState(now());
    const s=safeParse(raw);
    if(!s||s.v!==1||typeof s.day!=="string"||!Number.isSafeInteger(s.charged)||s.charged<0||!Number.isSafeInteger(s.actual)||s.actual<0||!s.records||typeof s.records!=="object"||Array.isArray(s.records))throw Error("本地记录异常；为避免重复消耗预算，停止测速");
    // Do not reset after a backwards clock change.
    if(day(now())>s.day){s.day=day(now());s.charged=0;s.actual=0;}
    return s;
  }
  function save(s){if(api.write(KEY,JSON.stringify(s))!==true)throw Error("本地存储失败，停止测速");}
  function claim(){
    const old=api.read(LOCK);
    if(old){const x=safeParse(old);if(x&&x.until>now())return null;}
    const token=String(now())+"-"+String(api.random());
    if(api.write(LOCK,JSON.stringify({token,until:now()+240000}))!==true)throw Error("无法保存任务锁");
    const x=safeParse(api.read(LOCK));
    return x&&x.token===token?token:null;
  }
  function verifyLease(token){
    const x=safeParse(api.read(LOCK)||"null");
    if(!x||x.token!==token||x.until<=now())throw Error("任务锁已失效，停止测速");
  }
  function release(token){
    const x=safeParse(api.read(LOCK)||"null");
    if(x&&x.token===token)api.write(LOCK,JSON.stringify({token:"",until:0}));
  }
  function callbackCall(start,ms){
    return new Promise(resolve=>{
      let done=false;
      const timer=api.timer(()=>finish({watchdog:true}),ms);
      function finish(v){if(done)return;done=true;api.clear(timer);resolve(v);}
      try{start(finish);}catch(e){finish({error:"API 调用异常"});}
    });
  }
  async function discover(c,opts,context) {
    const all=unique(c.all_policy_groups), known=new Set(all);
    const requested=opts.groups.length?opts.groups:all;
    const scoped=context.group?requested.filter(x=>x===context.group):requested;
    if(context.group&&!scoped.length)throw Error("该策略组未纳入检测范围");
    const groups=[];
    const built=new Set(Array.isArray(c.all_buildin_nodes)?c.all_buildin_nodes:[]);
    // Flat leaf groups only in V0.1. Nested groups are not treated as individual nodes.
    for(const name of scoped){
      let g={name,nodes:[],selected:"",skipped:0,error:null,discovery:null};
      groups.push(g);
      if(!known.has(name)){g.error="策略组不存在";continue;}
      try{
        try{const selected=api.selected(name);g.selected=validName(selected)?selected:"";}catch(_){}
        const r=await callbackCall(cb=>api.members(name,x=>cb({value:x})),3500);
        if(r.watchdog||r.error)throw Error("候选节点读取超时或失败");
        const a=r.value===""||r.value==null?[]:safeParse(r.value);
        // Loon returns JSON arrays of {name,type} in actual clients.
        // Accept legacy name strings too; never probe typed non-node policies.
        if(!Array.isArray(a)){
          g.discovery={array:false,kind:typeof a};
          api.log(JSON.stringify({group:name,discovery:g.discovery}));
          throw Error("候选节点返回格式未识别");
        }
        const names=[], shape={strings:0,nodes:0,nonNodes:0,unknown:0};
        for(const item of a){
          if(validName(item)){shape.strings++;names.push(item);}
          else if(item&&typeof item==="object"&&validName(item.name)&&typeof item.type==="string"){
            if(item.type.toLowerCase()==="node"){shape.nodes++;names.push(item.name);}
            else shape.nonNodes++;
          }else shape.unknown++;
        }
        // Log only shape counts, not raw node descriptions or secrets.
        g.discovery={total:a.length,...shape};
        api.log(JSON.stringify({group:name,discovery:g.discovery}));
        if(a.length&&shape.strings+shape.nodes+shape.nonNodes===0)throw Error("候选节点条目格式未识别");
        g.nodes=unique(names.filter(x=>!known.has(x)&&!built.has(x)&&!builtIn(x)&&!pseudo(x)));
        g.skipped=a.length-g.nodes.length;
        if(context.node)g.nodes=g.nodes.filter(x=>x===context.node);
        if(!g.nodes.length)g.error="无可直接测速的叶子节点";
      }catch(e){g.error=e.message;}
    }
    return groups;
  }
  const recKey=(net,node)=>JSON.stringify([net.key,node]);
  function getRecord(s,net,node){
    const k=recKey(net,node);
    return own(s.records,k)?s.records[k]:null;
  }
  function record(s,net,node,result){
    const k=recKey(net,node), old=getRecord(s,net,node)||{samples:[],lastDownload:0,lastAttempt:0};
    const samples=(Array.isArray(old.samples)?old.samples:[]).filter(x=>fresh(x,now(),7*24*H)).slice(-7);
    samples.push(result);
    s.records[k]={samples,lastDownload:result.mbps!=null?result.at:old.lastDownload||0,lastAttempt:result.at};
  }
  function prune(s){
    for(const k of Object.keys(s.records)){const r=s.records[k];if(!r||!fresh({at:r.lastAttempt},now(),7*24*H))delete s.records[k];}
    const keys=Object.keys(s.records).sort((a,b)=>s.records[b].lastAttempt-s.records[a].lastAttempt);
    for(const k of keys.slice(0,Math.max(0,keys.length-600))){ // delete oldest only
      // no-op here; actual bound below
    }
    for(const k of keys.slice(600))delete s.records[k];
  }
  function quality(r,net,t){
    if(!r||!Array.isArray(r.samples))return {status:"待测",score:null};
    const age=net.known?24*H:2*H;
    const samples=r.samples.filter(x=>fresh(x,t,age));
    if(!samples.length)return {status:"过期",score:null};
    const latest=samples[samples.length-1];
    const lat=samples.flatMap(x=>Array.isArray(x.lat)?x.lat:[]);
    const down=samples.filter(x=>Number.isFinite(x.mbps));
    const success=100*samples.reduce((a,x)=>a+x.ok,0)/Math.max(1,samples.reduce((a,x)=>a+x.attempts,0));
    const delay=median(lat);
    // Compare repeat observations of the same target, not Apple against Google.
    const targetLats=["Google","Apple"].map(target=>samples.flatMap(x=>(x.targets||[]).filter(y=>y.target===target&&y.ok&&Number.isFinite(y.ms)).map(y=>y.ms)));
    const deviations=targetLats.filter(a=>a.length>=2).map(a=>{const m=median(a);return median(a.map(x=>Math.abs(x-m)));});
    const deviation=median(deviations);
    let speed=null;
    if(down.length){let num=0,den=0;down.forEach((x,i)=>{const w=Math.pow(.65,down.length-1-i);num+=x.mbps*w;den+=w;});speed=num/den;}
    const q={status:"样本不足",score:null,delay,speed,success,deviation,samples:samples.length,last:latest.at,lastError:latest.error||null};
    if(latest.ok===0){q.status=String(latest.error||"").includes("回调超时")?"回调超时·待复核":"最近连接失败";return q;}
    if(!latest.mbps||speed==null||delay==null){q.status="待有效下载";return q;}
    const v=100*Math.min(1,Math.log(1+speed)/Math.log(51)), l=100*Math.exp(-Math.max(0,delay-50)/350), j=deviation==null?null:100*Math.exp(-deviation/100);
    q.score=Math.round(((.4*v+.2*l+.3*success+(j==null?0:.1*j))/(j==null?.9:1))*10)/10;
    q.status=latest.ok<latest.attempts?"部分失败":(!net.known||down.length<2||deviation==null?"初步":"已复测");
    return q;
  }
  function retryInfo(r){
    if(!r||!Array.isArray(r.samples)||!r.samples.length)return {failures:0,retryAt:0};
    let failures=0;
    for(let i=r.samples.length-1;i>=0;i--){
      const x=r.samples[i];
      if(x.mbps!=null||!x.error)break;
      failures++;
    }
    return {failures,retryAt:failures?r.lastAttempt+Math.min(6,2**Math.min(3,failures-1))*H:0};
  }
  function queue(groups,s,net,manual=false){
    const valid=groups.filter(g=>g.nodes.length);
    if(!valid.length)return [];
    const current=unique(valid.filter(g=>g.nodes.includes(g.selected)).map(g=>g.selected));
    // Round-robin group ordering across batches; at least one oldest candidate per group.
    const offset=(s.cursor||0)%valid.length;
    const ordered=valid.slice(offset).concat(valid.slice(0,offset));
    const oldest=g=>g.nodes.slice().sort((a,b)=>(getRecord(s,net,a)?.lastAttempt||0)-(getRecord(s,net,b)?.lastAttempt||0)||a.localeCompare(b));
    const lists=ordered.map(oldest);
    const urgent=ordered.filter(g=>g.nodes.includes(g.selected)).map(g=>g.selected).filter(x=>current.includes(x)&&(!getRecord(s,net,x)||now()-getRecord(s,net,x).lastAttempt>=H));
    const unseen=unique(lists.flat().filter(x=>!getRecord(s,net,x)));
    const first=lists.map(a=>a[0]);
    // First-time coverage takes precedence over retesting previously attempted nodes.
    const merged=unique(urgent.filter(x=>unseen.includes(x)).concat(unseen,urgent,first));
    for(let i=1;i<Math.max(...lists.map(a=>a.length));i++)for(const a of lists)if(a[i]!==undefined&&!merged.includes(a[i]))merged.push(a[i]);
    const untested=merged.filter(x=>!getRecord(s,net,x));
    const normal=merged.filter(x=>getRecord(s,net,x)&&!retryInfo(getRecord(s,net,x)).failures);
    const retry=merged.filter(x=>{const r=retryInfo(getRecord(s,net,x));return r.failures&&(manual||r.retryAt<=now());})
      .sort((a,b)=>(getRecord(s,net,a).lastAttempt-getRecord(s,net,b).lastAttempt));
    // Leave a slot for eligible recovery probes while testing healthy nodes first.
    return unique(untested.concat(normal.slice(0,BATCH-1),retry,normal.slice(BATCH-1)));
  }
  function reserve(s,opts,run,bytes,token){
    verifyLease(token);
    if(day(now())!==s.day||s.charged+bytes>opts.budget||run.charged+bytes>RUN_BYTES)return false;
    s.charged+=bytes;run.charged+=bytes;save(s);return true;
  }
  async function request(node,url,method,bytes,s,opts,run,token,trace=false) {
    // Reserve requested payload plus a conservative per-request allowance.
    // This is an estimate, not a physical transport-layer byte counter.
    const allowance=bytes+16000;
    if(!reserve(s,opts,run,allowance,token))return {skipped:true};
    const start=now();
    const timeout=method==="head"||trace?5000:15000;
    const options={url,node,timeout,"binary-mode":!trace,"auto-redirect":false,"auto-cookie":false,insecure:false,headers:{"Cache-Control":"no-cache, no-store","Pragma":"no-cache","Accept-Encoding":"identity"}};
    const r=await callbackCall(cb=>api.request(method,options,(err,res,data)=>cb({err,res,data})),timeout+4000);
    const elapsed=Math.max(1,now()-start);
    let n=0;
    if(r.data&&typeof r.data.byteLength==="number")n=r.data.byteLength;
    else if(typeof r.data==="string")n=r.data.length;
    if(!Number.isSafeInteger(n)||n<0)n=0;
    // Unexpected oversized responses are charged retrospectively, then halt the run.
    if(n>bytes){const extra=Math.max(0,n-allowance);s.charged+=extra;run.charged+=extra;}
    s.actual+=n;run.actual+=n;verifyLease(token);save(s);
    if(r.watchdog){run.stop=true;return {ok:false,error:"回调超时，停止本批",elapsed,n};}
    if(n>allowance){run.stop=true;return {ok:false,error:"响应超过预期，停止本批",elapsed,n};}
    if(r.error||r.err||!r.res)return {ok:false,error:"连接失败或超时",elapsed,n};
    const status=Number(r.res.status??r.res.statusCode);
    const headers=r.res.headers||{};
    const header=name=>{const k=Object.keys(headers).find(x=>x.toLowerCase()===name);return k?String(headers[k]):"";};
    if(trace){
      // Raw IP lives only in this request result and an in-memory map for this run.
      const body=typeof r.data==="string"&&n<=4096?r.data:"";
      const ip=(body.match(/^ip=([0-9a-fA-F:.]{3,45})\s*$/m)||[])[1];
      const colo=(body.match(/^colo=([A-Z]{3})\s*$/m)||[])[1]||null;
      return {ok:status===200&&!!ip,status,elapsed,n,ip:ip||null,colo};
    }
    return {ok:true,status,elapsed,n,contentType:header("content-type"),encoding:header("content-encoding"),binary:r.data!=null&&typeof r.data!=="string"&&typeof r.data.byteLength==="number"};
  }
  async function probe(node,s,opts,run,token){
    const p={at:now(),lat:[],ok:0,attempts:0,mbps:null,bytes:0,error:null,targets:[]};
    const can=()=>!run.stop&&now()-run.start<RUN_MS-20000;
    for(const [url,status] of [["https://www.gstatic.com/generate_204",204],["https://www.apple.com/library/test/success.html",200]]){
      if(!can())break;
      const r=await request(node,url,"head",0,s,opts,run,token);
      if(r.skipped)break;
      p.attempts++;
      const pass=r.ok&&r.status===status;
      p.targets.push({target:status===204?"Google":"Apple",ok:pass,status:r.status||null,ms:r.elapsed});
      if(pass){p.ok++;p.lat.push(r.elapsed);}else p.error=r.error||"轻量目标状态异常";
    }
    // Even when both light targets fail, try the independent download target
    // to distinguish target-specific failures from a dead route.
    for(const bytes of [2*MB,5*MB]){
      if(!can())break;
      const r=await request(node,"https://speed.cloudflare.com/__down?bytes="+bytes+"&rr="+String(now()),"get",bytes,s,opts,run,token);
      if(r.skipped)break;
      p.attempts++;
      const pass=r.ok&&r.status===200&&r.binary&&r.n===bytes&&!/html|json|text\/plain/i.test(r.contentType)&&(!r.encoding||r.encoding==="identity");
      p.targets.push({target:"Cloudflare",ok:pass,status:r.status||null,ms:r.elapsed,bytes:r.n,expected:bytes});
      if(!pass){p.error=r.error||"下载响应校验失败";break;}
      p.ok++;p.bytes+=r.n;p.mbps=8*r.n/(r.elapsed*1000);
      if(r.elapsed>=300||bytes===5*MB)break;
    }
    p.at=now();
    return p;
  }
  function buildReport(groups,s,net,opts,run){
    return {version:VERSION,mode:"只检测，不切换",network:net.label,networkIdentified:net.known,
      day:s.day,budgetMB:opts.budget/MB,chargedMB:Math.round(s.charged/MB*100)/100,receivedMB:Math.round(s.actual/MB*100)/100,
      batch:run?{tested:run.tested,chargedMB:Math.round(run.charged/MB*100)/100,stop:run.stop,stopReason:run.stopReason||null,
        elapsedMs:now()-run.start,uniqueCandidates:unique(groups.flatMap(g=>g.nodes)).length,
        remainingThisRun:unique(groups.flatMap(g=>g.nodes)).filter(x=>!run.tested.includes(x)).length,
        samples:run.samples||[],egress:run.egress||[],deferred:run.deferred||[]}:null,
      groups:groups.map(g=>{const rows=g.nodes.map(node=>({node,current:node===g.selected,...quality(getRecord(s,net,node),net,now()),...retryInfo(getRecord(s,net,node))})).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.node.localeCompare(b.node));
        return {name:g.name,selected:g.selected,selectedInCandidates:g.nodes.includes(g.selected),count:g.nodes.length,skipped:g.skipped,error:g.error,discovery:g.discovery,ranked:rows.filter(r=>r.score!=null).length,rows};})};
  }
  function summary(r){
    const lines=[`Smart Selection ${r.version} · 只检测`,`${r.network}｜今日预算 ${r.chargedMB}/${r.budgetMB} MB（预扣估算）`];
    if(r.batch){lines.push(`本轮检测 ${r.batch.tested.length}/${r.batch.uniqueCandidates} 个去重节点；${r.batch.chargedMB} MB；${r.batch.stopReason||"本批完成"}`);if(r.batch.deferred.length)lines.push(`故障退避：${r.batch.deferred.length} 个节点`);if(r.batch.egress.length)lines.push(`出口诊断：${r.batch.egress.filter(x=>x.status==="observed").length} 个成功；出口编号仅本轮有效`);}
    for(const g of r.groups){
      lines.push(`\n${g.name} · ${g.ranked}/${g.count} 已评分${g.skipped?" · 排除 "+g.skipped:""}`);
      if(g.error){lines.push(g.error);continue;}
      lines.push("当前："+(g.selected||"未知")+(g.selected&&!g.selectedInCandidates?"（未与候选名称精确匹配）":""));
      for(const x of g.rows.slice(0,5))lines.push(`${x.current?"●":"○"} ${x.node}｜${x.score??"—"} 分｜${format(x.delay)} ms｜${format(x.speed)} Mbps｜${x.status}`);
      if(g.rows.length>5)lines.push("其余节点详见脚本日志");
    }
    if(!r.networkIdentified)lines.push("\n网络身份未识别，历史数据仅短期使用。");
    lines.push("\n本次运行的完整诊断、原始测速及各组排名已合并至同一日志，无需另行运行质量报告。未执行任何策略切换。");
    return lines.join("\n");
  }
  async function run(args,context={}){
    const opts=options(args),c=config(),net=network(c);
    const tag=String(context.tag||"");
    const isReport=tag.includes("质量报告"); // backward compatibility for cached old entry
    const unified=tag.includes("一键诊断");
    if(unified)context={...context,group:"",node:""};
    const token=claim();
    if(!token)return {title:"Smart Selection",content:"已有任务执行，稍后重试"};
    try{
      let s=load();
      const groups=await discover(c,opts,context);
      if(isReport){const report=buildReport(groups,s,net,opts,null);api.log(JSON.stringify(report));return {title:"线路质量报告",content:summary(report),report};}
      const run={start:now(),charged:0,actual:0,tested:[],samples:[],egress:[],deferred:[],stop:false,stopReason:null};
      const candidates=queue(groups,s,net,unified);
      run.deferred=unique(groups.flatMap(g=>g.nodes)).filter(x=>!candidates.includes(x)).map(node=>({node,...retryInfo(getRecord(s,net,node))}));
      for(const node of candidates){
        if(run.stop){run.stopReason="请求异常，提前结束";break;}
        if(run.tested.length>=BATCH){run.stopReason="达到单轮节点上限";break;}
        if(now()-run.start>RUN_MS-20000){run.stopReason="达到单轮时间上限";break;}
        if(s.charged+2*MB+48000>opts.budget){run.stopReason="当日剩余预算不足";break;}
        if(run.charged+2*MB+48000>RUN_BYTES){run.stopReason="达到单轮流量上限";break;}
        // Abort if identified Wi-Fi changes during a batch.
        if(network(config()).key!==net.key){run.stop=true;run.stopReason="网络环境变化";break;}
        const sample=await probe(node,s,opts,run,token);
        if(sample.attempts){record(s,net,node,sample);run.tested.push(node);run.samples.push({node,sample});api.log(JSON.stringify({node,sample}));save(s);}
      }
      // Manual diagnostic: inspect reachable nodes' observed egress after core probes.
      // Alias labels are local to this run; no raw IP or IP hash is logged or persisted.
      if(unified&&!run.stop){
        const aliases=new Map();
        for(const item of run.samples.filter(x=>x.sample.ok>0)){
          if(run.stop||now()-run.start>RUN_MS-20000||network(config()).key!==net.key)break;
          const r=await request(item.node,"https://speed.cloudflare.com/cdn-cgi/trace","get",4096,s,opts,run,token,true);
          if(r.skipped)break;
          if(r.ok){
            if(!aliases.has(r.ip))aliases.set(r.ip,"E"+(aliases.size+1));
            run.egress.push({node:item.node,status:"observed",alias:aliases.get(r.ip),colo:r.colo,ms:r.elapsed});
          }else run.egress.push({node:item.node,status:"unverified",error:r.error||"出口响应无法校验"});
        }
      }
      s.cursor=(s.cursor||0)+1;prune(s);s.last=now();save(s);
      if(!run.stopReason)run.stopReason=run.stop?"请求异常，提前结束":candidates.length===0?(run.deferred.length?"故障节点退避中":"没有可测速节点"):"本轮候选检测完成";
      const report=buildReport(groups,s,net,opts,run);
      report.diagnostic={schema:1,generatedAt:new Date(now()).toISOString(),scope:unified?"all_configured_groups":"configured_scope",checks:{
        groupDiscovery:groups.length>0&&groups.every(g=>!g.error)?"pass":groups.some(g=>!g.error)?"partial":"fail",
        selectedRead:groups.every(g=>g.selected)?"pass":"partial",
        selectedMembership:groups.every(g=>g.selected&&g.nodes.includes(g.selected))?"pass":"mismatch_or_unknown",
        lightProbe:run.samples.some(x=>x.sample.lat.length)?"pass":run.samples.length?"no_success":"not_run",
        downloadProbe:run.samples.some(x=>x.sample.mbps!=null)?"pass":run.samples.length?"no_valid_download":"not_run",
        sharedBudget:s.charged<=opts.budget?"within_limit":"over_estimate",
        ranking:report.groups.some(g=>g.ranked>0)?"available":"not_available",
        egressVerification:new Set(run.egress.filter(x=>x.status==="observed").map(x=>x.alias)).size>1?"distinct_egress_observed":run.egress.some(x=>x.status==="observed")?"single_egress_observed":"not_verified",policySwitch:"not_attempted"}};
      api.log("SMART_SELECTION_DIAGNOSTIC_BEGIN");
      api.log(JSON.stringify(report));
      api.log("SMART_SELECTION_DIAGNOSTIC_END");
      return {title:"一键诊断完成",content:summary(report),report};
    }finally{release(token);}
  }
  return {run,quality,queue,options,network,newState,buildReport};
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = createSmartSelection;
} else {
  const api = {
    now: Date.now, random: Math.random,
    config: () => $config.getConfig(),
    members: (name, cb) => $config.getSubPolicies(name, cb),
    selected: name => $config.getSelectedPolicy(name),
    read: key => $persistentStore.read(key),
    write: (key, value) => $persistentStore.write(value, key),
    request: (method, opts, cb) => $httpClient[method](opts, cb),
    timer: (cb, ms) => setTimeout(cb, ms),
    clear: id => { if (typeof clearTimeout === "function") clearTimeout(id); },
    log: text => console.log(text)
  };
  const params = typeof $environment !== "undefined" && $environment ? ($environment.params || {}) : {};
  const args = typeof $argument !== "undefined" ? $argument : {};
  const tag = typeof $script !== "undefined" && $script ? $script.name : "";
  const node = typeof params.node === "string" ? params.node : (params.nodeInfo && typeof params.nodeInfo.name === "string" ? params.nodeInfo.name : "");
  createSmartSelection(api).run(args, { tag, group: typeof params.policyGroup === "string" ? params.policyGroup : "", node })
    .then(result => { $done({title:result.title, content:result.content}); })
    .catch(error => { console.log("Smart Selection: " + String(error.message || error)); $done({title:"Smart Selection 检测中止",content:String(error.message || error)}); });
}
