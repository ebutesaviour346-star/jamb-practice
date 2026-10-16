// ===== Bookmarks, Performance and the new home screen =====

function loadBookmarks() { return loadJSON("sd_bookmarks", []); }

function saveBookmarks(list) { localStorage.setItem("sd_bookmarks", JSON.stringify(list)); }

// The 🔖 button in an exam now saves the question to My Bookmarks
toggleFlag = function () {
  var name = subjects[cur];
  var e = qs[name][pos[name]];
  e.flag = !e.flag;
  var list = loadBookmarks();
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].q === e.item.q) { idx = i; }
  }
  if (e.flag && idx < 0) {
    list.unshift({ subject: name, q: e.item.q, o: e.item.o, a: e.item.a, e: e.item.e || "", date: new Date().toLocaleDateString() });
  }
  if (!e.flag && idx >= 0) { list.splice(idx, 1); }
  saveBookmarks(list);
  showQuestion();
};

function showBookmarks() {
  var list = loadBookmarks();
  var html = "<h2>My Bookmarks</h2>";
  if (list.length === 0) {
    html += "<p>No saved questions yet. During an exam, tap the 🔖 button to save a question here.</p>";
  } else {
    html += "<p>" + list.length + " saved question(s)</p>";
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      html += "<div class='rev'><p><b>" + esc(b.subject) + "</b> · " + esc(b.date) + "</p>";
      html += "<p>" + esc(b.q) + "</p>";
      html += "<p class='good'>Answer: " + esc(b.a) + "</p>";
      if (b.e) { html += "<p>" + esc(b.e) + "</p>"; }
      html += "<button class='full grey' onclick='removeBookmark(" + i + ")'>Remove</button></div>";
    }
  }
  html += "<button class='full grey' onclick='showMenu()'>Back to Home</button>";
  studyPage(html);
}

function removeBookmark(i) {
  var list = loadBookmarks();
  list.splice(i, 1);
  saveBookmarks(list);
  showBookmarks();
}

// ===== Performance =====

function parseMarks(str) {
  var out = {};
  var parts = String(str).split(", ");
  for (var i = 0; i < parts.length; i++) {
    var k = parts[i].lastIndexOf(" ");
    if (k > 0) {
      var v = parseFloat(parts[i].slice(k + 1));
      if (!isNaN(v)) { out[parts[i].slice(0, k)] = v; }
    }
  }
  return out;
}

function barRow(label, value, max, note) {
  var w = Math.max(0, Math.min(100, Math.round(value / max * 100)));
  return "<div style='margin:10px 0'><div style='display:flex;justify-content:space-between'><span>" + esc(label) +
    "</span><b>" + value + " / " + max + "</b></div>" +
    "<div style='background:#dde6f0;border-radius:6px;height:16px'><div style='width:" + w +
    "%;background:#1a5fb4;height:16px;border-radius:6px'></div></div>" +
    (note ? "<small>" + esc(note) + "</small>" : "") + "</div>";
}

function lineChart(vals, max) {
  var W = 320, H = 200, P = 30;
  var n = vals.length;
  var pts = [];
  for (var i = 0; i < n; i++) {
    var x = (n === 1) ? W / 2 : P + i * (W - 2 * P) / (n - 1);
    var y = H - P - (vals[i] / max) * (H - 2 * P);
    pts.push(x.toFixed(1) + "," + y.toFixed(1));
  }
  var svg = "<svg viewBox='0 0 " + W + " " + H + "' width='100%' style='background:#fff;border-radius:8px'>";
  svg += "<line x1='" + P + "' y1='" + P + "' x2='" + P + "' y2='" + (H - P) + "' stroke='#999'/>";
  svg += "<line x1='" + P + "' y1='" + (H - P) + "' x2='" + (W - P) + "' y2='" + (H - P) + "' stroke='#999'/>";
  svg += "<text x='2' y='" + (P + 4) + "' font-size='10'>" + max + "</text>";
  svg += "<text x='14' y='" + (H - P + 4) + "' font-size='10'>0</text>";
  if (n > 1) { svg += "<polyline fill='none' stroke='#1a5fb4' stroke-width='2' points='" + pts.join(" ") + "'/>"; }
  for (var k = 0; k < n; k++) {
    var p = pts[k].split(",");
    svg += "<circle cx='" + p[0] + "' cy='" + p[1] + "' r='4' fill='#ef6c00'/>";
    svg += "<text x='" + p[0] + "' y='" + (parseFloat(p[1]) - 8) + "' font-size='10' text-anchor='middle'>" + vals[k] + "</text>";
  }
  svg += "</svg>";
  return svg;
}

