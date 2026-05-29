const leagueStorageKey = "abhimanyuCricketLeagues";

const defaultLeagues = [
    {
        id: createId(),
        name: "School Premier League",
        matches: [
            { runs: 42, balls: 30, date: "2026-05-10" },
            { runs: 64, balls: 44, date: "2026-05-18" },
            { runs: 21, balls: 16, date: "2026-05-25" }
        ]
    }
];

const leagueState = {
    leagues: loadLeagues(),
    selectedLeagueId: null
};

const leagueEls = {};

document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("league-page")) return;

    [
        "totalLeagues", "careerMatches", "careerRuns", "careerStrikeRate", "leagueCountBadge",
        "leagueForm", "leagueName", "leagueList", "selectedLeagueName", "clearLeagueButton",
        "leagueMatches", "leagueRuns", "leagueAverage", "leagueStrikeRate", "scoreForm",
        "runsInput", "ballsInput", "matchCountText", "matchHistory"
    ].forEach((id) => {
        leagueEls[id] = document.getElementById(id);
    });

    leagueEls.leagueForm.addEventListener("submit", addLeague);
    leagueEls.scoreForm.addEventListener("submit", addScore);
    leagueEls.clearLeagueButton.addEventListener("click", clearLeagueScores);

    saveLeagues();
    renderLeagueApp();
});

function createId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadLeagues() {
    const saved = localStorage.getItem(leagueStorageKey);
    if (!saved) return defaultLeagues;

    try {
        const leagues = JSON.parse(saved);
        return Array.isArray(leagues) ? leagues : defaultLeagues;
    } catch {
        return defaultLeagues;
    }
}

function saveLeagues() {
    localStorage.setItem(leagueStorageKey, JSON.stringify(leagueState.leagues));
}

function getSelectedLeague() {
    return leagueState.leagues.find((league) => league.id === leagueState.selectedLeagueId) || leagueState.leagues[0] || null;
}

function getTotals(matches) {
    const runs = matches.reduce((sum, match) => sum + match.runs, 0);
    const balls = matches.reduce((sum, match) => sum + match.balls, 0);
    const played = matches.length;

    return {
        played,
        runs,
        average: played ? runs / played : 0,
        strikeRate: balls ? (runs / balls) * 100 : 0
    };
}

function addLeague(event) {
    event.preventDefault();

    const name = leagueEls.leagueName.value.trim();
    if (!name) return;

    const league = {
        id: createId(),
        name,
        matches: []
    };

    leagueState.leagues.unshift(league);
    leagueState.selectedLeagueId = league.id;
    leagueEls.leagueName.value = "";
    saveLeagues();
    renderLeagueApp();
}

function addScore(event) {
    event.preventDefault();

    const league = getSelectedLeague();
    if (!league) return;

    const runs = Number(leagueEls.runsInput.value);
    const balls = Number(leagueEls.ballsInput.value);
    if (runs < 0 || balls < 1) return;

    league.matches.push({
        runs,
        balls,
        date: new Date().toISOString()
    });

    leagueEls.runsInput.value = "";
    leagueEls.ballsInput.value = "";
    saveLeagues();
    renderLeagueApp();
}

function clearLeagueScores() {
    const league = getSelectedLeague();
    if (!league) return;

    league.matches = [];
    saveLeagues();
    renderLeagueApp();
}

function renderLeagueApp() {
    if (!leagueState.selectedLeagueId && leagueState.leagues.length) {
        leagueState.selectedLeagueId = leagueState.leagues[0].id;
    }

    renderCareerStats();
    renderLeagueList();
    renderSelectedLeague();

    if (window.lucide) window.lucide.createIcons();
}

function renderCareerStats() {
    const allMatches = leagueState.leagues.flatMap((league) => league.matches);
    const totals = getTotals(allMatches);

    leagueEls.totalLeagues.textContent = leagueState.leagues.length;
    leagueEls.careerMatches.textContent = totals.played.toLocaleString("en-US");
    leagueEls.careerRuns.textContent = totals.runs.toLocaleString("en-US");
    leagueEls.careerStrikeRate.textContent = totals.strikeRate.toFixed(2);
    leagueEls.leagueCountBadge.textContent = leagueState.leagues.length;
}

function renderLeagueList() {
    leagueEls.leagueList.innerHTML = "";

    if (!leagueState.leagues.length) {
        leagueEls.leagueList.innerHTML = `<p class="empty-state">Add your first league to start tracking scores.</p>`;
        return;
    }

    leagueState.leagues.forEach((league) => {
        const totals = getTotals(league.matches);
        const button = document.createElement("button");
        button.className = `league-button${league.id === leagueState.selectedLeagueId ? " active" : ""}`;
        button.type = "button";
        button.innerHTML = `
            <span>
                <strong>${escapeHtml(league.name)}</strong>
                <small>${totals.played} matches - ${totals.runs} runs</small>
            </span>
            <i data-lucide="chevron-right"></i>
        `;
        button.addEventListener("click", () => {
            leagueState.selectedLeagueId = league.id;
            renderLeagueApp();
        });
        leagueEls.leagueList.appendChild(button);
    });
}

function renderSelectedLeague() {
    const league = getSelectedLeague();
    const hasLeague = Boolean(league);

    leagueEls.scoreForm.classList.toggle("is-disabled", !hasLeague);
    leagueEls.runsInput.disabled = !hasLeague;
    leagueEls.ballsInput.disabled = !hasLeague;
    leagueEls.clearLeagueButton.disabled = !hasLeague;

    if (!league) {
        leagueEls.selectedLeagueName.textContent = "No league yet";
        leagueEls.leagueMatches.textContent = "0";
        leagueEls.leagueRuns.textContent = "0";
        leagueEls.leagueAverage.textContent = "0.00";
        leagueEls.leagueStrikeRate.textContent = "0.00";
        leagueEls.matchCountText.textContent = "0 saved";
        leagueEls.matchHistory.innerHTML = `<p class="empty-state">Your last 5 match scores will appear here.</p>`;
        return;
    }

    const totals = getTotals(league.matches);
    leagueEls.selectedLeagueName.textContent = league.name;
    leagueEls.leagueMatches.textContent = totals.played.toLocaleString("en-US");
    leagueEls.leagueRuns.textContent = totals.runs.toLocaleString("en-US");
    leagueEls.leagueAverage.textContent = totals.average.toFixed(2);
    leagueEls.leagueStrikeRate.textContent = totals.strikeRate.toFixed(2);
    leagueEls.matchCountText.textContent = `${totals.played} saved`;

    const lastFive = league.matches.slice(-5).reverse();
    if (!lastFive.length) {
        leagueEls.matchHistory.innerHTML = `<p class="empty-state">No match scores saved in this league yet.</p>`;
        return;
    }

    leagueEls.matchHistory.innerHTML = "";
    lastFive.forEach((match, index) => {
        const strikeRate = match.balls ? (match.runs / match.balls) * 100 : 0;
        const row = document.createElement("article");
        row.className = "match-row";
        row.innerHTML = `
            <div class="match-rank">#${lastFive.length - index}</div>
            <div>
                <strong>${match.runs} runs</strong>
                <p>${match.balls} balls - SR ${strikeRate.toFixed(2)}</p>
            </div>
            <time>${new Date(match.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
        `;
        leagueEls.matchHistory.appendChild(row);
    });
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
