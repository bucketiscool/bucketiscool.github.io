const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const UnSize = 20; // Slightly smaller for the 400px canvas
const ScW = 400;
const ScH = 400;

let x = [];
let y = [];
let bodyParts = 6;
let applesEaten = 0;
let appleX, appleY;
let direction = 'R';
let running = true;
let qTable = {};

// Load your trained brain (snake_brain.json)
fetch('snake_brain.json')
    .then(res => res.json())
    .then(data => { qTable = data; console.log("Memory loaded!"); })
    .catch(() => console.log("Running as baby snake (No memory found)"));

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

function getEnvironmentState() {
    // Matches your Java code exactly
    let state = "";
    state += checkDanger('S') ? "1" : "0";
    state += checkDanger('L') ? "1" : "0";
    state += checkDanger('R') ? "1" : "0";
    state += (appleY < y[0]) ? "1" : "0";
    state += (appleY > y[0]) ? "1" : "0";
    state += (appleX < x[0]) ? "1" : "0";
    state += (appleX > x[0]) ? "1" : "0";
    state += (direction === 'U' || direction === 'D') ? "1" : "0";
    state += (direction === 'L' || direction === 'R') ? "1" : "0";
    return state;
}

function checkDanger(dirType) {
    let tX = x[0], tY = y[0], tD = direction;
    if (dirType === 'L') {
        if (direction === 'U') tD = 'L';
        else if (direction === 'D') tD = 'R';
        else if (direction === 'L') tD = 'D';
        else if (direction === 'R') tD = 'U';
    } else if (dirType === 'R') {
        if (direction === 'U') tD = 'R';
        else if (direction === 'D') tD = 'L';
        else if (direction === 'L') tD = 'U';
        else if (direction === 'R') tD = 'D';
    }
    if (tD === 'U') tY -= UnSize;
    if (tD === 'D') tY += UnSize;
    if (tD === 'L') tX -= UnSize;
    if (tD === 'R') tX += UnSize;
    if (tX < 0 || tX >= ScW || tY < 0 || tY >= ScH) return true;
    for (let i = 1; i < bodyParts; i++) if (tX === x[i] && tY === y[i]) return true;
    return false;
}

function move() {
    let state = getEnvironmentState();
    let actions = qTable[state] || [0.0, 0.0, 0.0];
    let action = actions.indexOf(Math.max(...actions));

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

    for (let i = bodyParts; i > 0; i--) { x[i] = x[i-1]; y[i] = y[i-1]; }
    if (direction === 'U') y[0] -= UnSize;
    if (direction === 'D') y[0] += UnSize;
    if (direction === 'L') x[0] -= UnSize;
    if (direction === 'R') x[0] += UnSize;
}

function gameLoop() {
    if (running) {
        move();
        if (x[0] === appleX && y[0] === appleY) { bodyParts++; applesEaten++; newApple(); }
        if (x[0] < 0 || x[0] >= ScW || y[0] < 0 || y[0] >= ScH) running = false;
        for (let i = 1; i < bodyParts; i++) if (x[0] === x[i] && y[0] === y[i]) running = false;
        
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, ScW, ScH);
        ctx.fillStyle = "red"; ctx.fillRect(appleX, appleY, UnSize, UnSize);
        for (let i = 0; i < bodyParts; i++) {
            ctx.fillStyle = i === 0 ? "#22c55e" : "#166534";
            ctx.fillRect(x[i], y[i], UnSize, UnSize);
        }
    } else { initGame(); }
}

initGame();
setInterval(gameLoop, 80);
function resetGame() { initGame(); }