function showPerformance() {
  var all = loadJSON("sd_history", []);
  var exams = [];
  for (var a = all.length - 1; a >= 0; a--) {
    if (all[a].count >= 200) { exams.push(all[a]); }
  }
  var html = "<h2>My Performance</h2>";
  if (all.length === 0) {
    html += "<p>No results yet. Take a test and your performance will show here.</p>";
  } else {
    var sum = 0, best = 0;
    for (var i = 0; i < exams.length; i++) {
      sum += exams[i].total;
      if (exams[i].total > best) { best = exams[i].total; }
    }
    if (exams.length > 0) {
      html += "<div class='rev'><b>Full and quick exams:</b> " + exams.length +
        "<br><b>Average:</b> " + Math.round(sum / exams.length) + " / 400" +
        "<br><b>Best:</b> " + best + " / 400</div>";
      var totals = [];
      for (var t = exams.length - 1; t >= 0; t--) { totals.push(exams[t].total); }
      html += "<h3>Total score over time (out of 400)</h3>" + lineChart(totals, 400);
    } else {
      html += "<p>Your full and quick exam results will appear here as charts.</p>";
    }
    var subj = {};
    for (var r = 0; r < all.length; r++) {
      var m = parseMarks(all[r].marks);
      for (var s in m) {
        if (!subj[s]) { subj[s] = { sum: 0, n: 0 }; }
        subj[s].sum += m[s];
        subj[s].n++;
      }
    }
    if (Object.keys(subj).length > 0) {
      html += "<h3>Average by subject (out of 100)</h3>";
      for (var name in subj) {
        html += barRow(name, Math.round(subj[name].sum / subj[name].n), 100, subj[name].n + " test(s)");
      }
    }
    html += "<h3>Recent tests</h3>";
    var shown = all.slice(0, 10);
    for (var k2 = 0; k2 < shown.length; k2++) {
      var h = shown[k2];
      html += "<div class='rev'><b>" + esc(h.total) + " / " + esc(h.count) + "</b> (" +
        (h.mode === "full" ? "Full exam" : h.mode === "quick" ? "Quick practice" : "Subject test") + ")<br>" +
        esc(h.marks) + "<br><small>" + esc(h.date) + "</small></div>";
    }
  }
  html += "<button class='full grey' onclick='showMenu()'>Back to Home</button>";
  studyPage(html);
}

// ===== New home screen: 8 tiles =====

function showMenu() {
  clearInterval(timerId);
  document.getElementById("exam").style.display = "none";
  document.getElementById("result").innerHTML = "";
  closeModals();
  var menu = document.getElementById("menu");
  menu.style.display = "block";
  menu.innerHTML = "";
  var tiles = [
    { cls: "t1", icon: "🚀", title: "Practice for JAMB", sub: "Full exam or quick practice", go: showSetup },
    { cls: "t2", icon: "📄", title: "My Results", sub: "Track your scores", go: showHistory },
    { cls: "t3", icon: "👤", title: "My Profile", sub: "Your name and school", go: showProfile },
    { cls: "t4", icon: "📘", title: "Syllabus", sub: "Topics for every subject", go: showSyllabus },
    { cls: "t5", icon: "📝", title: "Study Notes", sub: "Notes and flashcards", go: showNotes },
    { cls: "t6", icon: "🔖", title: "My Bookmarks", sub: "Questions you saved", go: showBookmarks, bg: "#b8d8f0", fg: "#1a4f7a" },
    { cls: "t7", icon: "📊", title: "My Performance", sub: "Scores and charts", go: showPerformance, bg: "#f5c6b0", fg: "#7a3a1a" },
    { cls: "t8", icon: "🏆", title: "UTME Challenge", sub: "Compete and win prizes", go: showChallengePick, bg: "#f0c27a", fg: "#7a4a05" }
  ];
  var grid = document.createElement("div");
  grid.className = "tiles";
  for (var i = 0; i < tiles.length; i++) {
    var b = document.createElement("button");
    b.className = "tile " + tiles[i].cls;
    if (tiles[i].bg) { b.style.background = tiles[i].bg; }
    if (tiles[i].fg) { b.style.color = tiles[i].fg; }
    b.innerHTML = "<span class='ico'>" + tiles[i].icon + "</span>" + tiles[i].title + "<small>" + tiles[i].sub + "</small>";
    b.onclick = tiles[i].go;
    grid.appendChild(b);
  }
  menu.appendChild(grid);
}

showMenu();
// ===== Mock sets by year =====
var mockYear = "All";

var origStartExam = startExam;
startExam = function () {
  var changed = {};
  if (mockYear !== "All") {
    for (var n in bank) {
      var f = [];
      for (var i = 0; i < bank[n].length; i++) {
        if (bank[n][i].y === mockYear) { f.push(bank[n][i]); }
      }
      if (f.length > 0) { changed[n] = bank[n]; bank[n] = f; }
    }
  }
  try { origStartExam(); }
  finally { for (var k in changed) { bank[k] = changed[k]; } }
};

var origShowSetup = showSetup;
showSetup = function () {
  origShowSetup();
  var menu = document.getElementById("menu");
  var label = document.createElement("p");
  label.innerText = "Question set:";
  label.style.fontWeight = "bold";
  var sel = document.createElement("select");
  sel.style.cssText = "width:100%;padding:12px;font-size:16px;margin:6px 0 12px;box-sizing:border-box;";
  var opts = [["All", "All questions (mixed)"], ["1983-2004 style", "Mock: 1983-2004 style"], ["2010-2018 style", "Mock: 2010-2018 style"]];
  for (var i = 0; i < opts.length; i++) {
    var o = document.createElement("option");
    o.value = opts[i][0];
    o.innerText = opts[i][1];
    sel.appendChild(o);
  }
  sel.value = mockYear;
  sel.onchange = function () { mockYear = sel.value; };
  menu.insertBefore(sel, menu.firstChild);
  menu.insertBefore(label, sel);
};