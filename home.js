const storageKey = "testMatchScorerState";

const defaultPlayersA = ["Aarav Singh", "Abhimanyu Jindal", "Kabir Shah", "Vihaan Rao", "Ishaan Gill", "Reyansh Patel", "Arjun Mehta", "Dev Malhotra", "Rohan Sethi", "Neil Kapoor", "Yash Batra"];
const defaultPlayersB = ["Ethan Cole", "Liam Brooks", "Noah Grant", "Oliver Reed", "Mason Scott", "Lucas Hayes", "Henry Stone", "Jack Turner", "Leo Parker", "Max Foster", "Ryan Blake"];

const state = {
    theme: "dark",
    ambience: false,
    teams: [
        { name: "Knights XI", logo: "KNI", players: defaultPlayersA },
        { name: "Titans XI", logo: "TIT", players: defaultPlayersB }
    ],
    toss: { winner: 0, decision: "Bat" },
    day: 1,
    session: "Morning",
    activeInnings: 0,
    innings: [],
    history: [],
    playerOfMatch: ""
};

const inningsNames = ["1st Innings", "2nd Innings", "3rd Innings", "4th Innings"];
const els = {};

document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("scorer-page")) return;

    cacheElements();
    createDefaultInnings();
    bindEvents();
    loadSavedMatch(false);
    render();
});

function cacheElements() {
    [
        "themeToggle", "ambienceToggle", "saveMatch", "loadMatch", "exportScorecard", "tickerText", "matchTitle",
        "matchSubTitle", "battingBadge", "scoreMain", "oversMain", "runRate", "requiredRate", "partnershipText",
        "winProbability", "predictionText", "teamAName", "teamALogo", "teamBName", "teamBLogo", "tossWinner",
        "tossDecision", "daySelect", "sessionSelect", "inningsTabs", "teamALabel", "teamBLabel", "teamAPlayers",
        "teamBPlayers", "applyTeams", "resetMatch", "inningsName", "undoBall", "batsmanSelect", "bowlerSelect",
        "runsInput", "ballsInput", "foursInput", "sixesInput", "wicketType", "widesInput", "noballsInput",
        "byesInput", "legbyesInput", "addBall", "addManualComment", "battersTable", "bowlersTable",
        "scoreHistoryLabel", "scoreWorm", "boundaryBadge", "wagonWheel", "fowTimeline", "commentaryList",
        "leaderboards", "potmSelect", "potmCard"
    ].forEach((id) => {
        els[id] = document.getElementById(id);
    });
}

function createDefaultInnings() {
    state.innings = [0, 1, 0, 1].map((teamIndex, index) => createInnings(index, teamIndex));
}

function createInnings(index, battingTeam) {
    const bowlingTeam = battingTeam === 0 ? 1 : 0;

    return {
        id: index,
        battingTeam,
        bowlingTeam,
        runs: 0,
        wickets: 0,
        legalBalls: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        batters: state.teams[battingTeam].players.map((name) => ({
            name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            out: false,
            wicket: ""
        })),
        bowlers: state.teams[bowlingTeam].players.map((name) => ({
            name,
            balls: 0,
            maidens: 0,
            runs: 0,
            wickets: 0
        })),
        commentary: [],
        fallOfWickets: [],
        scoreHistory: [],
        boundaries: [],
        partnership: { runs: 0, balls: 0, batters: [] }
    };
}

function bindEvents() {
    els.themeToggle.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        render();
    });

    els.ambienceToggle.addEventListener("click", () => {
        state.ambience = !state.ambience;
        addCommentary(state.ambience ? "Stadium ambience switched on." : "Stadium ambience switched off.");
        render();
    });

    els.saveMatch.addEventListener("click", () => {
        localStorage.setItem(storageKey, JSON.stringify(state));
        flashTicker("Match saved to this browser.");
    });

    els.loadMatch.addEventListener("click", () => loadSavedMatch(true));
    els.exportScorecard.addEventListener("click", () => window.print());
    els.resetMatch.addEventListener("click", resetMatch);
    els.applyTeams.addEventListener("click", applyTeams);
    els.addBall.addEventListener("click", addBall);
    els.undoBall.addEventListener("click", undoBall);
    els.addManualComment.addEventListener("click", addManualComment);

    [els.teamAName, els.teamALogo, els.teamBName, els.teamBLogo, els.tossWinner, els.tossDecision, els.daySelect, els.sessionSelect].forEach((input) => {
        input.addEventListener("change", applySettings);
    });

    els.potmSelect.addEventListener("change", () => {
        state.playerOfMatch = els.potmSelect.value;
        renderPotm();
    });
}

