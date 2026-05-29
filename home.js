const storageKey = "abhimanyuCricketLeagues";

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

const state = {
    leagues: loadLeagues(),
    selectedLeagueId: null
};

const els = {
    totalLeagues: document.querySelector("#totalLeagues"),
    careerMatches: document.querySelector("#careerMatches"),
    careerRuns: document.querySelector("#careerRuns"),
    careerStrikeRate: document.querySelector("#careerStrikeRate"),
    leagueCountBadge: document.querySelector("#leagueCountBadge"),
    leagueForm: document.querySelector("#leagueForm"),
    leagueName: document.querySelector("#leagueName"),
    leagueList: document.querySelector("#leagueList"),
    selectedLeagueName: document.querySelector("#selectedLeagueName"),
    clearLeagueButton: document.querySelector("#clearLeagueButton"),
    leagueMatches: document.querySelector("#leagueMatches"),
    leagueRuns: document.querySelector("#leagueRuns"),
    leagueAverage: document.querySelector("#leagueAverage"),
    leagueStrikeRate: document.querySelector("#leagueStrikeRate"),
    scoreForm: document.querySelector("#scoreForm"),
    runsInput: document.querySelector("#runsInput"),
    ballsInput: document.querySelector("#ballsInput"),
    matchCountText: document.querySelector("#matchCountText"),
    matchHistory: document.querySelector("#matchHistory")
};

function createId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadLeagues() {
    const saved = localStorage.getItem(storageKey);

    if (!saved) {
        return defaultLeagues;
    }

    try {
        const leagues = JSON.parse(saved);
        return Array.isArray(leagues) ? leagues : defaultLeagues;
    } catch {
        return defaultLeagues;
    }
}

function saveLeagues() {
    localStorage.setItem(storageKey, JSON.stringify(state.leagues));
}

function getSelectedLeague() {
    return state.leagues.find((league) => league.id === state.selectedLeagueId) || state.leagues[0] || null;
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

function formatNumber(value) {
    return value.toLocaleString("en-US");
}

function formatDecimal(value) {
    return value.toFixed(2);
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    }[char]));
}

function renderCareerStats() {
    const allMatches = state.leagues.flatMap((league) => league.matches);
    const totals = getTotals(allMatches);

    els.totalLeagues.textContent = state.leagues.length;
    els.careerMatches.textContent = formatNumber(totals.played);
    els.careerRuns.textContent = formatNumber(totals.runs);
    els.careerStrikeRate.textContent = formatDecimal(totals.strikeRate);
    els.leagueCountBadge.textContent = state.leagues.length;
}

function renderLeagues() {
    els.leagueList.innerHTML = "";

    if (!state.leagues.length) {
        els.leagueList.innerHTML = `<p class="empty-state">Add your first league to start tracking scores.</p>`;
        return;
    }

    state.leagues.forEach((league) => {
        const totals = getTotals(league.matches);
        const button = document.createElement("button");
        button.className = `league-button${league.id === state.selectedLeagueId ? " active" : ""}`;
        button.type = "button";
        button.innerHTML = `
            <span>
                <strong>${escapeHtml(league.name)}</strong>
                <small>${totals.played} matches - ${totals.runs} runs</small>
            </span>
            <i data-lucide="chevron-right"></i>
        `;
        button.addEventListener("click", () => {
            state.selectedLeagueId = league.id;
            render();
        });

        els.leagueList.appendChild(button);
    });
}

function renderSelectedLeague() {
    const league = getSelectedLeague();
    const hasLeague = Boolean(league);

    els.scoreForm.classList.toggle("is-disabled", !hasLeague);
    els.runsInput.disabled = !hasLeague;
    els.ballsInput.disabled = !hasLeague;
    els.clearLeagueButton.disabled = !hasLeague;

    if (!league) {
        els.selectedLeagueName.textContent = "No league yet";
        els.leagueMatches.textContent = "0";
        els.leagueRuns.textContent = "0";
        els.leagueAverage.textContent = "0.00";
        els.leagueStrikeRate.textContent = "0.00";
        els.matchCountText.textContent = "0 saved";
        els.matchHistory.innerHTML = `<p class="empty-state">Your last 5 match scores will appear here.</p>`;
        return;
    }

    const totals = getTotals(league.matches);
    els.selectedLeagueName.textContent = league.name;
    els.leagueMatches.textContent = formatNumber(totals.played);
    els.leagueRuns.textContent = formatNumber(totals.runs);
    els.leagueAverage.textContent = formatDecimal(totals.average);
    els.leagueStrikeRate.textContent = formatDecimal(totals.strikeRate);
    els.matchCountText.textContent = `${totals.played} saved`;

    const lastFive = league.matches.slice(-5).reverse();
    if (!lastFive.length) {
        els.matchHistory.innerHTML = `<p class="empty-state">No match scores saved in this league yet.</p>`;
        return;
    }

    els.matchHistory.innerHTML = "";
    lastFive.forEach((match, index) => {
        const strikeRate = match.balls ? (match.runs / match.balls) * 100 : 0;
        const row = document.createElement("article");
        row.className = "match-row";
        row.innerHTML = `
            <div class="match-rank">#${lastFive.length - index}</div>
            <div>
                <strong>${match.runs} runs</strong>
                <p>${match.balls} balls - SR ${formatDecimal(strikeRate)}</p>
            </div>
            <time>${new Date(match.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
        `;
        els.matchHistory.appendChild(row);
    });
}

function renderIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function render() {
    if (!state.selectedLeagueId && state.leagues.length) {
        state.selectedLeagueId = state.leagues[0].id;
    }

    renderCareerStats();
    renderLeagues();
    renderSelectedLeague();
    renderIcons();
}

els.leagueForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = els.leagueName.value.trim();
    if (!name) return;

    const league = {
        id: createId(),
        name,
        matches: []
    };

    state.leagues.unshift(league);
    state.selectedLeagueId = league.id;
    els.leagueName.value = "";
    saveLeagues();
    render();
});

els.scoreForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const league = getSelectedLeague();
    if (!league) return;

    const runs = Number(els.runsInput.value);
    const balls = Number(els.ballsInput.value);

    if (runs < 0 || balls < 1) return;

    league.matches.push({
        runs,
        balls,
        date: new Date().toISOString()
    });

    els.runsInput.value = "";
    els.ballsInput.value = "";
    saveLeagues();
    render();
});

els.clearLeagueButton.addEventListener("click", () => {
    const league = getSelectedLeague();
    if (!league) return;

    league.matches = [];
    saveLeagues();
    render();
});

saveLeagues();
render();
