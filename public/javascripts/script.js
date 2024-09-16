// Canvas Related
const { body } = document;
const socket = io("/pong");
let isReferee = false;
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const gameOverEl = document.createElement("div");
let paddleIndex = 0;

let width = 500;
let height = 700;

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [225, 225];
let trajectoryX = [0, 0];
let playerMoved = false;

// Ball (this is used to amke the ball )
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;
let computerSpeed = 4;

// Score for Both Players
let score = [0, 0];
const winningScore = 7;
let isGameOver = true;
let isNewGame = true;

// Create Canvas Element
function createCanvas() {
  // canvas.id = 'canvas';
  canvas.width = width;
  canvas.height = height;
  body.appendChild(canvas);
  //document.body.appendChild(canvas);
  renderCanvas();
}

// Wait for Opponents
function renderIntro() {
  console.log("Freaking hell");
  // Canvas Background
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = "white";
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, canvas.height / 2 - 30);
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = "white";

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = "grey";
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = "white";
  context.fill();

  // Score
  context.font = "32px Courier New";
  context.fillText(score[0], 20, canvas.height / 2 + 50);
  context.fillText(score[1], 20, canvas.height / 2 - 30);
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;
  socket.emit("ballMove", {
    ballX,
    ballY,
    score,
  });
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }
  socket.emit("ballMove", {
    ballX,
    ballY,
    score,
  });
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      // Reset Ball, Increase Computer Difficulty, add to Player Score
      if (computerSpeed < 6) {
        computerSpeed += 0.5;
      }
      ballReset();
      score[0]++;
    }
  }
}

function showGameOverEl(winner) {
  // Hide Canvas
  canvas.hidden = true;
  // Container
  gameOverEl.textContent = "";
  gameOverEl.classList.add("game-over-container");
  // Title
  const title = document.createElement("h1");
  title.textContent = `${winner} Wins!`;
  // Button
  const playAgainBtn = document.createElement("button");
  playAgainBtn.setAttribute("onclick", "startGame()");
  playAgainBtn.textContent = "Play Again";
  // Append
  gameOverEl.append(title, playAgainBtn);
  body.appendChild(gameOverEl);
}

// Check If One Player Has Winning Score, If They Do, End Game
function gameOver() {
  if (score[0] === winningScore || score[1] === winningScore) {
    isGameOver = true;
    // Set Winner
    const winner = score[0] >= score[1] ? "Player 1" : "Player 2";
    showGameOverEl(winner);
  }
}

// Called Every Frame
function animate() {
  if (isReferee) {
    ballMove();
    ballBoundaries();
  }
  renderCanvas();
  gameOver();
  if (!isGameOver) {
    window.requestAnimationFrame(animate);
  }
}

function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit("ready");
}

// Start Game, Reset Everything
function startGame() {
  if (isGameOver && !isNewGame) {
    body.removeChild(gameOverEl);
    canvas.hidden = false;
  }
  isGameOver = false;
  isNewGame = false;
  score[0] = 0;
  score[1] = 0;
  ballReset();
  animate();

  paddleIndex = isReferee ? 0 : 1;
  window.requestAnimationFrame(animate);
  canvas.addEventListener("mousemove", (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > width - paddleWidth) {
      paddleX[paddleIndex] = width - paddleWidth;
    }
    socket.emit("paddleMove", {
      xPosition: paddleX[paddleIndex],
    });
    // Hide Cursor
    canvas.style.cursor = "none";
  });
}

// On Load
loadGame();

socket.on("connect");

socket.on("connect", () => {
  console.log("Connected as...", socket.id);
});

// This we will have to do if two players have joined
// Default Function
socket.on("startGame", (refereeId) => {
  console.log("Referee is", refereeId);

  isReferee = socket.id === refereeId;
  startGame();
});

// This will come in from the socket server only for the none referee that is how we
// will send from our server
socket.on("paddleMove", (paddleData) => {
  // Toggle 1 into 0, and 0 into 1
  const opponentPaddleIndex = 1 - paddleIndex;
  paddleX[opponentPaddleIndex] = paddleData.xPosition;
});

// This will come in only for the none referee that is how we
// will send from our server
socket.on("ballMove", (ballData) => {
  ({ ballX, ballY, score } = ballData);
});