function applySettings() {
    state.teams[0].name = els.teamAName.value.trim() || "Knights XI";
    state.teams[0].logo = (els.teamALogo.value.trim() || "KNI").slice(0, 3).toUpperCase();
    state.teams[1].name = els.teamBName.value.trim() || "Titans XI";
    state.teams[1].logo = (els.teamBLogo.value.trim() || "TIT").slice(0, 3).toUpperCase();
    state.toss.winner = Number(els.tossWinner.value);
    state.toss.decision = els.tossDecision.value;
    state.day = Number(els.daySelect.value);
    state.session = els.sessionSelect.value;
    render();
}

function applyTeams() {
    state.teams[0].players = normalizePlayers(els.teamAPlayers.value, defaultPlayersA);
    state.teams[1].players = normalizePlayers(els.teamBPlayers.value, defaultPlayersB);
    createDefaultInnings();
    state.activeInnings = 0;
    state.history = [];
    addCommentary("Playing XIs updated. Fresh innings cards generated.");
    render();
}

function normalizePlayers(value, fallback) {
    const players = value.split("\n").map((name) => name.trim()).filter(Boolean);
    const padded = [...players, ...fallback].slice(0, 11);
    return padded;
}

function resetMatch() {
    createDefaultInnings();
    state.activeInnings = 0;
    state.history = [];
    state.playerOfMatch = "";
    flashTicker("Match reset. Ready for a new Test.");
    render();
}

function getInnings() {
    return state.innings[state.activeInnings];
}

function addBall() {
    const innings = getInnings();
    const batterIndex = Number(els.batsmanSelect.value);
    const bowlerIndex = Number(els.bowlerSelect.value);
    const batter = innings.batters[batterIndex];
    const bowler = innings.bowlers[bowlerIndex];
    if (!batter || !bowler) return;

    const snapshot = JSON.stringify(state.innings);
    const runs = clampNumber(els.runsInput.value, 0, 6);
    const legalBalls = clampNumber(els.ballsInput.value, 0, 1);
    const fours = clampNumber(els.foursInput.value, 0, 1);
    const sixes = clampNumber(els.sixesInput.value, 0, 1);
    const wides = clampNumber(els.widesInput.value, 0, 20);
    const noBalls = clampNumber(els.noballsInput.value, 0, 20);
    const byes = clampNumber(els.byesInput.value, 0, 20);
    const legByes = clampNumber(els.legbyesInput.value, 0, 20);
    const wicket = els.wicketType.value;
    const extras = wides + noBalls + byes + legByes;
    const teamRuns = runs + extras;

    batter.runs += runs;
    batter.balls += legalBalls;
    batter.fours += fours;
    batter.sixes += sixes;
    innings.runs += teamRuns;
    innings.legalBalls += legalBalls;
    innings.extras.wides += wides;
    innings.extras.noBalls += noBalls;
    innings.extras.byes += byes;
    innings.extras.legByes += legByes;

    bowler.balls += legalBalls;
    bowler.runs += runs + wides + noBalls;

    innings.partnership.runs += teamRuns;
    innings.partnership.balls += legalBalls;
    innings.partnership.batters = getActiveBatters(innings).map((player) => player.name);

    if (fours || sixes) {
        innings.boundaries.push({ runs: sixes ? 6 : 4, angle: Math.floor(Math.random() * 360) });
    }

    if (wicket) {
        batter.out = true;
        batter.wicket = wicket;
        innings.wickets = Math.min(10, innings.wickets + 1);
        if (wicket !== "Run out" && wicket !== "Retired hurt") bowler.wickets += 1;
        innings.fallOfWickets.push(`${innings.runs}/${innings.wickets} - ${batter.name} (${formatOvers(innings.legalBalls)} ov)`);
        innings.partnership = { runs: 0, balls: 0, batters: getActiveBatters(innings).map((player) => player.name) };
    }

    const line = buildCommentaryLine(batter.name, bowler.name, runs, extras, wicket);
    innings.commentary.unshift({ over: formatOvers(innings.legalBalls), text: line });
    innings.scoreHistory.push({ label: formatOvers(innings.legalBalls), runs: innings.runs });
    state.history.push(snapshot);

    clearBallInputs();
    flashTicker(line);
    render();
}

