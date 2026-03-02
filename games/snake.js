const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const UnSize = 25; // Slightly smaller for the 400px canvas
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
    let headX = x[0];
    let headY = y[0];
    
    let dangerLeft = false;
    let dangerStraight = false;
    let dangerRight = false;
    
    let xDirs = [0, UnSize, 0, -UnSize]; // U, R, D, L
    let yDirs = [-UnSize, 0, UnSize, 0]; 
    
    // Find current direction
    let currentDir = -1;
    if(direction === 'U') currentDir = 0;
    else if(direction === 'R') currentDir = 1;
    else if(direction === 'D') currentDir = 2;
    else if(direction === 'L') currentDir = 3;
    
    // Calculate coordinates for Straight, Right, Left
    let sX = headX + xDirs[currentDir];
    let sY = headY + yDirs[currentDir];
    
    let rIdx = (currentDir + 1) % 4;
    let rX = headX + xDirs[rIdx];
    let rY = headY + yDirs[rIdx];
    
    let lIdx = (currentDir - 1);
    if(lIdx < 0) lIdx = 3;
    let lX = headX + xDirs[lIdx];
    let lY = headY + yDirs[lIdx];
    
    // Check collisions for those 3 spots
    if(isCollision(sX, sY)) dangerStraight = true;
    if(isCollision(rX, rY)) dangerRight = true;
    if(isCollision(lX, lY)) dangerLeft = true;
    
    let foodIsLeft = false;
    let foodIsRight = false;
    let foodIsStraight = false; 
    
    // Compare Head coordinate to Apple coordinate based on direction
    if(direction === 'U') {
         if(appleX < headX) foodIsLeft = true;
         if(appleX > headX) foodIsRight = true;
         if(appleY < headY) foodIsStraight = true; 
    } else if (direction === 'R') {
         if(appleY < headY) foodIsLeft = true;
         if(appleY > headY) foodIsRight = true;
         if(appleX > headX) foodIsStraight = true; 
    } else if (direction === 'D') {
         if(appleX > headX) foodIsLeft = true;
         if(appleX < headX) foodIsRight = true;
         if(appleY > headY) foodIsStraight = true; 
    } else if (direction === 'L') {
         if(appleY > headY) foodIsLeft = true;
         if(appleY < headY) foodIsRight = true;
         if(appleX < headX) foodIsStraight = true; 
    }

    // SMART SPACE DETECTION
    let spaceLeft = 0;
    let spaceStraight = 0;
    let spaceRight = 0;

    if(!dangerLeft) spaceLeft = countFreeSpace(lX, lY);
    if(!dangerStraight) spaceStraight = countFreeSpace(sX, sY);
    if(!dangerRight) spaceRight = countFreeSpace(rX, rY);

    let maxSpaceIsLeft = (spaceLeft >= spaceStraight && spaceLeft >= spaceRight);
    let maxSpaceIsStraight = (spaceStraight > spaceLeft && spaceStraight >= spaceRight);
    let maxSpaceIsRight = (spaceRight > spaceLeft && spaceRight > spaceStraight);

    return (dangerLeft ? "1" : "0") + (dangerStraight ? "1" : "0") + (dangerRight ? "1" : "0") + 
           (foodIsLeft ? "1" : "0") + (foodIsStraight ? "1" : "0") + (foodIsRight ? "1" : "0") +
           (maxSpaceIsLeft ? "1" : "0") + (maxSpaceIsStraight ? "1" : "0") + (maxSpaceIsRight ? "1" : "0");
}

function isCollision(cX, cY) {
    // Wall?
    if (cX < 0 || cX >= ScW || cY < 0 || cY >= ScH) return true;
    // Body?
    for (let i = bodyParts - 1; i > 0; i--) {
        if (cX === x[i] && cY === y[i]) return true;
    }
    return false;
}

function countFreeSpace(startX, startY) {
    let count = 0;
    let cols = Math.floor(ScW / UnSize);
    let rows = Math.floor(ScH / UnSize);
    
    // Create a 2D array for visited nodes
    let visited = Array.from({ length: cols }, () => Array(rows).fill(false));
    let queue = [];
    
    let gridX = Math.floor(startX / UnSize);
    let gridY = Math.floor(startY / UnSize);
    
    if(gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
        queue.push({x: gridX, y: gridY});
        visited[gridX][gridY] = true;
    }

    while(queue.length > 0) {
        let p = queue.shift();
        count++;
        
        let dX = [0, 0, 1, -1];
        let dY = [1, -1, 0, 0];
        
        for(let i = 0; i < 4; i++) {
            let nX = p.x + dX[i];
            let nY = p.y + dY[i];
            
            if(nX >= 0 && nX < cols && nY >= 0 && nY < rows) {
                if(!visited[nX][nY]) {
                    let isBody = false;
                    let pixelX = nX * UnSize;
                    let pixelY = nY * UnSize;
                    
                    for(let b = 0; b < bodyParts; b++) {
                       if(x[b] === pixelX && y[b] === pixelY) {
                           isBody = true;
                           break;
                       }
                    }
                    
                    if(!isBody) {
                        visited[nX][nY] = true;
                        queue.push({x: nX, y: nY});
                    }
                }
            }
        }
    }
    return count;
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
