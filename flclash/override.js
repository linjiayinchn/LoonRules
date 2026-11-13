// LoonRules / FlClash Mihomo override
// Purpose: transform PPVPN 3 Fallback groups into url-test over all 5 actual nodes,
// then attach self-maintained AI, Crypto and Finance rule providers.
// Does not contain subscription credentials or proxy secrets.
// 2026-11-13
function main(config) {
  if (!config || typeof config !== "object") return config;
  var groups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];
  var proxies = Array.isArray(config.proxies) ? config.proxies : [];
  var master = null, groupByName = {}, physical = {}, i;
  for (i = 0; i < groups.length; i++) {
    if (groups[i] && typeof groups[i].name === "string") {
      groupByName[groups[i].name] = groups[i];
      if (groups[i].name === "节点选择") master = groups[i];
    }
  }
  for (i = 0; i < proxies.length; i++) {
    if (proxies[i] && proxies[i].name && proxies[i].type) physical[proxies[i].name] = proxies[i];
  }
  if (!master) throw new Error("Missing PPVPN strategy group: 节点选择");
  var selected = [], visitedGroups = {};
  function traverse(name) {
    if (physical[name]) {
      if (selected.indexOf(name) === -1) selected.push(name);
      return;
    }
    if (visitedGroups[name]) return;
    var group = groupByName[name];
    if (!group) return;
    visitedGroups[name] = true;
    var members = Array.isArray(group.proxies) ? group.proxies : [];
    for (var j = 0; j < members.length; j++) traverse(members[j]);
  }
  var originalMembers = Array.isArray(master.proxies) ? master.proxies.slice() : [];
  for (i = 0; i < originalMembers.length; i++) traverse(originalMembers[i]);
  if (selected.length < 2) throw new Error("Failed to flatten real node list; keep old profile.");
  var testURL = "https://www.gstatic.com/generate_204";
  master.type = "url-test";
  master.proxies = selected;
  master.url = testURL;
  master.interval = 600;
  master.tolerance = 50;
  master.lazy = true;
  delete master.use;
  delete master.filter;
  delete master["exclude-filter"];
  delete master["exclude-type"];
  // Preserve child group names to avoid breaking any airport rules referencing them.
  for (i = 0; i < groups.length; i++) {
    var group = groups[i];
    if (group && group.type === "fallback" && originalMembers.indexOf(group.name) !== -1) {
      group.type = "url-test";
      group.url = testURL;
      group.interval = 600;
      group.tolerance = 50;
      group.lazy = true;
    }
  }
  var ruleProviders = config["rule-providers"] || {};
  var prefix = "https://raw.githubusercontent.com/linjiayinchn/LoonRules/main/rules/";
  var specs = [
    ["LR_AI", "AI_Extra.list"],
    ["LR_Crypto", "Crypto_Web3.list"],
    ["LR_Finance", "US_Media_Finance.list"]
  ];
  for (i = 0; i < specs.length; i++) {
    var key = specs[i][0];
    ruleProviders[key] = {
      type: "http",
      behavior: "classical",
      format: "text",
      url: prefix + specs[i][1],
      path: "./ruleset/" + key + ".list",
      interval: 86400,
      proxy: "节点选择"
    };
  }
  config["rule-providers"] = ruleProviders;
  var originalRules = Array.isArray(config.rules) ? config.rules : [];
  var newRules = [
    "RULE-SET,LR_AI,节点选择",
    "RULE-SET,LR_Crypto,节点选择",
    "RULE-SET,LR_Finance,节点选择"
  ], cleanedRules = [];
  for (i = 0; i < originalRules.length; i++) {
    if (newRules.indexOf(originalRules[i]) < 0) cleanedRules.push(originalRules[i]);
  }
  config.rules = newRules.concat(cleanedRules);
  return config;
}
