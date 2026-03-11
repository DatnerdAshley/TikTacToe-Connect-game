const boardDiv = document.getElementById("board");
const botBtn = document.getElementById("botBtn");
const pvpBtn = document.getElementById("pvpBtn");
const onlineBtn = document.getElementById("onlineBtn");
const statusDiv = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const backToMenuBtn = document.getElementById("backToMenu");
const roomInputDiv = document.getElementById("roomInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCode");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const connectionStatus = document.getElementById("connectionStatus");

let board = Array(9).fill(null);
let gameMode = null; // "bot", "pvp", or "online"
let currentPlayer = "X";
let gameActive = true;
let playerSymbol = "X"; // For Online mode
let isHost = false; // For Online mode - host is X, joiner is O

// PeerJS for online multiplayer
let peer = null;
let conn = null;
let myPeerId = null;

const WIN_PATTERNS = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
];

// Create board cells
for(let i=0; i<9; i++){
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.onclick = () => handleCellClick(i);
    boardDiv.appendChild(cell);
}

// Mode selection - Bot
botBtn.onclick = () => {
    gameMode = "bot";
    playerSymbol = "X";
    startGame();
};

// Mode selection - Local PvP
pvpBtn.onclick = () => {
    gameMode = "pvp";
    startGame();
};

// Mode selection - Online PvP
onlineBtn.onclick = () => {
    gameMode = "online";
    document.getElementById("menu").classList.add("hidden");
    roomInputDiv.classList.remove("hidden");
    connectionStatus.textContent = "Initializing...";
    initPeer();
};

// Create room button
createRoomBtn.onclick = () => {
    createRoom();
};

// Join room button
joinRoomBtn.onclick = () => {
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    if(roomCode) {
        joinRoom(roomCode);
    }
};

// Copy code button
copyCodeBtn.onclick = () => {
    const code = document.getElementById("roomCodeDisplay").textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert("Room code copied!");
    });
};

// Initialize PeerJS
function initPeer() {
    // Generate a random ID for this user
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    peer = new Peer("tictactoe-" + randomId, {
        debug: 1
    });

    peer.on('open', (id) => {
        myPeerId = id;
        connectionStatus.textContent = "Connected! Your ID: " + id;
    });

    peer.on('connection', (connection) => {
        conn = connection;
        isHost = true;
        playerSymbol = "X";
        setupConnection();
    });

    peer.on('error', (err) => {
        console.error(err);
        connectionStatus.textContent = "Error: " + err.type;
    });
}

function createRoom() {
    isHost = true;
    playerSymbol = "X";
    document.getElementById("roomInput").classList.add("hidden");
    document.getElementById("waitingRoom").classList.remove("hidden");
    document.getElementById("roomCodeDisplay").textContent = myPeerId;
    connectionStatus.textContent = "Waiting for opponent... Share your ID";
}

function joinRoom(hostId) {
    isHost = false;
    playerSymbol = "O";
    
    conn = peer.connect(hostId, {
        reliable: true
    });
    
    setupConnection();
    
    document.getElementById("roomInput").classList.add("hidden");
    document.getElementById("waitingRoom").classList.remove("hidden");
    connectionStatus.textContent = "Connecting to host...";
}

function setupConnection() {
    conn.on('open', () => {
        connectionStatus.textContent = "Connected! Game starting...";
        
        setTimeout(() => {
            document.getElementById("waitingRoom").classList.add("hidden");
            document.getElementById("game").classList.remove("hidden");
            startGame();
        }, 1000);
    });

    conn.on('data', (data) => {
        if(data.type === 'move') {
            // Received move from opponent
            board[data.index] = data.symbol;
            currentPlayer = data.symbol;
            updateBoard();
            checkWinnerOnline();
        } else if(data.type === 'restart') {
            // Received restart from opponent
            resetGame();
        } else if(data.type === 'sync') {
            // Full board sync (host sending initial state)
            board = data.board;
            currentPlayer = data.turn;
            updateBoard();
            checkWinnerOnline();
        }
    });

    conn.on('close', () => {
        connectionStatus.textContent = "Opponent disconnected!";
        gameActive = false;
        updateStatus("Opponent left the game!");
    });
}

// Send move to opponent
function sendMove(index) {
    if(conn && conn.open) {
        conn.send({
            type: 'move',
            index: index,
            symbol: playerSymbol
        });
    }
}

// Send restart to opponent
function sendRestart() {
    if(conn && conn.open) {
        conn.send({ type: 'restart' });
    }
}

// Restart button
restartBtn.onclick = () => {
    resetGame();
    if(gameMode === "online" && conn && conn.open) {
        sendRestart();
    }
};

