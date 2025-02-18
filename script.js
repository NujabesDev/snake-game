const board = document.getElementById('game-board'); 
const instructionText = document.getElementById('instruction-text');

// game state variables
let direction = 'right'; // current snake movement direction
let directionQueue = []; // queue to buffer user direction inputs
let gameInterval; // reference to the game loop interval
let gameSpeedDelay = 150; // delay in ms between moves (lower means faster)
let gameStarted = false; // flag to indicate if the game is running
let snake = []; // array holding snake segments (each with x,y coordinates)
let food; // current food position on the grid
let gameGrid = { cols: 0, rows: 0 }; // grid dimensions

// ---------- drawing functions ----------

function draw() {
  // clear the board and redraw snake and food for the current frame
  board.innerHTML = '';
  drawSnake();
  drawFood();
}

function drawSnake() {
  // iterate over each snake segment and create a corresponding element
  snake.forEach(segment => {
    const snakeElement = createGameElement('div', 'snake');
    setPosition(snakeElement, segment);
    board.appendChild(snakeElement);
  });
}

function createGameElement(tag, className) {
  // create an html element with a given tag and class
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

function setPosition(element, position) {
  // set the grid column and row for an element based on its position
  element.style.gridColumn = position.x;
  element.style.gridRow = position.y;
}

function drawFood() {
  // draw the food element on the board if the game has started
  if (gameStarted) {
    const foodElement = createGameElement('div', 'food');
    setPosition(foodElement, food);
    board.appendChild(foodElement);
  }
}

// ---------- game logic functions ----------

function generateFood() {
  // randomly generate a food position that does not overlap the snake
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * gameGrid.cols) + 1,
      y: Math.floor(Math.random() * gameGrid.rows) + 1,
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
  return newFood;
}

function move() {
  // process one queued input if available to update the snake's direction
  if (directionQueue.length) {
    direction = directionQueue.shift();
  }
  // clone the current head to calculate the new head position
  const head = { ...snake[0] };
  // update head position based on current direction
  switch (direction) {
    case 'up':
      head.y--;
      break;
    case 'down':
      head.y++;
      break;
    case 'left':
      head.x--;
      break;
    case 'right':
      head.x++;
      break;
  }
  // add new head to the beginning of the snake array
  snake.unshift(head);

  // if snake eats food, generate new food and speed up; otherwise, remove tail segment
  if (head.x === food.x && head.y === food.y) {
    food = generateFood();
    increaseSpeed();
    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      move();
      checkCollision();
      draw();
    }, gameSpeedDelay);
  } else {
    snake.pop();
  }
}

function startGame() {
  // initialize game state and start the game loop
  gameStarted = true;
  instructionText.style.display = 'none'; // hide instructions once game starts
  directionQueue = [];
  
  gameInterval = setInterval(() => {
    move();
    checkCollision();
    draw();
  }, gameSpeedDelay);
}

function handleKeyPress(event) {
  // start game on space key if it hasn't started yet
  if (!gameStarted && (event.code === 'Space' || event.key === ' ')) {
    startGame();
    return;
  }

  // determine new direction based on arrow keys
  let newDirection;
  switch (event.key) {
    case 'ArrowUp':
      newDirection = 'up';
      break;
    case 'ArrowDown':
      newDirection = 'down';
      break;
    case 'ArrowLeft':
      newDirection = 'left';
      break;
    case 'ArrowRight':
      newDirection = 'right';
      break;
    default:
      return; // ignore other keys
  }

  // get the effective current direction (from queue if available)
  const currentEffectiveDirection = directionQueue.length ? directionQueue[0] : direction;
  const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };

  // only enqueue the new direction if it isn't directly opposite the current one
  if (newDirection !== opposites[currentEffectiveDirection]) {
    directionQueue.push(newDirection);
  }
}

document.addEventListener('keydown', handleKeyPress);

function increaseSpeed() {
  // gradually reduce the delay to increase game speed, with different steps
  if (gameSpeedDelay > 100) {
    gameSpeedDelay -= 5;
  } else if (gameSpeedDelay > 75) {
    gameSpeedDelay -= 3;
  } else if (gameSpeedDelay > 50) {
    gameSpeedDelay -= 2;
  } else if (gameSpeedDelay > 25) {
    gameSpeedDelay -= 1;
  }
}

function updateGrid() {
  // calculate grid dimensions based on the current window size
  const viewportRatio = window.innerWidth / window.innerHeight;
  const baseSize = Math.min(window.innerWidth, window.innerHeight);
  const cellCount = Math.floor(baseSize / 15);

  let cols, rows;
  // adjust number of columns and rows based on the aspect ratio
  if (viewportRatio > 1) {
    cols = Math.round(cellCount * viewportRatio);
    rows = cellCount;
  } else {
    cols = cellCount;
    rows = Math.round(cellCount / viewportRatio);
  }
  // set grid template properties for the board
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gameGrid.cols = cols;
  gameGrid.rows = rows;
}

function checkCollision() {
  // check if the snake's head collides with the walls or its own body
  const head = snake[0];
  if (head.x < 1 || head.x > gameGrid.cols || head.y < 1 || head.y > gameGrid.rows) {
    resetGame();
  }
  // check collision with snake body (skip the head)
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      resetGame();
    }
  }
}

function resetGame() {
  // stop the game and reset all variables to initial state
  stopGame();
  const startX = Math.floor(gameGrid.cols / 2);
  const startY = Math.floor(gameGrid.rows / 2);
  snake = [{ x: startX, y: startY }]; // start snake at center of grid
  food = generateFood(); // place the first food item
  direction = 'right'; // reset direction
  gameSpeedDelay = 150; // reset speed delay
  directionQueue = []; // clear any queued directions
}

function stopGame() {
  // clear the game loop and show the instruction overlay
  clearInterval(gameInterval);
  gameStarted = false;
  instructionText.style.display = 'block';
}

window.addEventListener('resize', () => {
  // update grid dimensions and reset game when window size changes
  updateGrid();
  resetGame();
});

// initial grid setup and game reset
updateGrid();
resetGame();
