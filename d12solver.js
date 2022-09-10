const playgrid = new Array(3);
const player = new Object();

const boxEffects = [
    {orbs: 0, dmg: 0}, // White Box - White Border
    {orbs: -5, dmg: -5}, // White Box - Black Border
    {orbs: 0, dmg: 500}, // Black Box - White Border
    {orbs: 1, dmg: 25} // Black Box - Black Border
]
const moves = {"UP": [-1, 0], "DOWN": [1, 0], "LEFT": [0, -1], "RIGHT": [0, 1]};

let solved, alive, path, solveCalls, recursionDepth = 0;

function solve(n) {
    solveCalls++;
    recursionDepth = Math.max(recursionDepth, n + 1);
    let savedPlayer = savePlayer();
    let savedGrid = saveGrid();
    let savedPath = path.slice();

    for (let [dir, move] of Object.entries(moves)) {
        if (solved) break;

        reloadPlayer(...savedPlayer);
        reloadGrid(savedGrid);
        reloadPath(savedPath);

        if (!tryMove(move)) continue;
        updateGrid();
        applyBoxEffect();
        if (!alive) continue;

        path.push(dir);
        if (tryAttack()) break;

        solve(n + 1);
    }
}

function savePlayer() {
    return [player.hp, player.orbs, [player.pos[0], player.pos[1]]];
}

function saveGrid() {
    const grid = new Array(3);
    for (let i = 0; i < playgrid.length; i++) {
        grid[i] = new Array(3);
        for (let j = 0; j < playgrid[i].length; j++) {
            grid[i][j] = playgrid[i][j];
        }
    }
    return grid;
}

function reloadPlayer(hp, orbs, pos) {
    player.hp = hp;
    player.orbs = orbs;
    player.pos = pos;
}

function reloadGrid(grid) {
    for (let i = 0; i < playgrid.length; i++) {
        for (let j = 0; j < playgrid[i].length; j++) {
            playgrid[i][j] = grid[i][j];
        }
    }
}

function reloadPath(sPath) {
    path = [];
    for (let i = 0; i < sPath.length; i++) {
        path[i] = sPath[i];
    }
}

function tryMove(move) {
    let destination = new Array(2);
    destination[0] = player.pos[0] + move[0];
    destination[1] = player.pos[1] + move[1];
    if (destination[0] < 0 || destination[0] > 2 || destination[1] < 0 || destination[1] > 2 || playgrid[destination[0]][destination[1]] == 2) {
        return false;
    }
    player.pos = destination;
    return true;
}

function tryAttack() {
    if (player.orbs < 10 || playgrid[player.pos[0]][player.pos[1]] != 0) {
        return false;
    }
    solved = true;
    return true;
}

function applyBoxEffect() {
    player.orbs += boxEffects[playgrid[player.pos[0]][player.pos[1]]].orbs;
    player.orbs = Math.max(0, player.orbs);
    player.hp -= boxEffects[playgrid[player.pos[0]][player.pos[1]]].dmg;
    player.hp -= player.dragonDmg;
    alive = player.hp - (player.dragonDmg + boxEffects[3].dmg) * (10 - player.orbs) > 0; // check if there are still enough hp to pick up remaining orbs
}

function updateGrid() {
    for (let i = 0; i < playgrid.length; i++) {
        for (let j = 0; j < playgrid[i].length; j++) {
            if (player.pos[0] == i && player.pos[1] == j) continue;
            playgrid[i][j] = (playgrid[i][j] + 1) % 4;
        }
    }
}


const buildForm = document.querySelector("form");
const ongoingMsg = document.getElementById("ongoing");
const container = document.querySelector("main");
const pathField = document.getElementById("path");
const btnSolve = document.getElementById("solve");

buildForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    for (let i = 0; i < playgrid.length; i++) {
        playgrid[i] = new Array(3);
        for (let j = 0; j < playgrid[i].length; j++) {
            playgrid[i][j] = buildForm[`box${i}${j}`].valueAsNumber;
        }
    }

    player.def = buildForm.defense.valueAsNumber;
    player.hp = buildForm.health.valueAsNumber;
    player.orbs = 0;
    player.pos = [1, 1];
    player.dragonDmg = player.def > 700 ? 30 : 60;

    solved = false;
    alive = true;
    path = [];
    solveCalls = 0;
    recursionDepth = 0;

    btnSolve.classList.remove("hidden");
    pathField.textContent = "";
});

btnSolve.addEventListener('click', function (ev) {
    this.classList.add("hidden");
    buildForm.classList.add("hidden");
    ongoingMsg.classList.remove("hidden");
    container.classList.add("waiting");

    setTimeout(() => {
        solve(recursionDepth);
        if (solved) {
            path.push("ATTACK");
        } else {
            path = ["Aucune solution"];
        }
    
        console.log(`solveCalls=${solveCalls}`);
        console.log(`recursionDepth=${recursionDepth}`);
        console.log(player.hp);
        console.table(player.pos);
        console.table(playgrid);
    
        pathField.textContent = path.join(' - ');
        container.classList.remove("waiting");
        ongoingMsg.classList.add("hidden");
        buildForm.classList.remove("hidden");
    }, 200);
});

