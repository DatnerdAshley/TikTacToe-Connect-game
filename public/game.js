const boardDiv = document.getElementById("board");
const botBtn = document.getElementById("botBtn");
const pvpBtn = document.getElementById("pvpBtn");
const statusDiv = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const backToMenuBtn = document.getElementById("backToMenu");

let board = Array(9).fill(null);
let gameMode = null; // "bot" or "pvp"
let currentPlayer = "X";
let gameActive = true;
let playerSymbol = "X"; // For PVP mode
let pvpLocalPlayer = "X"; // For local PVP

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

// Mode selection
botBtn.onclick = () => {
    gameMode = "bot";
    playerSymbol = "X";
    startGame();
};

pvpBtn.onclick = () => {
    gameMode = "pvp";
    startGame();
};

// Restart button
restartBtn.onclick = () => {
    resetGame();
};

// Back to menu
backToMenuBtn.onclick = () => {
    resetGame();
    document.getElementById("game").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
};

function startGame(){
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    currentPlayer = "X";
    gameActive = true;
    
    if(gameMode === "bot"){
        updateStatus("Your turn (X)");
    }else{
        updateStatus("Player X's turn");
    }
}

function handleCellClick(index){
    if(!gameActive || board[index] !== null) return;
    
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
    }else{
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
    }else{
        updateStatus("Player X's turn");
    }
}

