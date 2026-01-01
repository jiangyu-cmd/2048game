class Game2048 {
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
        this.gameOver = false;
        this.lastMoveChanged = false;
        
        this.initializeGrid();
        this.bindEvents();
        this.updateScores();
    }
    
    initializeGrid() {
        // Initialize empty grid
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = 0;
            }
        }
        
        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        
        // Render the grid
        this.renderGrid();
        
        // Hide game over overlay
        this.hideGameOver();
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    // Save current grid state for comparison
    saveGridState() {
        const state = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const value = this.grid[i][j];
                if (value !== 0) {
                    state.push({ row: i, col: j, value: value });
                }
            }
        }
        return state;
    }
    
    renderGrid() {
        const gameGrid = document.getElementById('game-grid');
        
        // Create a copy of the current grid state before rendering
        const currentTiles = [];
        const tileElements = gameGrid.querySelectorAll('.tile');
        tileElements.forEach(tile => {
            const [, , valueStr, , row, col] = tile.className.match(/tile-([0-9]+).*tile-position-(\d)-(\d)/) || [];
            if (valueStr && row !== undefined && col !== undefined) {
                currentTiles.push({ 
                    element: tile, 
                    value: parseInt(valueStr), 
                    row: parseInt(row), 
                    col: parseInt(col) 
                });
            }
        });
        
        // Create grid cells
        const gridCellsHTML = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                gridCellsHTML.push('<div class="grid-cell"></div>');
            }
        }
        
        // Create new tiles HTML
        const newTiles = [];
        const newTilesHTML = [];
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const value = this.grid[i][j];
                if (value !== 0) {
                    newTiles.push({ row: i, col: j, value: value });
                    newTilesHTML.push(`<div class="tile tile-${value} tile-position-${i}-${j}" data-value="${value}" data-row="${i}" data-col="${j}">${value}</div>`);
                }
            }
        }
        
        // Clear game grid but keep the tile elements temporarily
        gameGrid.innerHTML = gridCellsHTML.join('') + newTilesHTML.join('');
        
        // Animate tiles movement
        this.animateTilesMovement(currentTiles, newTiles, gameGrid);
    }
    
    animateTilesMovement(currentTiles, newTiles, gameGrid) {
        // Determine cell size and gap based on current mode
        const isMobile = document.documentElement.classList.contains('mode-mobile') || window.innerWidth <= 600;
        const cellSize = isMobile ? 70 : 100; // Size of each grid cell
        const cellGap = isMobile ? 10 : 15;    // Gap between cells
        const containerPadding = isMobile ? 10 : 15; // Game container padding
        
        // For each new tile, check if it has moved from a previous position
        newTiles.forEach(newTile => {
            const matchingOldTile = currentTiles.find(oldTile => 
                oldTile.value === newTile.value && 
                // Try to find tiles that are likely to have moved to this position
                (oldTile.row !== newTile.row || oldTile.col !== newTile.col)
            );
            
            if (matchingOldTile) {
                // Get the new tile element
                const newTileElement = gameGrid.querySelector(`.tile[data-value="${newTile.value}"][data-row="${newTile.row}"][data-col="${newTile.col}"]`);
                
                if (newTileElement) {
                    // Calculate the movement distance
                    const oldLeft = containerPadding + matchingOldTile.col * (cellSize + cellGap);
                    const oldTop = containerPadding + matchingOldTile.row * (cellSize + cellGap);
                    const newLeft = containerPadding + newTile.col * (cellSize + cellGap);
                    const newTop = containerPadding + newTile.row * (cellSize + cellGap);
                    
                    const translateX = oldLeft - newLeft;
                    const translateY = oldTop - newTop;
                    
                    // Set initial position to old position
                    newTileElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
                    newTileElement.classList.add('tile-moving');
                    
                    // Create a trail effect
                    this.createTileTrail(newTileElement, oldLeft, oldTop, newLeft, newTop);
                    
                    // Force reflow
                    void newTileElement.offsetWidth;
                    
                    // Animate to new position
                    newTileElement.style.transform = 'translate(0, 0)';
                    
                    // Remove moving class after animation
                    setTimeout(() => {
                        newTileElement.classList.remove('tile-moving');
                    }, 250);
                }
            } else {
                // New tile, add new animation
                const newTileElement = gameGrid.querySelector(`.tile[data-value="${newTile.value}"][data-row="${newTile.row}"][data-col="${newTile.col}"]`);
                if (newTileElement) {
                    newTileElement.classList.add('tile-new');
                    setTimeout(() => {
                        newTileElement.classList.remove('tile-new');
                    }, 250);
                }
            }
        });
    }
    
    createTileTrail(tileElement, oldLeft, oldTop, newLeft, newTop) {
        const trail = document.createElement('div');
        trail.className = tileElement.className.replace('tile-moving', '') + ' tile-move-trail';
        trail.textContent = tileElement.textContent;
        
        // Position trail at old position
        trail.style.left = oldLeft + 'px';
        trail.style.top = oldTop + 'px';
        trail.style.opacity = '0.3';
        
        const gameGrid = document.getElementById('game-grid');
        gameGrid.appendChild(trail);
        
        // Animate trail to new position with fade out
        setTimeout(() => {
            trail.style.left = newLeft + 'px';
            trail.style.top = newTop + 'px';
            trail.style.opacity = '0';
        }, 10);
        
        // Remove trail after animation
        setTimeout(() => {
            trail.remove();
        }, 250);
    }
    
    move(direction) {
        if (this.gameOver) return;
        
        this.lastMoveChanged = false;
        
        switch (direction) {
            case 'up':
                this.moveUp();
                break;
            case 'down':
                this.moveDown();
                break;
            case 'left':
                this.moveLeft();
                break;
            case 'right':
                this.moveRight();
                break;
        }
        
        if (this.lastMoveChanged) {
            this.addRandomTile();
            this.renderGrid();
            this.updateScores();
            this.checkGameOver();
        }
    }
    
    moveLeft() {
        for (let i = 0; i < this.gridSize; i++) {
            const row = this.grid[i];
            const newRow = this.mergeRow(row);
            
            if (!this.arraysEqual(row, newRow)) {
                this.grid[i] = newRow;
                this.lastMoveChanged = true;
            }
        }
    }
    
    moveRight() {
        for (let i = 0; i < this.gridSize; i++) {
            const row = this.grid[i].slice().reverse();
            const newRow = this.mergeRow(row).reverse();
            
            if (!this.arraysEqual(this.grid[i], newRow)) {
                this.grid[i] = newRow;
                this.lastMoveChanged = true;
            }
        }
    }
    
    moveUp() {
        for (let j = 0; j < this.gridSize; j++) {
            const column = [];
            for (let i = 0; i < this.gridSize; i++) {
                column.push(this.grid[i][j]);
            }
            
            const newColumn = this.mergeRow(column);
            
            for (let i = 0; i < this.gridSize; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    this.grid[i][j] = newColumn[i];
                    this.lastMoveChanged = true;
                }
            }
        }
    }
    
    moveDown() {
        for (let j = 0; j < this.gridSize; j++) {
            const column = [];
            for (let i = 0; i < this.gridSize; i++) {
                column.push(this.grid[i][j]);
            }
            
            const newColumn = this.mergeRow(column.slice().reverse()).reverse();
            
            for (let i = 0; i < this.gridSize; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    this.grid[i][j] = newColumn[i];
                    this.lastMoveChanged = true;
                }
            }
        }
    }
    
    mergeRow(row) {
        // Remove zeros
        const filteredRow = row.filter(cell => cell !== 0);
        
        // Merge adjacent cells
        for (let i = 0; i < filteredRow.length - 1; i++) {
            if (filteredRow[i] === filteredRow[i + 1]) {
                filteredRow[i] *= 2;
                filteredRow[i + 1] = 0;
                this.score += filteredRow[i];
            }
        }
        
        // Remove zeros again
        const mergedRow = filteredRow.filter(cell => cell !== 0);
        
        // Add zeros back to the end
        while (mergedRow.length < this.gridSize) {
            mergedRow.push(0);
        }
        
        return mergedRow;
    }
    
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    updateScores() {
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore.toString());
        }
        
        document.getElementById('best').textContent = this.bestScore;
    }
    
    checkGameOver() {
        // Check if there are any empty cells
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
            }
        }
        
        // Check if adjacent cells can be merged
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const current = this.grid[i][j];
                
                if (i < this.gridSize - 1 && current === this.grid[i + 1][j]) {
                    return false;
                }
                
                if (j < this.gridSize - 1 && current === this.grid[i][j + 1]) {
                    return false;
                }
            }
        }
        
        this.gameOver = true;
        this.showGameOver();
        return true;
    }
    
    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-overlay').style.display = 'flex';
    }
    
    hideGameOver() {
        document.getElementById('game-overlay').style.display = 'none';
    }
    
    newGame() {
        this.score = 0;
        this.gameOver = false;
        this.initializeGrid();
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });
        
        // Touch events for mobile
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        const gameContainer = document.getElementById('game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });
        
        gameContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        });
        
        // Button events
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });
        
        document.getElementById('restart-game').addEventListener('click', () => {
            this.newGame();
        });
    }
    
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 50) {
                this.move('right');
            } else if (deltaX < -50) {
                this.move('left');
            }
        } else {
            // Vertical swipe
            if (deltaY > 50) {
                this.move('down');
            } else if (deltaY < -50) {
                this.move('up');
            }
        }
    }
}