function undoBall() {
    const snapshot = state.history.pop();
    if (!snapshot) {
        flashTicker("Nothing to undo yet.");
        return;
    }

    state.innings = JSON.parse(snapshot);
    flashTicker("Last ball undone.");
    render();
}

function addManualComment() {
    const text = prompt("Add commentary line");
    if (!text) return;

    addCommentary(text);
    render();
}

function addCommentary(text) {
    getInnings().commentary.unshift({ over: formatOvers(getInnings().legalBalls), text });
}

function buildCommentaryLine(batter, bowler, runs, extras, wicket) {
    if (wicket) return `${bowler} to ${batter}: OUT ${wicket}. Crowd erupts as the Test swings again.`;
    if (runs === 6) return `${bowler} to ${batter}: SIX. Massive strike into the stands.`;
    if (runs === 4) return `${bowler} to ${batter}: FOUR. Timed beautifully through the field.`;
    if (extras) return `${bowler} to ${batter}: ${extras} extras added. Pressure on the bowler.`;
    if (runs) return `${bowler} to ${batter}: ${runs} run${runs > 1 ? "s" : ""}.`;
    return `${bowler} to ${batter}: dot ball. Excellent control.`;
}

function clearBallInputs() {
    ["runsInput", "foursInput", "sixesInput", "widesInput", "noballsInput", "byesInput", "legbyesInput"].forEach((id) => {
        els[id].value = 0;
    });
    els.ballsInput.value = 1;
    els.wicketType.value = "";
}

function render() {
    document.body.classList.toggle("light-mode", state.theme === "light");
    syncInputs();
    renderInningsTabs();
    renderMainScore();
    renderSelectors();
    renderTables();
    renderVisuals();
    renderLeaderboards();
    renderPotm();
    renderIcons();
}

function syncInputs() {
    els.teamAName.value = state.teams[0].name;
    els.teamALogo.value = state.teams[0].logo;
    els.teamBName.value = state.teams[1].name;
    els.teamBLogo.value = state.teams[1].logo;
    els.teamALabel.textContent = state.teams[0].name;
    els.teamBLabel.textContent = state.teams[1].name;
    els.teamAPlayers.value = state.teams[0].players.join("\n");
    els.teamBPlayers.value = state.teams[1].players.join("\n");
    els.tossWinner.innerHTML = state.teams.map((team, index) => `<option value="${index}">${escapeHtml(team.name)}</option>`).join("");
    els.tossWinner.value = state.toss.winner;
    els.tossDecision.value = state.toss.decision;
    els.daySelect.value = state.day;
    els.sessionSelect.value = state.session;
    els.matchTitle.textContent = `${state.teams[0].name} vs ${state.teams[1].name}`;
    els.matchSubTitle.textContent = `Day ${state.day} - ${state.session} Session - Toss: ${state.teams[state.toss.winner].name} chose to ${state.toss.decision.toLowerCase()}`;
}

function renderInningsTabs() {
    els.inningsTabs.innerHTML = state.innings.map((innings, index) => `
        <button class="${index === state.activeInnings ? "active" : ""}" type="button" data-innings="${index}">
            <span>${inningsNames[index]}</span>
            <strong>${state.teams[innings.battingTeam].logo} ${innings.runs}/${innings.wickets}</strong>
        </button>
    `).join("");

    els.inningsTabs.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            state.activeInnings = Number(button.dataset.innings);
            render();
        });
    });
}

function renderMainScore() {
    const innings = getInnings();
    const battingTeam = state.teams[innings.battingTeam];
    const totals = getInningsTotals(innings);

    els.inningsName.textContent = `${inningsNames[state.activeInnings]} - ${battingTeam.name}`;
    els.battingBadge.textContent = battingTeam.logo;
    els.scoreMain.textContent = `${innings.runs}/${innings.wickets}`;
    els.oversMain.textContent = `${formatOvers(innings.legalBalls)} ov`;
    els.runRate.textContent = totals.runRate.toFixed(2);
    els.requiredRate.textContent = state.activeInnings === 3 ? calculateRequiredRate().toFixed(2) : "--";
    els.partnershipText.textContent = `${innings.partnership.runs} (${innings.partnership.balls})`;
    els.winProbability.textContent = `${calculateWinProbability()}%`;
    els.predictionText.textContent = getPrediction();
    els.tickerText.textContent = innings.commentary[0]?.text || "Ready for toss. Configure the teams and start the match.";
}

