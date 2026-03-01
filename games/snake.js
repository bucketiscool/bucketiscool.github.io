const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const modeDisplay = document.getElementById('modeDisplay');

// Java Project Constants
const UnSize = 25;
const ScW = 600;
const ScH = 600;
const HamCyc = 200; // Switches to Hamiltonian at 200 as per your Java code

let x = new Array(600).fill(0);
let y = new Array(600).fill(0);
let bodyParts = 6;
let applesEaten = 0;
let appleX, appleY;
let direction = 'R';
let running = true;
let qTable = {};

// Load your trained brain
fetch('snake_brain.json')
    .then(response => response.json())
    .then(data => {
        qTable = data;
        console.log("87k Gen Brain Loaded Successfully");
    })
    .catch(err => console.error("Could not load brain, using default. Error:", err));

function initGame() {
    running = true;
    bodyParts = 6;
    applesEaten = 0;
    direction = 'R';
    for(let i=0; i<bodyParts; i++) {
        x[i] = 100 - (i * UnSize);
        y[i] = 100;
    }
    newApple();
}

function newApple() {
    appleX = Math.floor(Math.random() * (ScW / UnSize)) * UnSize;
    appleY = Math.floor(Math.random() * (ScH / UnSize)) * UnSize;
}

// Logic from your SnakeAgent.java
function getBestAction(state) {
    let actions = qTable[state] || [0.0, 0.0, 0.0];
    let bestAction = 0;
    let maxVal = actions[0];
    for (let i = 1; i < 3; i++) {
        if (actions[i] > maxVal) {
            maxVal = actions[i];
            bestAction = i;
        }
    }
    return bestAction;
}

// State string logic 1:1 with your GamePanel.java
function getEnvironmentState() {
    let state = "";
    // Danger: Straight, Left, Right
    state += checkDanger('S') ? "1" : "0";
    state += checkDanger('L') ? "1" : "0";
    state += checkDanger('R') ? "1" : "0";
    // Food: Up, Down, Left, Right
    state += (appleY < y[0]) ? "1" : "0";
    state += (appleY > y[0]) ? "1" : "0";
    state += (appleX < x[0]) ? "1" : "0";
    state += (appleX > x[0]) ? "1" : "0";
    // Moving: Up/Down or Left/Right
    state += (direction === 'U' || direction === 'D') ? "1" : "0";
    state += (direction === 'L' || direction === 'R') ? "1" : "0";
    return state;
}

function checkDanger(dirType) {
    let testX = x[0], testY = y[0];
    let testDir = direction;

    if (dirType === 'L') {
        if (direction === 'U') testDir = 'L';
        else if (direction === 'D') testDir = 'R';
        else if (direction === 'L') testDir = 'D';
        else if (direction === 'R') testDir = 'U';
    } else if (dirType === 'R') {
        if (direction === 'U') testDir = 'R';
        else if (direction === 'D') testDir = 'L';
        else if (direction === 'L') testDir = 'U';
        else if (direction === 'R') testDir = 'D';
    }

    if (testDir === 'U') testY -= UnSize;
    if (testDir === 'D') testY += UnSize;
    if (testDir === 'L') testX -= UnSize;
    if (testDir === 'R') testX += UnSize;

    if (testX < 0 || testX >= ScW || testY < 0 || testY >= ScH) return true;
    for (let i = 1; i < bodyParts; i++) {
        if (testX === x[i] && testY === y[i]) return true;
    }
    return false;
}

function move() {
    let action;
    if (applesEaten >= HamCyc) {
        modeDisplay.innerText = "Hamiltonian Cycle";
        modeDisplay.className = "font-bold text-blue-600";
        action = getHamiltonianAction();
    } else {
        modeDisplay.innerText = "Q-Learning AI";
        modeDisplay.className = "font-bold text-green-600";
        let state = getEnvironmentState();
        action = getBestAction(state);
    }

    // Convert relative action (0=L, 1=S, 2=R) to absolute direction
    if (action === 0) { // Left
        if (direction === 'U') direction = 'L';
        else if (direction === 'D') direction = 'R';
        else if (direction === 'L') direction = 'D';
        else if (direction === 'R') direction = 'U';
    } else if (action === 2) { // Right
        if (direction === 'U') direction = 'R';
        else if (direction === 'D') direction = 'L';
        else if (direction === 'L') direction = 'U';
        else if (direction === 'R') direction = 'D';
    }

    for (let i = bodyParts; i > 0; i--) {
        x[i] = x[i - 1];
        y[i] = y[i - 1];
    }

    if (direction === 'U') y[0] -= UnSize;
    if (direction === 'D') y[0] += UnSize;
    if (direction === 'L') x[0] -= UnSize;
    if (direction === 'R') x[0] += UnSize;
}

function getHamiltonianAction() {
    let xInd = x[0] / UnSize;
    let yInd = y[0] / UnSize;
    let maxCols = ScW / UnSize;
    let maxRows = ScH / UnSize;

    let targetDir;
    if (xInd === 0) {
        targetDir = (yInd === 0) ? 'R' : 'U';
    } else if (yInd === maxRows - 1) {
        targetDir = 'L';
    } else if (xInd % 2 !== 0) {
        targetDir = (yInd === maxRows - 2) ? 'R' : 'D';
    } else {
        targetDir = (yInd === 0) ? 'R' : 'U';
    }

    // Convert absolute targetDir to relative action (0, 1, 2)
    if (targetDir === direction) return 1;
    // Simple logic for L/R turn detection
    return 0; 
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ScW, ScH);

    ctx.fillStyle = "red";
    ctx.fillRect(appleX, appleY, UnSize, UnSize);

    for (let i = 0; i < bodyParts; i++) {
        ctx.fillStyle = (i === 0) ? "#22c55e" : "#166534";
        ctx.fillRect(x[i], y[i], UnSize, UnSize);
    }
}

function checkApple() {
    if (x[0] === appleX && y[0] === appleY) {
        bodyParts++;
        applesEaten++;
        scoreDisplay.innerText = applesEaten;
        newApple();
    }
}

function checkCollisions() {
    if (x[0] < 0 || x[0] >= ScW || y[0] < 0 || y[0] >= ScH) running = false;
    for (let i = 1; i < bodyParts; i++) {
        if (x[0] === x[i] && y[0] === y[i]) running = false;
    }
}

function gameLoop() {
    if (running) {
        move();
        checkApple();
        checkCollisions();
        draw();
    }
}

function resetGame() {
    initGame();
}

initGame();
setInterval(gameLoop, 75);