// Matrix rain background
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrix');
        this.ctx = this.canvas.getContext('2d');
        this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        this.charsArray = this.chars.split('');
        this.fontSize = 14;
        this.columns = this.canvas.width / this.fontSize;
        this.drops = [];
        this.speed = 0.3; // Controls the speed of the rain
        this.counters = []; // Track speed for each column
        
        // Check current theme and update visibility
        this.updateVisibility();
        
        this.resizeCanvas();
        this.initDrops();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    updateVisibility() {
        // Check current theme from localStorage
        const currentTheme = localStorage.getItem('currentTheme') || 'tech';
        if (currentTheme === 'classic') {
            this.canvas.style.display = 'none';
        } else {
            this.canvas.style.display = 'block';
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = this.canvas.width / this.fontSize;
        this.initDrops();
    }
    
    initDrops() {
        this.drops = [];
        this.counters = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -this.canvas.height;
            this.counters[i] = 0;
        }
    }
    
    animate() {
        // Check if we should render the matrix rain
        const currentTheme = localStorage.getItem('currentTheme') || 'tech';
        if (currentTheme === 'classic') {
            // If classic theme, clear the canvas and don't draw anything
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.font = `${this.fontSize}px monospace`;
        
        for (let i = 0; i < this.drops.length; i++) {
            // Only update position based on speed
            this.counters[i] += this.speed;
            
            if (this.counters[i] >= 1) {
                this.counters[i] = 0;
                
                const text = this.charsArray[Math.floor(Math.random() * this.charsArray.length)];
                this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
                
                if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }
                
                this.drops[i]++;
            } else {
                // Re-draw the same character at the same position
                const text = this.charsArray[Math.floor(Math.random() * this.charsArray.length)];
                this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Theme switching functionality
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('currentTheme') || 'tech';
        this.currentMode = localStorage.getItem('currentMode') || 'auto';
        this.matrixRain = null;
        this.initializeTheme();
        this.initializeMode();
        this.bindEvents();
    }
    
    setMatrixRain(matrixRain) {
        this.matrixRain = matrixRain;
        this.updateMatrixRainVisibility();
    }
    
    initializeTheme() {
        document.documentElement.className = this.getFullClassName();
        document.getElementById('theme-select').value = this.currentTheme;
        this.updateMatrixRainVisibility();
    }
    
    initializeMode() {
        document.getElementById('mode-select').value = this.currentMode;
        this.applyMode(this.currentMode);
    }
    
    switchTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('currentTheme', theme);
        document.documentElement.className = this.getFullClassName();
        this.updateMatrixRainVisibility();
    }
    
    updateMatrixRainVisibility() {
        if (this.matrixRain && this.matrixRain.updateVisibility) {
            this.matrixRain.updateVisibility();
        } else {
            // Fallback if matrixRain instance is not available
            const matrixCanvas = document.getElementById('matrix');
            if (matrixCanvas) {
                if (this.currentTheme === 'classic') {
                    matrixCanvas.style.display = 'none';
                } else {
                    matrixCanvas.style.display = 'block';
                }
            }
        }
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        localStorage.setItem('currentMode', mode);
        this.applyMode(mode);
        
        // Update document class based on both theme and mode
        document.documentElement.className = this.getFullClassName();
    }
    
    applyMode(mode) {
        const gameContainer = document.getElementById('game-container');
        
        // Remove any existing mode classes
        gameContainer.classList.remove('mode-pc', 'mode-mobile');
        
        // Add mode class if not auto
        if (mode !== 'auto') {
            gameContainer.classList.add(`mode-${mode}`);
        }
    }
    
    getFullClassName() {
        let className = '';
        if (this.currentTheme === 'classic') className += 'theme-classic';
        if (this.currentMode !== 'auto') className += ` mode-${this.currentMode}`;
        return className.trim();
    }
    
    bindEvents() {
        const themeSelect = document.getElementById('theme-select');
        themeSelect.addEventListener('change', (e) => {
            this.switchTheme(e.target.value);
        });
        
        const modeSelect = document.getElementById('mode-select');
        modeSelect.addEventListener('change', (e) => {
            this.switchMode(e.target.value);
        });
    }
}

// Loading screen functionality
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
}

// Initialize the game, matrix rain, and theme manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen for at least 3 seconds to match the loading animation
    setTimeout(() => {
        hideLoadingScreen();
        // Initialize game components after loading screen is hidden
        const themeManager = new ThemeManager();
        const matrixRain = new MatrixRain();
        const game2048 = new Game2048();
        
        // Pass matrixRain instance to themeManager for theme changes
        themeManager.setMatrixRain(matrixRain);
    }, 3000);
});
