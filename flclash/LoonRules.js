// LoonRules — FlClash configuration extension
// Remote routing rules and latency-based node selection.
// No account credentials or private configuration data.
function main(config) {
  if (!config || typeof config !== "object") return config;
  const next = JSON.parse(JSON.stringify(config));
  const groups = Array.isArray(next["proxy-groups"]) ? next["proxy-groups"] : [];
  const nodes = Array.isArray(next.proxies) ? next.proxies : [];
  const groupMap = new Map(groups.filter(g => g && typeof g.name === "string").map(g => [g.name, g]));
  const nodeNames = new Set(nodes.filter(n => n && typeof n.name === "string").map(n => n.name));
  function getLeaves(group) {
    const found = [], visited = new Set();
    function walk(name) {
      if (nodeNames.has(name)) {
        if (!found.includes(name)) found.push(name);
        return;
      }
      if (visited.has(name)) return;
      visited.add(name);
      const child = groupMap.get(name);
      if (child && Array.isArray(child.proxies)) child.proxies.forEach(walk);
    }
    (Array.isArray(group.proxies) ? group.proxies : []).forEach(walk);
    return found;
  }
  let selector = groups.find(g => g && typeof g.name === "string" && /节点选择/.test(g.name) && getLeaves(g).length >= 2);
  if (!selector) {
    const candidates = groups.filter(g => g && g.type === "select" && getLeaves(g).length >= 2);
    if (candidates.length === 1) selector = candidates[0];
  }
  if (!selector) {
    if (typeof console !== "undefined" && console.warn) console.warn("[LoonRules] No unambiguous selector with 2+ concrete nodes; no changes made.");
    return config;
  }
  const leaves = getLeaves(selector);
  if (leaves.length < 2) return config;
  selector.type = "url-test";
  selector.proxies = leaves;
  selector.url = "https://www.gstatic.com/generate_204";
  selector.interval = 600;
  selector.tolerance = 50;
  selector.lazy = true;
  for (const field of ["use", "filter", "exclude-filter", "exclude-type"]) delete selector[field];
  // Keep the source's nested groups: other rules may still reference them.
  const providers = next["rule-providers"] && typeof next["rule-providers"] === "object" && !Array.isArray(next["rule-providers"]) ? next["rule-providers"] : {};
  const root = "https://raw.githubusercontent.com/linjiayinchn/LoonRules/main/rules/";
  const specs = [["LR_AI", "AI_Extra.list"], ["LR_Crypto", "Crypto_Web3.list"], ["LR_Finance", "US_Media_Finance.list"]];
  const prepended = [];
  for (const [name, file] of specs) {
    providers[name] = {type:"http", behavior:"classical", format:"text", url:root+file, path:"./ruleset/"+name+".list", interval:86400, proxy:selector.name};
    prepended.push("RULE-SET,"+name+","+selector.name);
  }
  next["rule-providers"] = providers;
  const previous = Array.isArray(next.rules) ? next.rules : [];
  next.rules = prepended.concat(previous.filter(x => typeof x !== "string" || !/^RULE-SET,LR_(AI|Crypto|Finance),/.test(x)));
  return next;
}