// Back to menu
backToMenuBtn.onclick = () => {
    resetGame();
    // Close peer connection
    if(conn) {
        conn.close();
        conn = null;
    }
    if(peer) {
        peer.destroy();
        peer = null;
    }
    document.getElementById("game").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("roomInput").classList.add("hidden");
    document.getElementById("waitingRoom").classList.add("hidden");
    roomCodeInput.value = "";
};

function startGame(){
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    currentPlayer = "X";
    gameActive = true;
    
    if(gameMode === "bot"){
        updateStatus("Your turn (X)");
    } else if(gameMode === "pvp"){
        updateStatus("Player X's turn");
    } else if(gameMode === "online"){
        if(playerSymbol === "X") {
            updateStatus("Your turn (X)");
        } else {
            updateStatus("Opponent's turn (X)");
        }
    }
}

function handleCellClick(index){
    if(!gameActive || board[index] !== null) return;
    
    // Online mode: only allow move on your turn
    if(gameMode === "online" && currentPlayer !== playerSymbol) return;
    
    if(gameMode === "bot"){
        // Player move
        if(currentPlayer !== playerSymbol) return;
        
        board[index] = currentPlayer;
        updateBoard();
        
        if(checkWinner()){
            gameActive = false;
            return;
        }
        
        if(board.every(cell => cell !== null)){
            updateStatus("It's a Draw!");
            gameActive = false;
            return;
        }
        
        // Switch to bot
        currentPlayer = "O";
        updateStatus("Bot is thinking...");
        
        // Bot makes move after delay
        setTimeout(botMove, 500);
    } else if(gameMode === "pvp"){
        // PVP - local multiplayer
        board[index] = currentPlayer;
        updateBoard();
        
        if(checkWinner()){
            gameActive = false;
            return;
        }
        
        if(board.every(cell => cell !== null)){
            updateStatus("It's a Draw!");
            gameActive = false;
            return;
        }
        
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateStatus("Player " + currentPlayer + "'s turn");
    } else if(gameMode === "online"){
        // Online multiplayer
        board[index] = currentPlayer;
        sendMove(index); // Send move to opponent
        updateBoard();
        
        if(checkWinnerOnline()){
            gameActive = false;
            return;
        }
        
        if(board.every(cell => cell !== null)){
            updateStatus("It's a Draw!");
            gameActive = false;
            return;
        }
        
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateStatus("Your turn (" + currentPlayer + ")");
    }
}

function botMove(){
    if(!gameActive) return;
    
    // Simple AI: random available move
    const available = board.map((v,i) => v === null ? i : -1).filter(i => i !== -1);
    if(available.length === 0) return;
    
    const botIndex = available[Math.floor(Math.random() * available.length)];
    board[botIndex] = "O";
    updateBoard();
    
    if(checkWinner()){
        gameActive = false;
        return;
    }
    
    if(board.every(cell => cell !== null)){
        updateStatus("It's a Draw!");
        gameActive = false;
        return;
    }
    
    currentPlayer = "X";
    updateStatus("Your turn (X)");
}

function checkWinner(){
    for(let pattern of WIN_PATTERNS){
        const [a,b,c] = pattern;
        if(board[a] && board[a] === board[b] && board[a] === board[c]){
            if(gameMode === "bot"){
                if(board[a] === "X"){
                    updateStatus("You Win!");
                }else{
                    updateStatus("Bot Wins!");
                }
            }else{
                updateStatus("Player " + board[a] + " Wins!");
            }
            return true;
        }
    }
    return false;
}

function checkWinnerOnline(){
    for(let pattern of WIN_PATTERNS){
        const [a,b,c] = pattern;
        if(board[a] && board[a] === board[b] && board[a] === board[c]){
            if(board[a] === playerSymbol){
                updateStatus("You Win!");
            }else{
                updateStatus("Opponent Wins!");
            }
            return true;
        }
    }
    return false;
}

function updateBoard(){
    const cells = document.querySelectorAll(".cell");
    board.forEach((v, i) => {
        cells[i].textContent = v || "";
    });
}

function updateStatus(msg){
    statusDiv.textContent = msg;
}

function resetGame(){
    board = Array(9).fill(null);
    currentPlayer = "X";
    gameActive = true;
    updateBoard();
    
    if(gameMode === "bot"){
        updateStatus("Your turn (X)");
    } else if(gameMode === "pvp"){
        updateStatus("Player X's turn");
    } else if(gameMode === "online"){
        if(playerSymbol === "X") {
            updateStatus("Your turn (X)");
        } else {
            updateStatus("Opponent's turn (X)");
        }
    }
}

