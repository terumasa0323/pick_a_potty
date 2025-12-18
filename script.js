let player1ImageIndex = 1;
let player2ImageIndex = 1;

// ページロード時の初期設定
document.addEventListener('DOMContentLoaded', () => {
    // ページロード時はモーダルが表示された状態。
    // index.html側で #setup は display: none になっているので、ここでは何もしなくてOKです。
});

// ▼▼▼ この関数が不足していたため、ボタンが反応しませんでした ▼▼▼
/**
 * 導入モーダルを閉じ、ゲーム設定画面を表示する関数
 * index.html の「ゲーム設定へ進む」ボタンから呼び出されます
 */
function closeIntro() {
    // 1. 導入モーダルを非表示にする
    const modal = document.getElementById('intro-modal-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 2. 設定エリアを表示する
    const setup = document.getElementById('setup');
    if (setup) {
        setup.style.display = 'block';
    }
    
    // 3. ユーザーに次の操作を促す
    const status = document.getElementById('status');
    if (status) {
        status.textContent = '設定を選んで「ゲーム開始」を押してください';
    }
}
// ▲▲▲ 追加ここまで ▲▲▲


// ゲーム開始ボタンのクリックイベント
document.getElementById('start-btn').addEventListener('click', () => {
    const spotsInput = document.getElementById('spots');
    const aiCheck = document.getElementById('ai-mode');
    
    if (spotsInput) {
        numSpots = parseInt(spotsInput.value);
    }
    if (aiCheck) {
        aiMode = aiCheck.checked;
    }
    
    if (numSpots < 3 || numSpots > 11 || isNaN(numSpots)) {
        alert('スポット数は3〜11の間で設定してください。');
        return;
    }
    
    // AIモードは奇数スポットでのみ有効（必勝法が成立しやすいため）
    if (aiMode && numSpots % 2 === 0) {
        alert('AIモード（必勝法）は奇数スポット数でのみ有効です。偶数でプレイする場合はAIモードをオフにしてください。');
        if (aiCheck) aiCheck.checked = false;
        aiMode = false;
    }
    
    startGame();
});

function startGame() {
    spots = new Array(numSpots).fill(null);
    currentPlayer = 1;
    gameActive = true;
    player1ImageIndex = 1;
    player2ImageIndex = 1;
    
    const winMsg = document.getElementById('win-message');
    if (winMsg) winMsg.style.display = 'none';
    
    // 設定パネルを非表示
    const setup = document.getElementById('setup');
    if (setup) setup.style.display = 'none';
    
    const board = document.getElementById('game-board');
    if (board) {
        board.style.display = 'flex';
        board.innerHTML = '';
        
        for (let i = 0; i < numSpots; i++) {
            const spot = document.createElement('div');
            spot.classList.add('spot');
            spot.dataset.index = i;
            const img = document.createElement('img');
            img.src = 'images/urinal.png';
            img.classList.add('urinal-img');
            spot.appendChild(img);
            // makeMove 関数はイベントリスナーとして登録
            spot.addEventListener('click', () => makeMove(i));
            board.appendChild(spot);
        }
    }
    
    updateStatus();
    
    // P1がAIの場合、AIからスタートすることも可能ですが、ここではP2をAIと仮定
    if (aiMode && currentPlayer === 2) {
        setTimeout(aiMove, 500); 
    }
}

function makeMove(index, isAI = false) {
    console.log('makeMove called for index:', index, 'currentPlayer:', currentPlayer, 'isAI:', isAI);
    
    // 1. ゲーム状態とターンのチェック
    if (!gameActive || spots[index] !== null || (aiMode && currentPlayer === 2 && !isAI)) return;

    // 2. 有効な手（隣接禁止）のチェック
    if (!isValidMove(index)) {
        if (!isAI) {
            alert("隣接禁止ルールにより、このスポットには置けません。");
        }
        return;
    }

    // 3. 手の実行
    spots[index] = currentPlayer;
    const spot = document.querySelector(`.spot[data-index="${index}"]`);
    if (spot) {
        spot.classList.add('occupied');
        
        // ポッキーの描画
        const imageIndex = currentPlayer === 1 ? player1ImageIndex : player2ImageIndex;
        console.log('imageIndex:', imageIndex, 'src:', `images/player${currentPlayer}/player${currentPlayer}-${imageIndex}.png`);
        const pocky = document.createElement('img');
        pocky.src = `images/player${currentPlayer}/player${currentPlayer}-${imageIndex}.png`;
        pocky.classList.add('pocky');
        pocky.onload = () => console.log('player image loaded');
        pocky.onerror = () => console.log('player image error');
        spot.appendChild(pocky);
        console.log('pocky added to spot');
        
        // 画像インデックス更新
        if (currentPlayer === 1) {
            player1ImageIndex = player1ImageIndex % 3 + 1;
        } else {
            player2ImageIndex = player2ImageIndex % 3 + 1;
        }
    }

    // 4. 勝敗判定
    if (checkWinCondition()) {
        gameActive = false;
        const winner = aiMode && currentPlayer === 2 ? 'AI' : `プレイヤー${currentPlayer}`;
        console.log('Winner:', winner);
        const winMsg = document.getElementById('win-message');
        console.log('winMsg:', winMsg);
        if (winMsg) {
            winMsg.innerHTML = `🏆 <strong>${winner}の勝利！</strong> 🏆`;
            winMsg.style.display = 'block';
            console.log('winMsg.innerHTML set to:', winMsg.innerHTML);
        }
        const modal = document.getElementById('win-modal-overlay');
        if (modal) {
            modal.style.display = 'flex';
        }
        return;
    }

    // 5. ターン交代
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateStatus();
    
    if (aiMode && currentPlayer === 2) {
        setTimeout(aiMove, 700); // AIの思考時間
    }
}

function aiMove() {
    if (!gameActive) return;

    // 1. 必勝法 (奇数スポット・P1先手の場合、P1が中央に置いた後の対称性)
    const center = Math.floor(numSpots / 2);
    
    // P1が既に中央に置き、AIが対称手で応じる場合
    if (numSpots % 2 !== 0 && spots[center] === 1) {
        for (let i = 0; i < numSpots; i++) {
            if (spots[i] === 1 && i !== center) { 
                const symmetricIndex = numSpots - 1 - i; 
                
                // 対称位置が空いており、有効な手であること
                if (spots[symmetricIndex] === null && isValidMove(symmetricIndex)) {
                    makeMove(symmetricIndex, true);
                    return;
                }
            }
        }
    }
    
    // 2. 中央に置く手 (AIが最初の一手またはP1が中央を空けた場合)
    if (spots[center] === null && isValidMove(center)) {
        makeMove(center, true);
        return;
    }

    // 3. それ以外（ランダムに有効な手を選択）
    const available = [];
    for (let i = 0; i < numSpots; i++) {
        if (spots[i] === null && isValidMove(i)) {
            available.push(i);
        }
    }
    
    if (available.length > 0) {
        // ランダムだが、可能な限り勝利に貢献しない手を選ぶ
        const randomIndex = available[Math.floor(Math.random() * available.length)];
        makeMove(randomIndex, true);
    } else {
        checkWinCondition(); 
    }
}

function isValidMove(index) {
    // 隣接禁止: 左右が既にポッキーで埋まっていないか
    // 左隣
    if (index > 0 && spots[index - 1] !== null) return false;
    // 右隣
    if (index < numSpots - 1 && spots[index + 1] !== null) return false;
    return true;
}

function checkWinCondition() {
    // 次のプレイヤーに有効な手があるかチェック
    for (let i = 0; i < numSpots; i++) {
        // i の位置が空きであり、かつ i の位置に置いたとしても隣接禁止ルールに違反しないか
        if (spots[i] === null && isValidMove(i)) {
            return false; // 有効な手があるため、ゲーム続行
        }
    }
    return true; // 次のプレイヤーに有効な手がないため、現在のプレイヤーが勝利
}

function resetGame() {
    const modal = document.getElementById('win-modal-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
    const setup = document.getElementById('setup');
    if (setup) {
        setup.style.display = 'block';
    }
    const board = document.getElementById('game-board');
    if (board) {
        board.innerHTML = '';
        board.removeAttribute('style');
        board.style.display = 'none';
    }
    const status = document.getElementById('status');
    if (status) {
        status.textContent = '設定を選んで「ゲーム開始」を押してください';
    }
    gameActive = false;
}

function updateStatus() {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;

    if (aiMode && currentPlayer === 2) {
        statusEl.textContent = 'AIのターンです';
    } else {
        statusEl.textContent = `プレイヤー${currentPlayer}のターンです`;
    }
}