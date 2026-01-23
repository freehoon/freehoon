document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------
    // DOM ELEMENTS
    // ------------------------------------
    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.getElementById('tile-container');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const restartBtn = document.getElementById('restart-btn');

    // Modals
    const startModal = document.getElementById('start-modal');
    const startNicknameInput = document.getElementById('start-nickname-input');
    const startGameBtn = document.getElementById('start-game-btn');

    const rankingModal = document.getElementById('ranking-modal');
    const rankBtn = document.getElementById('rank-btn');
    const closeRankingBtn = document.getElementById('close-ranking');
    const rankingList = document.getElementById('ranking-list');

    const saveScoreModal = document.getElementById('save-score-modal');
    const saveScoreBtn = document.getElementById('save-score-btn');
    const skipSaveBtn = document.getElementById('skip-save-btn');
    const displayNicknameSpan = document.getElementById('display-nickname');
    const finalScoreSpan = document.getElementById('final-score');

    // Mobile Controls
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // ------------------------------------
    // GAME STATE
    // ------------------------------------
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let currentNickname = "";

    bestScoreElement.textContent = bestScore;

    // ------------------------------------
    // INITIALIZATION
    // ------------------------------------

    // Note: initGame is NOT called automatically. It waits for the Start Modal interaction.

    function initGame() {
        grid = Array(4).fill().map(() => Array(4).fill(0));
        score = 0;
        updateScoreDisplay();
        clearTiles();

        spawnTile();
        spawnTile();
        renderTiles();
    }

    function clearTiles() {
        tileContainer.innerHTML = '';
    }

    // ------------------------------------
    // GAME LOGIC
    // ------------------------------------

    function spawnTile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) emptyCells.push({ r, c });
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[randomCell.r][randomCell.c] = 2; // Always spawn 2
        }
    }

    function updateScoreDisplay() {
        // Score = Max Tile Value
        let max = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] > max) max = grid[r][c];
            }
        }
        score = max;
        scoreElement.textContent = score;

        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('bestScore', bestScore);
        }
    }

    function checkGameOver() {
        // Any empty?
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 4; c++)
                if (grid[r][c] === 0) return false;

        // Any merge possible?
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const current = grid[r][c];
                // Check right
                if (c < 3 && current === grid[r][c + 1]) return false;
                // Check down
                if (r < 3 && current === grid[r + 1][c]) return false;
            }
        }

        // GAME OVER
        finalScoreSpan.textContent = score;
        displayNicknameSpan.textContent = currentNickname;
        saveScoreModal.style.display = 'flex';
        return true;
    }

    // ------------------------------------
    // MOVEMENT
    // ------------------------------------

    function slideAndMerge(line) {
        // 1. Remove zeros
        let filtered = line.filter(val => val !== 0);

        // 2. Merge adjacent
        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                filtered[i + 1] = 0; // Mark as merged
            }
        }

        // 3. Remove zeros again (from merges) and pad
        filtered = filtered.filter(val => val !== 0);
        while (filtered.length < 4) {
            filtered.push(0);
        }
        return filtered;
    }

    function moveLeft() {
        let moved = false;
        for (let r = 0; r < 4; r++) {
            const row = grid[r];
            const newRow = slideAndMerge(row);
            if (row.toString() !== newRow.toString()) {
                grid[r] = newRow;
                moved = true;
            }
        }
        return moved;
    }

    function moveRight() {
        let moved = false;
        for (let r = 0; r < 4; r++) {
            const row = grid[r];
            const reversed = [...row].reverse();
            const newRow = slideAndMerge(reversed).reverse();
            if (row.toString() !== newRow.toString()) {
                grid[r] = newRow;
                moved = true;
            }
        }
        return moved;
    }

    function moveUp() {
        let moved = false;
        for (let c = 0; c < 4; c++) {
            const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            const newCol = slideAndMerge(col);
            const isChanged = col.some((val, idx) => val !== newCol[idx]);
            if (isChanged) {
                for (let r = 0; r < 4; r++) grid[r][c] = newCol[r];
                moved = true;
            }
        }
        return moved;
    }

    function moveDown() {
        let moved = false;
        for (let c = 0; c < 4; c++) {
            const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            const reversed = [...col].reverse();
            const newCol = slideAndMerge(reversed).reverse();
            const isChanged = col.some((val, idx) => val !== newCol[idx]);
            if (isChanged) {
                for (let r = 0; r < 4; r++) grid[r][c] = newCol[r];
                moved = true;
            }
        }
        return moved;
    }

    function handleInput(e) {
        if (isModalOpen()) return;

        let moved = false;
        switch (e.key) {
            case 'ArrowUp': moved = moveUp(); break;
            case 'ArrowDown': moved = moveDown(); break;
            case 'ArrowLeft': moved = moveLeft(); break;
            case 'ArrowRight': moved = moveRight(); break;
            default: return; // Ignore other keys
        }

        if (moved) afterMove();
    }

    function afterMove() {
        spawnTile();
        renderTiles();
        updateScoreDisplay();
        checkGameOver();
    }

    // ------------------------------------
    // RENDERING
    // ------------------------------------
    function renderTiles() {
        tileContainer.innerHTML = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const val = grid[r][c];
                if (val > 0) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile', `tile-${val > 2048 ? '2048' : val}`);
                    tile.textContent = val;

                    const pos = getPositionPixels(r, c);
                    tile.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
                    tile.style.width = `${pos.size}px`;
                    tile.style.height = `${pos.size}px`;

                    // Simple responsive font sizing
                    if (pos.size < 80) { // Mobile friendly check
                        if (val > 1000) tile.style.fontSize = '24px';
                        else if (val > 100) tile.style.fontSize = '30px';
                        else tile.style.fontSize = '35px';
                    }

                    tileContainer.appendChild(tile);
                }
            }
        }
    }

    function getPositionPixels(r, c) {
        const container = document.querySelector('.game-container');
        const containerWidth = container.offsetWidth;

        let padding = 15;
        let gap = 15;

        if (containerWidth <= 340) {
            padding = 10;
        }

        const innerWidth = containerWidth - (padding * 2);
        const cellSize = (innerWidth - (gap * 3)) / 4;

        const x = padding + c * (cellSize + gap);
        const y = padding + r * (cellSize + gap);

        return { x, y, size: cellSize };
    }

    function isModalOpen() {
        if (startModal && startModal.style.display === 'flex') return true;
        if (rankingModal && rankingModal.style.display === 'flex') return true;
        if (saveScoreModal && saveScoreModal.style.display === 'flex') return true;
        return false;
    }

    // ------------------------------------
    // EVENT LISTENERS
    // ------------------------------------

    // Keyboard
    document.addEventListener('keydown', handleInput);

    // Resize
    window.addEventListener('resize', renderTiles);

    // New Game (Restart)
    if (restartBtn) restartBtn.addEventListener('click', () => {
        initGame();
    });

    // Start Game Modal Logic
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            const name = startNicknameInput ? startNicknameInput.value.trim() : '';
            if (name.length < 1) {
                alert('닉네임을 입력해주세요!');
                return;
            }
            currentNickname = name;
            startModal.style.display = 'none';
            initGame();
        });

        if (startNicknameInput) {
            startNicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') startGameBtn.click();
            });
        }
    }

    // Force show start modal on page load
    if (startModal) {
        startModal.style.display = 'flex';
    }

    // Ranking Modal Logic
    if (rankBtn) {
        rankBtn.addEventListener('click', async () => {
            rankingModal.style.display = 'flex';
            rankingList.innerHTML = '<p>Loading...</p>';

            // Assume getLeaderboardFromFirebase is global from rank.js
            try {
                if (typeof getLeaderboardFromFirebase === 'function') {
                    const data = await getLeaderboardFromFirebase();

                    if (data.length === 0) {
                        rankingList.innerHTML = '<p>아직 등록된 랭킹이 없습니다.</p>';
                    } else {
                        rankingList.innerHTML = '';
                        data.forEach((item, index) => {
                            const div = document.createElement('div');
                            div.className = 'ranking-item';
                            div.innerHTML = `
                                <span>${index + 1}. ${item.nickname}</span>
                                <span>${item.score}</span>
                            `;
                            rankingList.appendChild(div);
                        });
                    }
                } else {
                    rankingList.innerHTML = '<p>랭킹 시스템을 불러올 수 없습니다.</p>';
                }
            } catch (e) {
                console.error(e);
                rankingList.innerHTML = '<p>오류가 발생했습니다.</p>';
            }
        });
    }

    if (closeRankingBtn) {
        closeRankingBtn.addEventListener('click', () => rankingModal.style.display = 'none');
    }

    window.addEventListener('click', (e) => {
        if (e.target === rankingModal) rankingModal.style.display = 'none';
    });

    // Save Score Logic
    if (saveScoreBtn) {
        saveScoreBtn.addEventListener('click', async () => {
            if (!currentNickname) return;

            saveScoreBtn.disabled = true;
            saveScoreBtn.textContent = '저장 중...';

            try {
                if (typeof saveScoreToFirebase === 'function') {
                    const success = await saveScoreToFirebase(currentNickname, score);
                    if (success) {
                        alert('점수가 등록되었습니다!');
                        saveScoreModal.style.display = 'none';
                        initGame();
                    }
                } else {
                    alert('저장 기능 오류');
                }
            } catch (e) {
                console.error(e);
                alert('저장 중 오류가 발생했습니다.');
            } finally {
                saveScoreBtn.disabled = false;
                saveScoreBtn.textContent = '랭킹 등록';
            }
        });
    }

    if (skipSaveBtn) {
        skipSaveBtn.addEventListener('click', () => {
            saveScoreModal.style.display = 'none';
            initGame();
        });
    }

    // Mobile D-Pad Controls
    const dPadMap = [
        { btn: btnUp, action: moveUp },
        { btn: btnDown, action: moveDown },
        { btn: btnLeft, action: moveLeft },
        { btn: btnRight, action: moveRight }
    ];

    dPadMap.forEach(item => {
        if (item.btn) {
            item.btn.addEventListener('click', () => {
                if (isModalOpen()) return;
                const moved = item.action();
                if (moved) afterMove();
            });
            item.btn.addEventListener('touchstart', (e) => {
                // e.preventDefault(); 
            });
        }
    });

});