function renderSelectors() {
    const innings = getInnings();
    els.batsmanSelect.innerHTML = innings.batters.map((player, index) => `<option value="${index}" ${player.out ? "disabled" : ""}>${escapeHtml(player.name)}${player.out ? " (out)" : ""}</option>`).join("");
    els.bowlerSelect.innerHTML = innings.bowlers.map((player, index) => `<option value="${index}">${escapeHtml(player.name)}</option>`).join("");
    els.potmSelect.innerHTML = allPlayers().map((name) => `<option>${escapeHtml(name)}</option>`).join("");
    if (state.playerOfMatch) els.potmSelect.value = state.playerOfMatch;
}

function renderTables() {
    const innings = getInnings();
    els.battersTable.innerHTML = `
        <h3>Batting</h3>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Status</th></tr></thead>
                <tbody>${innings.batters.map((player) => `
                    <tr>
                        <td>${badgeFor(player)}${escapeHtml(player.name)}</td>
                        <td><input data-edit="runs" data-player="${escapeHtml(player.name)}" value="${player.runs}" type="number" min="0"></td>
                        <td><input data-edit="balls" data-player="${escapeHtml(player.name)}" value="${player.balls}" type="number" min="0"></td>
                        <td>${player.fours}</td>
                        <td>${player.sixes}</td>
                        <td>${strikeRate(player.runs, player.balls)}</td>
                        <td>${player.out ? escapeHtml(player.wicket) : "Not out"}</td>
                    </tr>
                `).join("")}</tbody>
            </table>
        </div>
    `;

    els.bowlersTable.innerHTML = `
        <h3>Bowling</h3>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
                <tbody>${innings.bowlers.map((player) => `
                    <tr>
                        <td>${escapeHtml(player.name)}</td>
                        <td>${formatOvers(player.balls)}</td>
                        <td><input data-bowler="maidens" data-player="${escapeHtml(player.name)}" value="${player.maidens}" type="number" min="0"></td>
                        <td>${player.runs}</td>
                        <td>${player.wickets}</td>
                        <td>${economy(player.runs, player.balls)}</td>
                    </tr>
                `).join("")}</tbody>
            </table>
        </div>
    `;

    bindInlineEdits();
}

function bindInlineEdits() {
    els.battersTable.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () => {
            const player = getInnings().batters.find((item) => item.name === input.dataset.player);
            if (!player) return;
            player[input.dataset.edit] = clampNumber(input.value, 0, 1000);
            recalculateInningsRuns(getInnings());
            render();
        });
    });

    els.bowlersTable.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () => {
            const player = getInnings().bowlers.find((item) => item.name === input.dataset.player);
            if (!player) return;
            player.maidens = clampNumber(input.value, 0, 200);
            render();
        });
    });
}

function renderVisuals() {
    const innings = getInnings();
    const maxScore = Math.max(innings.runs, 1);
    els.scoreHistoryLabel.textContent = `${innings.scoreHistory.length} events`;
    els.scoreWorm.innerHTML = innings.scoreHistory.length ? innings.scoreHistory.slice(-24).map((point) => `
        <span title="${point.label}: ${point.runs}" style="height:${Math.max(8, (point.runs / maxScore) * 100)}%"></span>
    `).join("") : `<p class="empty-state">Score history appears after scoring balls.</p>`;

    els.boundaryBadge.textContent = `${innings.boundaries.length} boundaries`;
    els.wagonWheel.innerHTML = `<div class="pitch-dot"></div>` + innings.boundaries.slice(-28).map((shot) => `
        <span class="shot ${shot.runs === 6 ? "six" : "four"}" style="transform: rotate(${shot.angle}deg) translateX(${shot.runs === 6 ? 106 : 82}px);"></span>
    `).join("");

    els.fowTimeline.innerHTML = innings.fallOfWickets.length ? innings.fallOfWickets.map((item) => `<div>${escapeHtml(item)}</div>`).join("") : `<p class="empty-state">Fall of wickets will appear here.</p>`;
    els.commentaryList.innerHTML = innings.commentary.length ? innings.commentary.slice(0, 12).map((item) => `<article><strong>${item.over}</strong><p>${escapeHtml(item.text)}</p></article>`).join("") : `<p class="empty-state">Ball-by-ball commentary starts after scoring.</p>`;
}

