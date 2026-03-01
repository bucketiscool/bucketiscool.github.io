const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');

// Constants from your GamePanel.java
const UnSize = 20;
const ScW = 400;
const ScH = 400;
const HamCyc = 100; // Switch to God Mode at 100

let x = [100, 80, 60, 40, 20];
let y = [100, 100, 100, 100, 100];
let bodyParts = 5;
let applesEaten = 0;
let appleX, appleY;
let direction = 'R';
let running = true;
let qTable = {};

// Translation of your SnakeAgent.java logic
function getAction(state) {
    if (!qTable[state]) qTable[state] = [0.0, 0.0, 0.0];
    // Exploitation (Getting best known move)
    let actions = qTable[state];
    return actions.indexOf(Math.max(...actions));
}

function move(action) {
    const directions = ['U', 'R', 'D', 'L'];
    let currentIdx = directions.indexOf(direction);

    if (action === 0) { // Turn Left
        currentIdx = (currentIdx - 1 < 0) ? 3 : currentIdx - 1;
    } else if (action === 2) { // Turn Right
        currentIdx = (currentIdx + 1) % 4;
    }
    direction = directions[currentIdx];

    for (let i = bodyParts; i > 0; i--) {
        x[i] = x[i - 1];
        y[i] = y[i - 1];
    }

    if (direction === 'U') y[0] -= UnSize;
    if (direction === 'D') y[0] += UnSize;
    if (direction === 'L') x[0] -= UnSize;
    if (direction === 'R') x[0] += UnSize;
}

// Your Hamiltonian "God Mode" logic
function getHamiltonianMove(headX, headY) {
    let xInd = headX / UnSize;
    let yInd = headY / UnSize;
    let maxCols = ScW / UnSize;
    let maxRows = ScH / UnSize;

    if (xInd === 0) {
        if (yInd === 0) return 1; // Right
        return 0; // Up
    }
    if (yInd === maxRows - 1) return 3; // Left
    if (xInd % 2 !== 0) {
        if (yInd === maxRows - 2) return (xInd === maxCols - 1) ? 2 : 1;
        return 2; // Down
    } else {
        return (yInd > 0) ? 0 : 1; // Up or Right
    }
}

function gameLoop() {
    if (running) {
        let action;
        if (applesEaten > HamCyc) {
            action = getHamiltonianMove(x[0], y[0]);
        } else {
            action = getAction(getEnvironmentState());
        }
        
        move(action);
        checkApple();
        checkCollisions();
        draw();
    } else {
        resetGame();
    }
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ScW, ScH);
    
    // Apple
    ctx.fillStyle = "red";
    ctx.fillRect(appleX, appleY, UnSize, UnSize);

    // Snake
    x.forEach((pos, i) => {
        ctx.fillStyle = (i === 0) ? "#22c55e" : "#166534";
        ctx.fillRect(x[i], y[i], UnSize, UnSize);
    });
}

function newApple() {
    appleX = Math.floor(Math.random() * (ScW / UnSize)) * UnSize;
    appleY = Math.floor(Math.random() * (ScH / UnSize)) * UnSize;
}

function checkApple() {
    if (x[0] === appleX && y[0] === appleY) {
        bodyParts++;
        applesEaten++;
        newApple();
    }
}

function checkCollisions() {
    if (x[0] < 0 || x[0] >= ScW || y[0] < 0 || y[0] >= ScH) running = false;
    for (let i = 1; i < bodyParts; i++) {
        if (x[0] === x[i] && y[0] === y[i]) running = false;
    }
}

function resetGame() {
    x = [100, 80, 60, 40, 20];
    y = [100, 100, 100, 100, 100];
    bodyParts = 5;
    applesEaten = 0;
    direction = 'R';
    running = true;
    newApple();
}

newApple();
setInterval(gameLoop, 75);
