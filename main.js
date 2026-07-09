const RELICS = [];

const LIFE_MAX = 5;
const STEP_DELAY = 1500;
const SPEED_LABELS = {
  1: "매우 느림",
  2: "느림",
  3: "보통",
  4: "빠름",
  5: "매우 빠름",
};

const DEFAULT_PLAYER = Object.freeze({
  attack: 10,
  defense: 0,
  luck: 1,
  speed: 3,
  life: LIFE_MAX,
  relics: [],
});

const app = document.querySelector("#app");

const state = {
  screen: "setup",
  players: [createPlayer(), createPlayer()],
  battle: createBattleState(),
  timers: [],
};

function createPlayer() {
  return {
    attack: DEFAULT_PLAYER.attack,
    defense: DEFAULT_PLAYER.defense,
    luck: DEFAULT_PLAYER.luck,
    speed: DEFAULT_PLAYER.speed,
    life: DEFAULT_PLAYER.life,
    relics: [],
  };
}

function createBattleState() {
  return {
    logs: [],
    attacker: null,
    defender: null,
    running: false,
    winner: null,
    phase: "전투 대기",
  };
}

function clamp(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) {
    return min;
  }
  return Math.min(max, Math.max(min, number));
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function playerName(index) {
  return `Player ${index + 1}`;
}

function clearTimers() {
  state.timers.forEach((timer) => window.clearTimeout(timer));
  state.timers = [];
}

function schedule(callback) {
  const timer = window.setTimeout(callback, STEP_DELAY);
  state.timers.push(timer);
}

function resetBattleState() {
  clearTimers();
  state.players.forEach((player) => {
    player.life = LIFE_MAX;
  });
  state.battle = createBattleState();
}

function resetAll() {
  clearTimers();
  state.screen = "setup";
  state.players = [createPlayer(), createPlayer()];
  state.battle = createBattleState();
  render();
}

function addLog(message) {
  state.battle.logs.unshift(message);
  state.battle.logs = state.battle.logs.slice(0, 8);
}

function setPhase(message) {
  state.battle.phase = message;
  addLog(message);
  render();
}

function render() {
  if (state.screen === "setup") {
    renderSetup();
    return;
  }
  renderBattle();
}

function renderSetup() {
  app.innerHTML = `
    <section class="setup-screen">
      <header class="page-header">
        <p class="eyebrow">Summer Festival</p>
        <h1>캐릭터 전투 준비</h1>
      </header>
      <div class="setup-grid">
        ${state.players.map((player, index) => renderPlayerSetup(player, index)).join("")}
      </div>
      <div class="action-bar">
        <button class="primary-action" type="button" data-action="ready">전투준비</button>
      </div>
    </section>
  `;
}

function renderPlayerSetup(player, index) {
  return `
    <section class="player-panel" aria-labelledby="player-${index + 1}-title">
      <div class="panel-heading">
        <h2 id="player-${index + 1}-title">${playerName(index)}</h2>
      </div>
      <div class="spec-stack">
        ${renderStepper(index, "attack", "공격력", 0, 20)}
        ${renderStepper(index, "defense", "방어력", 0, 20)}
        ${renderRadioSpec(index, "luck", "운", 1, 10, (value) => `${value * 10}%`)}
        ${renderRadioSpec(index, "speed", "스피드", 1, 5, (value) => SPEED_LABELS[value])}
      </div>
      <section class="relic-section">
        <h3>유물</h3>
        ${renderRelicGrid(player, index)}
      </section>
    </section>
  `;
}

function renderStepper(playerIndex, key, label, min, max) {
  const value = state.players[playerIndex][key];
  return `
    <label class="spec-row">
      <span class="spec-label">${label}</span>
      <span class="stepper">
        <button type="button" data-action="step" data-player="${playerIndex}" data-key="${key}" data-delta="-1" aria-label="${label} 감소">&lt;</button>
        <input type="number" min="${min}" max="${max}" value="${value}" data-action="input" data-player="${playerIndex}" data-key="${key}">
        <button type="button" data-action="step" data-player="${playerIndex}" data-key="${key}" data-delta="1" aria-label="${label} 증가">&gt;</button>
      </span>
    </label>
  `;
}

