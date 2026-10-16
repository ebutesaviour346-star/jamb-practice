// ===== EDIT THESE SETTINGS =====
var CH = {
  name: "StudyDrill UTME Challenge",
  id: "challenge-2026-10-17",
  when: "Saturday, 17 October 2026, 10:00 AM",
  start: "2026-10-17T10:00:00+01:00",
  joinMinutes: 15,
  subjects: ["English", "Mathematics", "Physics", "Chemistry"],
  english: 30,
  other: 20,
  minutes: 60,
  prize: "Prizes for the top scorers"
};
// ===============================

var chTimer = null, chSchool = "";

function seedFrom(str) {
  var h = 1779033703 ^ str.length;
  for (var i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function rng(seed) {
  var a = seed;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rand) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function showChallenge() {
  var p = loadJSON("sd_profile", {});
  var total = CH.english + (CH.subjects.length - 1) * CH.other;
  var box = "width:100%;padding:12px;font-size:18px;margin:6px 0;box-sizing:border-box;";
  var html = "<h2>" + esc(CH.name) + "</h2>";
  html += "<div class='rev'><b>When:</b> " + esc(CH.when) + "<br><b>Subjects:</b> " + esc(CH.subjects.join(", ")) +
    "<br><b>Questions:</b> " + total + "<br><b>Time:</b> " + CH.minutes + " minutes<br><b>Prize:</b> " + esc(CH.prize) + "</div>";
  html += "<div class='rev'>Rules: everyone gets the same questions in a different order. You can start only from the start time until " +
    CH.joinMinutes + " minutes after it, and only once. Your name, school and score will be recorded.</div>";
  html += "<p id='chCount' style='font-weight:bold;color:#c62828'></p>";
  html += "<input id='chName' placeholder='Your full name' style='" + box + "'>";
  html += "<input id='chSchool' placeholder='Your school (optional)' style='" + box + "'>";
  html += "<button id='chStart' class='full orange' onclick='startChallenge()'>Start Challenge</button>";
  html += "<button class='full grey' onclick='leaveChallenge()'>Back to Home</button>";
  studyPage(html);
  document.getElementById("chName").value = p.name || "";
  document.getElementById("chSchool").value = p.school || "";
  clearInterval(chTimer);
  chTimer = setInterval(chTick, 1000);
  chTick();
}

function leaveChallenge() {
  clearInterval(chTimer);
  showMenu();
}

function chTick() {
  var el = document.getElementById("chCount");
  var btn = document.getElementById("chStart");
  if (!el || !btn) { clearInterval(chTimer); return; }
  var now = Date.now();
  var start = new Date(CH.start).getTime();
  var end = start + CH.joinMinutes * 60000;
  var open = false;
  var msg = "";
  if (now < start) {
    var s = Math.floor((start - now) / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    msg = "Starts in " + (d > 0 ? d + " day(s) " : "") + pad(h) + ":" + pad(m) + ":" + pad(s % 60);
  } else if (now <= end) {
    var left = Math.floor((end - now) / 1000);
    msg = "The challenge is OPEN. Start within " + pad(Math.floor(left / 60)) + ":" + pad(left % 60) + ".";
    open = true;
  } else {
    msg = "This challenge has closed.";
  }
  el.innerText = msg;
  btn.style.opacity = open ? "1" : "0.4";
}

function startChallenge() {
  var now = Date.now();
  var start = new Date(CH.start).getTime();
  if (now < start || now > start + CH.joinMinutes * 60000) { chTick(); return; }
  if (localStorage.getItem("sd_ch_" + CH.id)) {
    alert("You have already taken this challenge on this phone.");
    return;
  }
  var n = document.getElementById("chName").value.trim();
  var sc = document.getElementById("chSchool").value.trim();
  if (n === "") { alert("Please type your full name."); return; }
  for (var i = 0; i < CH.subjects.length; i++) {
    if (!bank[CH.subjects[i]] || bank[CH.subjects[i]].length === 0) {
      alert("The challenge questions are not ready on this phone. Refresh and try again.");
      return;
    }
  }
  savedName = n;
  chSchool = sc;
  var p = loadJSON("sd_profile", {});
  p.name = n;
  if (sc) { p.school = sc; }
  localStorage.setItem("sd_profile", JSON.stringify(p));
  localStorage.setItem("sd_ch_" + CH.id, "1");
  clearInterval(chTimer);
  mode = "challenge";
  subjects = CH.subjects.slice();
  qs = {};
  pos = {};
  for (var a = 0; a < subjects.length; a++) {
    var name = subjects[a];
    var howMany = (name === "English") ? CH.english : CH.other;
    var picked = seededShuffle(bank[name], rng(seedFrom(CH.id + name))).slice(0, howMany);
    picked = shuffle(picked);
    qs[name] = [];
    for (var j = 0; j < picked.length; j++) {
      qs[name].push({ item: picked[j], opts: shuffle(picked[j].o), choice: null, flag: false });
    }
    pos[name] = 0;
  }
  cur = 0;
  finished = false;
  seconds = CH.minutes * 60;
  document.getElementById("result").innerHTML = "";
  document.getElementById("menu").style.display = "none";
  document.getElementById("exam").style.display = "block";
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
  updateTimer();
  renderTabs();
  showQuestion();
}


var origSendResult = window.sendResult;

window.sendResult = function (total, count) {
    if (mode !== "challenge") {
        if (typeof origSendResult === "function") {
            origSendResult(total, count);
        }
        return;
    }

    // Keep the existing challenge-result submission code here.

  var parts = [];
  for (var i = 0; i < subjects.length; i++) {
    parts.push(subjects[i] + " " + scores[subjects[i]]);
  }
  var used = CH.minutes * 60 - Math.max(seconds, 0);
  var timeText = pad(Math.floor(used / 60)) + ":" + pad(used % 60);
  var data = new URLSearchParams();
  data.append("entry.1459744926", savedName + (chSchool ? " (" + chSchool + ")" : ""));
  data.append("entry.1364140056", "CHALLENGE " + CH.id + ": " + subjects.join(", "));
  data.append("entry.160759990", parts.join(", ") + " | Time " + timeText);
  data.append("entry.671808982", String(total));
  try {
    fetch(FORM_URL, { method: "POST", mode: "no-cors", body: data });
  } catch (err) {}
};
var chPicked = [];

function chAvailable() {
  var names = [];
  for (var n in bank) {
    if (n !== "English" && bank[n].length >= CH.other) { names.push(n); }
  }
  return names;
}

function chToggleHandler(name, btn) {
  return function () {
    var idx = chPicked.indexOf(name);
    if (idx >= 0) {
      chPicked.splice(idx, 1);
      btn.className = "full";
    } else if (chPicked.length < 3) {
      chPicked.push(name);
      btn.className = "full picked";
    }
    document.getElementById("chInfo").innerText = "Subjects chosen: " + chPicked.length + " / 3";
  };
}

function showChallengePick() {
  var p = loadJSON("sd_profile", {});
  var total = CH.english + 3 * CH.other;
  var box = "width:100%;padding:12px;font-size:18px;margin:6px 0;box-sizing:border-box;";
  var html = "<h2>" + esc(CH.name) + "</h2>";
  html += "<div class='rev'><b>When:</b> " + esc(CH.when) + "<br><b>Subjects:</b> English + any 3 you choose" +
    "<br><b>Questions:</b> " + total + "<br><b>Time:</b> " + CH.minutes + " minutes<br><b>Prize:</b> " + esc(CH.prize) + "</div>";
  html += "<div class='rev'>Rules: students taking the same subject get the same questions, in a different order. Ranking is by total score out of 400. You can start only from the start time until " +
    CH.joinMinutes + " minutes after it, and only once. Your name, school and score will be recorded.</div>";
  html += "<p id='chCount' style='font-weight:bold;color:#c62828'></p>";
  html += "<input id='chName' placeholder='Your full name' style='" + box + "'>";
  html += "<input id='chSchool' placeholder='Your school (optional)' style='" + box + "'>";
  html += "<p><b>Choose your 3 subjects</b> (English is compulsory)</p>";
  html += "<div class='subjGrid' id='chGrid'></div>";
  html += "<p id='chInfo'>Subjects chosen: 0 / 3</p>";
  html += "<button id='chStart' class='full orange' onclick='startChallengePick()'>Start Challenge</button>";
  html += "<button class='full grey' onclick='leaveChallenge()'>Back to Home</button>";
  studyPage(html);
  document.getElementById("chName").value = p.name || "";
  document.getElementById("chSchool").value = p.school || "";
  chPicked = [];
  var grid = document.getElementById("chGrid");
  var eng = document.createElement("button");
  eng.innerText = "English (compulsory) ✓";
  eng.className = "full locked";
  eng.style.gridColumn = "1 / span 2";
  grid.appendChild(eng);
  var names = chAvailable();
  for (var i = 0; i < names.length; i++) {
    var b = document.createElement("button");
    b.innerText = names[i];
    b.className = "full";
    b.onclick = chToggleHandler(names[i], b);
    grid.appendChild(b);
  }
  clearInterval(chTimer);
  chTimer = setInterval(chTick, 1000);
  chTick();
}

function startChallengePick() {
  var now = Date.now();
  var start = new Date(CH.start).getTime();
  if (now < start || now > start + CH.joinMinutes * 60000) { chTick(); return; }
  if (localStorage.getItem("sd_ch_" + CH.id)) {
    alert("You have already taken this challenge on this phone.");
    return;
  }
  var n = document.getElementById("chName").value.trim();
  var sc = document.getElementById("chSchool").value.trim();
  if (n === "") { alert("Please type your full name."); return; }
  if (chPicked.length !== 3) { alert("Please choose exactly 3 subjects."); return; }
  savedName = n;
  chSchool = sc;
  var p = loadJSON("sd_profile", {});
  p.name = n;
  if (sc) { p.school = sc; }
  localStorage.setItem("sd_profile", JSON.stringify(p));
  localStorage.setItem("sd_ch_" + CH.id, "1");
  clearInterval(chTimer);
  mode = "challenge";
  subjects = ["English"].concat(chPicked);
  qs = {};
  pos = {};
  for (var a = 0; a < subjects.length; a++) {
    var name = subjects[a];
    var howMany = (name === "English") ? CH.english : CH.other;
    var picked = seededShuffle(bank[name], rng(seedFrom(CH.id + name))).slice(0, howMany);
    picked = shuffle(picked);
    qs[name] = [];
    for (var j = 0; j < picked.length; j++) {
      qs[name].push({ item: picked[j], opts: shuffle(picked[j].o), choice: null, flag: false });
    }
    pos[name] = 0;
  }
  cur = 0;
  finished = false;
  seconds = CH.minutes * 60;
  document.getElementById("result").innerHTML = "";
  document.getElementById("menu").style.display = "none";
  document.getElementById("exam").style.display = "block";
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
  updateTimer();
  renderTabs();
  showQuestion();
}