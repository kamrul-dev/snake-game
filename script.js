document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const GRID_SIZE = 20;
    const CELL_SIZE = 20;
    const DIRECTIONS = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    };
    const DIFFICULTY = {
        easy: 100,
        medium: 75,
        hard: 50,
        expert: 30
    };

    // Game elements
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const restartButton = document.getElementById('restart-button');
    const gameOverlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMessage = document.getElementById('overlay-message');
    const difficultySelect = document.getElementById('difficulty');

    // Game state
    let snake = [];
    let food = {};
    let direction = DIRECTIONS.RIGHT;
    let nextDirection = DIRECTIONS.RIGHT;
    let gameInterval;
    let isPaused = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameSpeed = DIFFICULTY.medium;

    // Initialize game
    function initGame() {
        // Set canvas size based on grid
        const size = GRID_SIZE * CELL_SIZE;
        canvas.width = size;
        canvas.height = size;
        
        // Initialize snake
        const startX = Math.floor(GRID_SIZE / 2);
        const startY = Math.floor(GRID_SIZE / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        // Initial direction
        direction = DIRECTIONS.RIGHT;
        nextDirection = DIRECTIONS.RIGHT;
        
        // Generate first food
        generateFood();
        
        // Reset score
        score = 0;
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
        
        // Set game speed
        gameSpeed = DIFFICULTY[difficultySelect.value];
    }

    // Generate food at random position
    function generateFood() {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (snake.some(segment => segment.x === position.x && segment.y === position.y));
        
        food = position;
    }

    // Main game loop
    function gameLoop() {
        if (isPaused) return;
        
        // Move snake
        moveSnake();
        
        // Check collisions
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // Check if snake ate food
        if (snake[0].x === food.x && snake[0].y === food.y) {
            // Increase score
            score++;
            scoreElement.textContent = score;
            
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Generate new food
            generateFood();
        } else {
            // Remove tail if no food eaten
            snake.pop();
        }
        
        // Draw everything
        drawGame();
    }

    // Move snake based on direction
    function moveSnake() {
        direction = nextDirection;
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;
        snake.unshift(head);
    }

    // Check for collisions
    function checkCollision() {
        const head = snake[0];
        
        // Wall collision
        if (
            head.x < 0 || head.x >= GRID_SIZE ||
            head.y < 0 || head.y >= GRID_SIZE
        ) {
            return true;
        }
        
        // Self collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    // Draw game elements
    function drawGame() {
        // Clear canvas
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }
        
        // Draw snake
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#2E7D32' : '#4CAF50'; // Darker head
            ctx.strokeStyle = '#1B5E20';
            ctx.lineWidth = 1;
            
            // Draw rounded segments
            const x = segment.x * CELL_SIZE;
            const y = segment.y * CELL_SIZE;
            const radius = CELL_SIZE / 2;
            
            ctx.beginPath();
            ctx.arc(x + radius, y + radius, radius - 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw eyes on head
            if (index === 0) {
                ctx.fillStyle = 'white';
                const eyeSize = CELL_SIZE / 5;
                
                // Calculate eye positions based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                
                if (direction === DIRECTIONS.RIGHT) {
                    leftEyeX = x + CELL_SIZE - eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + CELL_SIZE - eyeSize * 2;
                    rightEyeY = y + CELL_SIZE - eyeSize * 2;
                } else if (direction === DIRECTIONS.LEFT) {
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + eyeSize * 2;
                    rightEyeY = y + CELL_SIZE - eyeSize * 2;
                } else if (direction === DIRECTIONS.UP) {
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + CELL_SIZE - eyeSize * 2;
                    rightEyeY = y + eyeSize * 2;
                } else { // DOWN
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + CELL_SIZE - eyeSize * 2;
                    rightEyeX = x + CELL_SIZE - eyeSize * 2;
                    rightEyeY = y + CELL_SIZE - eyeSize * 2;
                }
                
                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw food
        ctx.fillStyle = '#F44336';
        ctx.strokeStyle = '#D32F2F';
        ctx.lineWidth = 1;
        
        const foodX = food.x * CELL_SIZE;
        const foodY = food.y * CELL_SIZE;
        const foodRadius = CELL_SIZE / 2 - 2;
        
        // Draw apple-like food with stem
        ctx.beginPath();
        ctx.arc(foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, foodRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Stem
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(foodX + CELL_SIZE / 2, foodY + 2);
        ctx.lineTo(foodX + CELL_SIZE / 2 - 3, foodY - 2);
        ctx.stroke();
        
        // Leaf
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.ellipse(
            foodX + CELL_SIZE / 2 + 2, 
            foodY - 1, 
            3, 
            2, 
            Math.PI / 4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }

    // Start game
    function startGame() {
        initGame();
        gameOverlay.style.display = 'none';
        pauseButton.disabled = false;
        
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        
        gameInterval = setInterval(gameLoop, gameSpeed);
    }

    // Pause game
    function togglePause() {
        isPaused = !isPaused;
        
        if (isPaused) {
            clearInterval(gameInterval);
            pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume';
            showOverlay('Game Paused', 'Press resume to continue');
        } else {
            gameInterval = setInterval(gameLoop, gameSpeed);
            pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
            gameOverlay.style.display = 'none';
        }
    }

    // Game over
    function gameOver() {
        clearInterval(gameInterval);
        pauseButton.disabled = true;
        
        if (score > highScore) {
            showOverlay('Game Over', `New High Score: ${score}`, 'Well done!');
        } else {
            showOverlay('Game Over', `Your Score: ${score}`, 'Try again!');
        }
    }

    // Show overlay with custom message
    function showOverlay(title, message, buttonText = 'Play Again') {
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        startButton.textContent = buttonText;
        gameOverlay.style.display = 'flex';
    }

    // Event listeners
    startButton.addEventListener('click', startGame);
    
    pauseButton.addEventListener('click', togglePause);
    
    restartButton.addEventListener('click', () => {
        clearInterval(gameInterval);
        startGame();
    });
    
    difficultySelect.addEventListener('change', () => {
        gameSpeed = DIFFICULTY[difficultySelect.value];
        if (gameInterval && !isPaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Prevent default for arrow keys to avoid page scrolling
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }
        
        // Start game if it's not running
        if (!gameInterval && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                              e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            startGame();
            return;
        }
        
        // Pause/resume with space
        if (e.key === ' ' && gameInterval) {
            togglePause();
            return;
        }
        
        // Change direction (prevent 180-degree turns)
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== DIRECTIONS.DOWN) nextDirection = DIRECTIONS.UP;
                break;
            case 'ArrowDown':
                if (direction !== DIRECTIONS.UP) nextDirection = DIRECTIONS.DOWN;
                break;
            case 'ArrowLeft':
                if (direction !== DIRECTIONS.RIGHT) nextDirection = DIRECTIONS.LEFT;
                break;
            case 'ArrowRight':
                if (direction !== DIRECTIONS.LEFT) nextDirection = DIRECTIONS.RIGHT;
                break;
        }
    });

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        
        // Start game on first touch if not running
        if (!gameInterval) {
            startGame();
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!gameInterval || isPaused) return;
        
        e.preventDefault();
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Determine swipe direction
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 0 && direction !== DIRECTIONS.LEFT) {
                nextDirection = DIRECTIONS.RIGHT;
            } else if (dx < 0 && direction !== DIRECTIONS.RIGHT) {
                nextDirection = DIRECTIONS.LEFT;
            }
        } else {
            // Vertical swipe
            if (dy > 0 && direction !== DIRECTIONS.UP) {
                nextDirection = DIRECTIONS.DOWN;
            } else if (dy < 0 && direction !== DIRECTIONS.DOWN) {
                nextDirection = DIRECTIONS.UP;
            }
        }
    }, { passive: false });

    // Initialize UI
    highScoreElement.textContent = highScore;
});