function renderRadioSpec(playerIndex, key, label, min, max, formatter) {
  const player = state.players[playerIndex];
  const options = [];
  for (let value = min; value <= max; value += 1) {
    const checked = player[key] === value ? "checked" : "";
    options.push(`
      <label class="radio-pill">
        <input type="radio" name="player-${playerIndex}-${key}" value="${value}" ${checked} data-action="radio" data-player="${playerIndex}" data-key="${key}">
        <span>${formatter(value)}</span>
      </label>
    `);
  }

  return `
    <fieldset class="radio-spec">
      <legend>${label}</legend>
      <div class="radio-grid">${options.join("")}</div>
    </fieldset>
  `;
}

function renderRelicGrid(player, playerIndex) {
  if (RELICS.length === 0) {
    return `<div class="empty-relics">등록된 유물 없음</div>`;
  }

  return `
    <div class="relic-grid">
      ${RELICS.map((relic) => {
        const selected = player.relics.includes(relic.id);
        return `
          <button class="relic-card ${selected ? "is-selected" : ""}" type="button" data-action="relic" data-player="${playerIndex}" data-relic="${relic.id}" aria-pressed="${selected}">
            ${relic.image ? `<img src="${relic.image}" alt="">` : `<span class="relic-placeholder"></span>`}
            <span>${relic.name}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderBattle() {
  const battle = state.battle;
  const overlay = renderBattleOverlay();
  app.innerHTML = `
    <section class="battle-screen">
      <div class="battle-stage">
        <div class="fighter fighter-left ${state.players[0].life === 0 ? "is-down" : ""}">
          <span>${playerName(0)}</span>
          ${renderLifeBar(0)}
        </div>
        <div class="battle-center">
          <p class="phase-label">${battle.phase}</p>
          <div class="log-list">
            ${battle.logs.length ? battle.logs.map((log) => `<p>${log}</p>`).join("") : "<p>전투 시작을 기다리는 중입니다.</p>"}
          </div>
        </div>
        <div class="fighter fighter-right ${state.players[1].life === 0 ? "is-down" : ""}">
          <span>${playerName(1)}</span>
          ${renderLifeBar(1)}
        </div>
        ${overlay}
      </div>
      <div class="battle-summary">
        ${state.players.map((player, index) => renderBattleSummary(player, index)).join("")}
      </div>
    </section>
  `;
}

function renderLifeBar(playerIndex) {
  const life = state.players[playerIndex].life;
  const cells = [];
  for (let i = 0; i < LIFE_MAX; i += 1) {
    cells.push(`<span class="life-cell ${i < life ? "is-filled" : ""}"></span>`);
  }
  return `<div class="life-bar" aria-label="라이프 ${life}">${cells.join("")}</div>`;
}

function renderBattleOverlay() {
  const battle = state.battle;
  if (battle.winner !== null) {
    return `
      <div class="battle-overlay">
        <h2>Player ${battle.winner + 1} Win</h2>
        <div class="overlay-actions">
          <button type="button" data-action="retry">다시하기</button>
          <button type="button" data-action="home">처음으로</button>
        </div>
      </div>
    `;
  }

  if (!battle.running) {
    return `
      <div class="battle-overlay">
        <button class="primary-action" type="button" data-action="start-battle">전투 시작</button>
      </div>
    `;
  }

  return "";
}

function renderBattleSummary(player, index) {
  return `
    <section class="summary-panel">
      <h2>${playerName(index)}</h2>
      <dl>
        <div><dt>공격력</dt><dd>${player.attack}</dd></div>
        <div><dt>방어력</dt><dd>${player.defense}</dd></div>
        <div><dt>운</dt><dd>${player.luck * 10}%</dd></div>
        <div><dt>스피드</dt><dd>${SPEED_LABELS[player.speed]}</dd></div>
        <div><dt>라이프</dt><dd>${player.life}/${LIFE_MAX}</dd></div>
        <div><dt>유물</dt><dd>${player.relics.length}</dd></div>
      </dl>
    </section>
  `;
}

function prepareBattle() {
  resetBattleState();
  state.screen = "battle";
  render();
}

function startBattle() {
  resetBattleState();
  state.battle.running = true;
  render();
  schedule(determineFirstAttacker);
}

function determineFirstAttacker() {
  const [p1, p2] = state.players;
  setPhase("선후공 결정");

  schedule(() => {
    if (p1.speed === p2.speed) {
      const first = Math.random() < 0.5 ? 0 : 1;
      state.battle.attacker = first;
      state.battle.defender = first === 0 ? 1 : 0;
      setPhase(`동일 스피드로 인한 랜덤 선공 결정: ${playerName(first)}`);
      schedule(runTurn);
      return;
    }

    const first = p1.speed > p2.speed ? 0 : 1;
    state.battle.attacker = first;
    state.battle.defender = first === 0 ? 1 : 0;
    setPhase(`${playerName(first)} 선공`);
    schedule(runTurn);
  });
}

function runTurn() {
  if (state.battle.winner !== null) {
    return;
  }

  const attackerIndex = state.battle.attacker;
  const defenderIndex = state.battle.defender;
  const attacker = state.players[attackerIndex];
  const defender = state.players[defenderIndex];
  const hitChance = clamp((attacker.attack - defender.defense) * 5, 0, 100) / 100;

  setPhase(`${playerName(attackerIndex)} 공격 성공 확률 계산: ${percent(hitChance)}`);

  schedule(() => {
    const hit = Math.random() < hitChance;
    if (!hit) {
      setPhase(`${playerName(attackerIndex)} 공격 실패`);
      schedule(swapTurn);
      return;
    }

    defender.life = Math.max(0, defender.life - 1);
    setPhase(`${playerName(attackerIndex)} 공격 성공: ${playerName(defenderIndex)} 라이프 -1`);

    if (checkWinner(defenderIndex)) {
      return;
    }

    schedule(() => {
      const bonusChance = attacker.luck / 10;
      const bonusHit = Math.random() < bonusChance;
      if (!bonusHit) {
        setPhase(`${playerName(attackerIndex)} 추가 공격 실패 (${percent(bonusChance)})`);
        schedule(swapTurn);
        return;
      }

      defender.life = Math.max(0, defender.life - 1);
      setPhase(`${playerName(attackerIndex)} 추가 공격 성공: ${playerName(defenderIndex)} 라이프 -1`);

      if (!checkWinner(defenderIndex)) {
        schedule(swapTurn);
      }
    });
  });
}

function checkWinner(defenderIndex) {
  if (state.players[defenderIndex].life > 0) {
    return false;
  }

  const winner = defenderIndex === 0 ? 1 : 0;
  schedule(() => {
    state.battle.running = false;
    state.battle.winner = winner;
    setPhase(`${playerName(defenderIndex)} 쓰러짐`);
  });
  return true;
}

function swapTurn() {
  const previousAttacker = state.battle.attacker;
  state.battle.attacker = state.battle.defender;
  state.battle.defender = previousAttacker;
  setPhase(`공수 교대: ${playerName(state.battle.attacker)} 공격`);
  schedule(runTurn);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  if (action === "step") {
    const player = state.players[Number(target.dataset.player)];
    const key = target.dataset.key;
    const delta = Number(target.dataset.delta);
    const max = key === "speed" ? 5 : 20;
    const min = key === "luck" || key === "speed" ? 1 : 0;
    player[key] = clamp(player[key] + delta, min, max);
    render();
  }

  if (action === "relic") {
    const player = state.players[Number(target.dataset.player)];
    const relicId = target.dataset.relic;
    if (player.relics.includes(relicId)) {
      player.relics = player.relics.filter((id) => id !== relicId);
    } else {
      player.relics = [...player.relics, relicId];
    }
    render();
  }

  if (action === "ready") {
    prepareBattle();
  }

  if (action === "start-battle") {
    startBattle();
  }

  if (action === "retry") {
    prepareBattle();
  }

  if (action === "home") {
    resetAll();
  }
});

function updateInputValue(target) {
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const action = target.dataset.action;
  if (action !== "input" && action !== "radio") {
    return;
  }

  const player = state.players[Number(target.dataset.player)];
  const key = target.dataset.key;
  const limits = {
    attack: [0, 20],
    defense: [0, 20],
    luck: [1, 10],
    speed: [1, 5],
  };
  const [min, max] = limits[key];
  player[key] = clamp(target.value, min, max);
  render();
}

app.addEventListener("input", (event) => {
  updateInputValue(event.target);
});

app.addEventListener("change", (event) => {
  updateInputValue(event.target);
});

app.addEventListener(
  "error",
  (event) => {
    if (!(event.target instanceof HTMLImageElement)) {
      return;
    }

    if (!event.target.closest(".relic-card")) {
      return;
    }

    const placeholder = document.createElement("span");
    placeholder.className = "relic-placeholder";
    event.target.replaceWith(placeholder);
  },
  true,
);

render();
