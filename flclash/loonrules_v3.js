// LoonRules: FlClash/Mihomo subscription extension (v3, 2026-11-13; new URL avoids FlClash cached imports)
// Uses the ACTUAL name of the source selector, including emoji prefixes.
// Flattens nested fallback groups to actual nodes for latency-first selection.
// Adds self-maintained AI/Crypto/Finance rule providers (remote, 24h refresh).
// No node credentials, subscription tokens or private data.
function main(config) {
  if (!config || typeof config !== "object") return config;
  try {
    if (typeof console !== "undefined" && console.info) {
      console.info("[LoonRules v3] New script running; automatic selector detection enabled.");
    }
    var out = JSON.parse(JSON.stringify(config));
    var groups = Array.isArray(out["proxy-groups"]) ? out["proxy-groups"] : [];
    var nodes = Array.isArray(out.proxies) ? out.proxies : [];
    var byGroup = Object.create(null), byNode = Object.create(null);
    var i, j;
    for (i = 0; i < groups.length; i++) {
      if (groups[i] && typeof groups[i].name === "string") {
        byGroup[groups[i].name] = groups[i];
      }
    }
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i] && typeof nodes[i].name === "string") {
        byNode[nodes[i].name] = true;
      }
    }

    // Never assume the selector name is literally "节点选择":
    // the subscription profile can call it "🚀 节点选择" or add other prefixes.
    var selector = null;
    for (i = 0; i < groups.length; i++) {
      if (groups[i] && /节点选择/.test(groups[i].name || "")) {
        selector = groups[i];
        break;
      }
    }
    if (!selector) {
      // Conservative fallback: select group with most actual nested nodes.
      var bestCount = 0;
      for (i = 0; i < groups.length; i++) {
        var candidate = groups[i];
        if (!candidate || candidate.type !== "select") continue;
        var candidateNodes = getLeafNodes(candidate);
        if (candidateNodes.length > bestCount) {
          bestCount = candidateNodes.length;
          selector = candidate;
        }
      }
    }
    if (!selector) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[LoonRules] No matching selector; original config preserved.");
      }
      return config;
    }

    // Collect leaf nodes recursively. Do not include DIRECT/REJECT or group names.
    function getLeafNodes(group) {
      var result = [], visited = Object.create(null);
      function walk(name) {
        if (byNode[name]) {
          if (result.indexOf(name) === -1) result.push(name);
          return;
        }
        if (visited[name]) return;
        visited[name] = true;
        var nested = byGroup[name];
        if (!nested || !Array.isArray(nested.proxies)) return;
        for (var k = 0; k < nested.proxies.length; k++) walk(nested.proxies[k]);
      }
      var members = Array.isArray(group.proxies) ? group.proxies : [];
      for (var k = 0; k < members.length; k++) walk(members[k]);
      return result;
    }

    var leaves = getLeafNodes(selector);
    if (leaves.length >= 2) {
      selector.type = "url-test";
      selector.proxies = leaves;
      selector.url = "https://www.gstatic.com/generate_204";
      selector.interval = 600;
      selector.tolerance = 50;
      selector.lazy = true;
      delete selector.use;
      delete selector.filter;
      delete selector["exclude-filter"];
      delete selector["exclude-type"];
    } else if (typeof console !== "undefined" && console.warn) {
      console.warn("[LoonRules] Only " + leaves.length +
        " leaf nodes detected; retaining existing node selection.");
    }
    // Leave source fallback groups untouched to protect any rules referencing them.

    var groupName = selector.name;
    var providers = out["rule-providers"];
    if (!providers || typeof providers !== "object" || Array.isArray(providers)) {
      providers = {};
    }
    var root = "https://raw.githubusercontent.com/linjiayinchn/LoonRules/main/rules/";
    var specs = [
      ["LR_AI", "AI_Extra.list"],
      ["LR_Crypto", "Crypto_Web3.list"],
      ["LR_Finance", "US_Media_Finance.list"]
    ];
    var prepend = [];
    for (i = 0; i < specs.length; i++) {
      var key = specs[i][0];
      providers[key] = {
        type: "http",
        behavior: "classical",
        format: "text",
        url: root + specs[i][1],
        path: "./ruleset/" + key + ".list",
        interval: 86400,
        proxy: groupName
      };
      prepend.push("RULE-SET," + key + "," + groupName);
    }
    out["rule-providers"] = providers;
    var oldRules = Array.isArray(out.rules) ? out.rules : [];
    var kept = oldRules.filter(function (line) {
      return typeof line !== "string" ||
        !/^RULE-SET,LR_(AI|Crypto|Finance),/.test(line);
    });
    out.rules = prepend.concat(kept);
    return out;
  } catch (err) {
    if (typeof console !== "undefined" && console.error) {
      console.error("[LoonRules] Override skipped: " + String(err));
    }
    return config;
  }
}
