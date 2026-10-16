window.onerror = function (m, u, l) { alert("Error: " + m + " (line " + l + ")"); };
var syllabus = {};
var notesData = {};
var cardList = [], cardPos = 0, cardSide = 0, cardName = "", cardTopic = 0;

function addSyllabus(subject, lines) { syllabus[subject] = lines; }

function addNotes(subject, topics) {
  if (!notesData[subject]) { notesData[subject] = []; }
  for (var i = 0; i < topics.length; i++) {
    if (topics[i] && topics[i].t && topics[i].n) {
      notesData[subject].push(topics[i]);
    }
  }
}

function studyPage(html) {
  document.getElementById("menu").style.display = "none";
  document.getElementById("exam").style.display = "none";
  document.getElementById("result").innerHTML = html;
  window.scrollTo(0, 0);
}

function subjectNames() {
  var names = [];
  for (var n in syllabus) { names.push(n); }
  return names;
}

function showSyllabus() {
  var names = subjectNames();
  var html = "<h2>Syllabus</h2><p>Choose a subject to see its topics.</p><div class='subjGrid'>";
  for (var i = 0; i < names.length; i++) {
    html += "<button class='full' onclick=\"showSyllabusSubject('" + names[i] + "')\">" + names[i] + "</button>";
  }
  html += "</div><button class='full grey' onclick='showMenu()'>Back to Home</button>";
  studyPage(html);
}

function showSyllabusSubject(name) {
  var lines = syllabus[name] || [];
  var html = "<h2>" + esc(name) + " Syllabus</h2>";
  var n = 0;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].charAt(0) === "#") {
      html += "<h3>" + esc(lines[i].slice(1).trim()) + "</h3>";
      n = 0;
    } else {
      n++;
      html += "<div class='rev'>" + n + ". " + esc(lines[i]) + "</div>";
    }
  }
  html += "<button class='full' onclick=\"showTopics('" + name + "')\">Study notes for " + name + "</button>";
  html += "<button class='full grey' onclick='showSyllabus()'>Back</button>";
  studyPage(html);
}

function showNotes() {
  var names = subjectNames();
  var html = "<h2>Study Notes</h2><p>Choose a subject.</p><div class='subjGrid'>";
  for (var i = 0; i < names.length; i++) {
    var count = notesData[names[i]] ? notesData[names[i]].length : 0;
    html += "<button class='full' onclick=\"showTopics('" + names[i] + "')\">" + names[i] +
      "<br><small>" + (count > 0 ? count + " topics" : "coming soon") + "</small></button>";
  }
  html += "</div><button class='full grey' onclick='showMenu()'>Back to Home</button>";
  studyPage(html);
}

function showTopics(name) {
  var list = notesData[name] || [];
  var html = "<h2>" + esc(name) + " Notes</h2>";
  if (list.length === 0) { html += "<p>Notes for this subject are coming soon.</p>"; }
  for (var i = 0; i < list.length; i++) {
    html += "<button class='full' style='text-align:left' onclick=\"showNote('" + name + "'," + i + ")\">" +
      (i + 1) + ". " + esc(list[i].t) + "</button>";
  }
  if (bank[name] && bank[name].length > 0) {
    html += "<button class='full orange' onclick=\"startSubjectTest('" + name + "')\">Take a test on " + name + " (20 questions)</button>";
  }
  html += "<button class='full grey' onclick='showNotes()'>Back</button>";
  studyPage(html);
}

function showNote(name, i) {
  var item = notesData[name][i];
  var html = "<h2>" + esc(item.t) + "</h2>";
  for (var k = 0; k < item.n.length; k++) {
    html += "<div class='rev' style='white-space:pre-wrap'>" + esc(item.n[k]) + "</div>";
  }
  if (item.c && item.c.length > 0) {
    html += "<button class='full orange' onclick=\"startCards('" + name + "'," + i + ")\">Flashcards (" + item.c.length + ")</button>";
  }
  if (i + 1 < notesData[name].length) {
    html += "<button class='full' onclick=\"showNote('" + name + "'," + (i + 1) + ")\">Next topic</button>";
  }
  html += "<button class='full grey' onclick=\"showTopics('" + name + "')\">Back to topics</button>";
  studyPage(html);
}

function startCards(name, i) {
  cardName = name;
  cardTopic = i;
  cardList = shuffle(notesData[name][i].c);
  cardPos = 0;
  cardSide = 0;
  drawCard();
}

function drawCard() {
  var c = cardList[cardPos];
  var html = "<h2>Flashcards</h2><p>Card " + (cardPos + 1) + " of " + cardList.length + "</p>";
  html += "<div class='rev' style='min-height:140px;font-size:20px;text-align:center;padding-top:40px' onclick='flipCard()'>" +
    esc(cardSide === 0 ? c[0] : c[1]) + "</div>";
  html += "<p style='text-align:center'>" + (cardSide === 0 ? "Tap the card to see the answer" : "Tap the card to see the question") + "</p>";
  html += "<div class='row'><button style='flex:1' onclick='moveCard(-1)'>Previous</button><button style='flex:1' onclick='moveCard(1)'>Next</button></div>";
  html += "<button class='full grey' onclick=\"showNote('" + cardName + "'," + cardTopic + ")\">Back to notes</button>";
  studyPage(html);
}

function flipCard() { cardSide = 1 - cardSide; drawCard(); }

function moveCard(step) {
  var n = cardPos + step;
  if (n >= 0 && n < cardList.length) { cardPos = n; cardSide = 0; drawCard(); }
}