function renderLeaderboards() {
    const batters = state.innings.flatMap((innings) => innings.batters).sort((a, b) => b.runs - a.runs).slice(0, 5);
    const bowlers = state.innings.flatMap((innings) => innings.bowlers).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 5);

    els.leaderboards.innerHTML = `
        <div>
            <h3>Highest Scorers</h3>
            ${batters.map((player) => `<p><strong>${escapeHtml(player.name)}</strong><span>${player.runs} runs</span></p>`).join("")}
        </div>
        <div>
            <h3>Best Bowlers</h3>
            ${bowlers.map((player) => `<p><strong>${escapeHtml(player.name)}</strong><span>${player.wickets}/${player.runs}</span></p>`).join("")}
        </div>
    `;
}

function renderPotm() {
    const name = state.playerOfMatch || allPlayers()[0];
    state.playerOfMatch = name;
    els.potmCard.innerHTML = `<div class="avatar small">${initials(name)}</div><div><strong>${escapeHtml(name)}</strong><p>Player of the Match candidate</p></div>`;
}

function loadSavedMatch(showMessage) {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
        if (showMessage) flashTicker("No saved match found yet.");
        render();
        return;
    }

    try {
        Object.assign(state, JSON.parse(saved));
        if (showMessage) flashTicker("Saved match loaded.");
    } catch {
        flashTicker("Saved match could not be loaded.");
    }
    render();
}

function recalculateInningsRuns(innings) {
    const batRuns = innings.batters.reduce((sum, player) => sum + Number(player.runs), 0);
    const extras = innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes;
    innings.runs = batRuns + extras;
}

function getInningsTotals(innings) {
    const overs = innings.legalBalls / 6;
    return { runRate: overs ? innings.runs / overs : 0 };
}

function calculateRequiredRate() {
    const target = state.innings[0].runs + state.innings[2].runs - state.innings[1].runs + 1;
    const needed = Math.max(0, target - getInnings().runs);
    const remainingOvers = Math.max(1, 150 - getInnings().legalBalls / 6);
    return needed / remainingOvers;
}

function calculateWinProbability() {
    const innings = getInnings();
    const base = 50 + Math.min(25, innings.runs / 20) - innings.wickets * 3;
    return Math.max(5, Math.min(95, Math.round(base)));
}

function getPrediction() {
    const probability = calculateWinProbability();
    if (probability > 70) return "Batting side ahead";
    if (probability < 35) return "Bowling side hunting";
    return "Even contest";
}

function getActiveBatters(innings) {
    return innings.batters.filter((player) => !player.out).slice(0, 2);
}

function allPlayers() {
    return [...state.teams[0].players, ...state.teams[1].players];
}

function badgeFor(player) {
    if (player.runs >= 200) return `<span class="badge">Double</span>`;
    if (player.runs >= 150) return `<span class="badge">150</span>`;
    if (player.runs >= 100) return `<span class="badge">100</span>`;
    if (player.runs >= 50) return `<span class="badge">50</span>`;
    if (player.runs >= 30 && strikeRateNumber(player.runs, player.balls) >= 120) return `<span class="badge fire">On Fire</span>`;
    return "";
}

function formatOvers(balls) {
    return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function strikeRate(runs, balls) {
    return strikeRateNumber(runs, balls).toFixed(2);
}

function strikeRateNumber(runs, balls) {
    return balls ? (runs / balls) * 100 : 0;
}

function economy(runs, balls) {
    return balls ? (runs / (balls / 6)).toFixed(2) : "0.00";
}

function clampNumber(value, min, max) {
    const number = Number(value);
    if (Number.isNaN(number)) return min;
    return Math.max(min, Math.min(max, number));
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    }[char]));
}

function initials(name) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function flashTicker(text) {
    els.tickerText.textContent = text;
}

function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
}