function startSubjectTest(name) {
  if (!bank[name] || bank[name].length === 0) { alert("No test questions for this subject yet."); return; }
  if (savedName === "") {
    var nm = prompt("Type your name to start the test:");
    if (!nm || nm.trim() === "") { return; }
    savedName = nm.trim();
  }
  mode = "subject";
  subjects = [name];
  qs = {};
  pos = {};
  var picked = shuffle(bank[name]).slice(0, 20);
  qs[name] = [];
  for (var j = 0; j < picked.length; j++) {
    qs[name].push({ item: picked[j], opts: shuffle(picked[j].o), choice: null, flag: false });
  }
  pos[name] = 0;
  cur = 0;
  finished = false;
  seconds = 1200;
  document.getElementById("result").innerHTML = "";
  document.getElementById("menu").style.display = "none";
  document.getElementById("exam").style.display = "block";
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
  updateTimer();
  renderTabs();
  showQuestion();
}
var checkList = [], checkPos = 0, checkRight = 0, checkName = "", checkTopic = 0, checkDone = false;

function showTopics(name) {
  var list = notesData[name] || [];
  var html = "<h2>" + esc(name) + " Notes</h2>";
  if (list.length === 0) { html += "<p>Notes for this subject are coming soon.</p>"; }
  var lastU = "";
  for (var i = 0; i < list.length; i++) {
    if (list[i].u && list[i].u !== lastU) {
      html += "<h3>" + esc(list[i].u) + "</h3>";
      lastU = list[i].u;
    }
    html += "<button class='full' style='text-align:left' onclick=\"showNote('" + name + "'," + i + ")\">" +
      (i + 1) + ". " + esc(list[i].t) + "</button>";
  }
  if (bank[name] && bank[name].length > 0) {
    html += "<button class='full orange' onclick=\"startSubjectTest('" + name + "')\">Take a test on " + name + " (20 questions)</button>";
  }
  html += "<button class='full grey' onclick='showNotes()'>Back</button>";
  studyPage(html);
}

function showNote(name, i) {
  var item = notesData[name][i];
  var html = "<h2>" + esc(item.t) + "</h2>";
  for (var k = 0; k < item.n.length; k++) {
    html += "<div class='rev' style='white-space:pre-wrap'>" + esc(item.n[k]) + "</div>";
  }
  if (item.c && item.c.length > 0) {
    html += "<button class='full' onclick=\"startCards('" + name + "'," + i + ")\">Flashcards (" + item.c.length + ")</button>";
  }
  if (item.q && item.q.length > 0) {
    html += "<button class='full orange' onclick=\"startCheck('" + name + "'," + i + ")\">Quick check (" + item.q.length + " questions)</button>";
  }
  if (i + 1 < notesData[name].length) {
    html += "<button class='full' onclick=\"showNote('" + name + "'," + (i + 1) + ")\">Next topic</button>";
  }
  html += "<button class='full grey' onclick=\"showTopics('" + name + "')\">Back to topics</button>";
  studyPage(html);
}

function startCheck(name, i) {
  checkName = name;
  checkTopic = i;
  checkList = shuffle(notesData[name][i].q);
  checkPos = 0;
  checkRight = 0;
  checkDone = false;
  drawCheck("");
}

function drawCheck(picked) {
  if (checkPos >= checkList.length) { endCheck(); return; }
  var q = checkList[checkPos];
  if (!q.opts) { q.opts = shuffle(q.o); }
  var html = "<h2>Quick check</h2><p>Question " + (checkPos + 1) + " of " + checkList.length + "</p>";
  html += "<p style='font-size:19px'>" + esc(q.q) + "</p>";
  for (var k = 0; k < q.opts.length; k++) {
    var style = "";
    if (picked !== "") {
      if (q.opts[k] === q.a) { style = "background:#2e7d32;color:#fff;"; }
      else if (q.opts[k] === picked) { style = "background:#c62828;color:#fff;"; }
    }
    html += "<button class='opt' style='" + style + "' onclick='answerCheck(" + k + ")'>" +
      String.fromCharCode(65 + k) + ".  " + esc(q.opts[k]) + "</button>";
  }
  if (picked !== "") {
    html += "<div class='rev'>" + esc(q.e || "") + "</div>";
    html += "<button class='full' onclick='nextCheck()'>" +
      (checkPos + 1 < checkList.length ? "Next question" : "See result") + "</button>";
  }
  html += "<button class='full grey' onclick=\"showNote('" + checkName + "'," + checkTopic + ")\">Back to notes</button>";
  studyPage(html);
}

function answerCheck(k) {
  if (checkDone) { return; }
  checkDone = true;
  var q = checkList[checkPos];
  if (q.opts[k] === q.a) { checkRight++; }
  drawCheck(q.opts[k]);
}

function nextCheck() {
  checkPos++;
  checkDone = false;
  drawCheck("");
}

function endCheck() {
  var html = "<h2>Quick check done</h2><p><b>You scored " + checkRight + " out of " + checkList.length + "</b></p>";
  html += "<button class='full orange' onclick=\"startCheck('" + checkName + "'," + checkTopic + ")\">Try again</button>";
  if (checkTopic + 1 < notesData[checkName].length) {
    html += "<button class='full' onclick=\"showNote('" + checkName + "'," + (checkTopic + 1) + ")\">Next topic</button>";
  }
  html += "<button class='full grey' onclick=\"showNote('" + checkName + "'," + checkTopic + ")\">Back to notes</button>";
  studyPage(html);
}