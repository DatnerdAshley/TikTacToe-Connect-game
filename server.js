const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Explicitly serve index.html for root path
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

const rooms = {};
let botGames = {};

const WIN_PATTERNS = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
];

function checkWinner(board) {
    for (let pattern of WIN_PATTERNS) {
        const [a,b,c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (board.every(cell => cell !== null)) return "draw";
    return null;
}

function getBotMove(board) {
    const available = board.map((v,i) => v === null ? i : -1).filter(i => i !== -1);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

io.on("connection", (socket) => {

    socket.on("createBotGame", () => {
        const gameId = "bot_" + socket.id;
        botGames[gameId] = { 
            board: Array(9).fill(null), 
            turn: "X",
            playerId: socket.id
        };
        
        socket.join(gameId);
        socket.emit("botGameStarted", { gameId, symbol: "X" });
    });

    socket.on("createRoom", () => {
        const room = Math.random().toString(36).substring(2,6).toUpperCase();
        rooms[room] = { players: [], board: Array(9).fill(null), turn: "X" };

        socket.join(room);
        rooms[room].players.push({ id: socket.id, symbol: "X" });

        socket.emit("roomCreated", room);
    });

    socket.on("joinRoom", (room) => {

        if(!rooms[room] || rooms[room].players.length >= 2){
            socket.emit("errorMsg","Room full or does not exist");
            return;
        }

        socket.join(room);
        rooms[room].players.push({ id: socket.id, symbol: "O" });

        io.to(room).emit("startGame", rooms[room]);
    });

    socket.on("makeBotMove", ({ gameId, index }) => {
        const game = botGames[gameId];
        if(!game) return;

        // Player makes move
        if(game.board[index] === null && game.turn === "X"){
            game.board[index] = "X";
            
            const winner = checkWinner(game.board);
            if(winner){
                io.to(gameId).emit("updateBotBoard", { board: game.board, turn: null, winner: winner });
                return;
            }

            // Bot makes move after delay
            game.turn = "O";
            io.to(gameId).emit("updateBotBoard", { board: game.board, turn: game.turn, winner: null });

            setTimeout(() => {
                const botIndex = getBotMove(game.board);
                if(botIndex !== null){
                    game.board[botIndex] = "O";
                    
                    const winner = checkWinner(game.board);
                    game.turn = "X";
                    io.to(gameId).emit("updateBotBoard", { board: game.board, turn: game.turn, winner: winner });
                }
            }, 500);
        }
    });

    socket.on("makeMove", ({room, index}) => {

        const game = rooms[room];
        if(!game) return;

        if(game.board[index] === null){
            game.board[index] = game.turn;
            
            const winner = checkWinner(game.board);
            if(winner){
                io.to(room).emit("updateBoard", { board: game.board, turn: null, winner: winner });
                return;
            }

            game.turn = game.turn === "X" ? "O" : "X";
            io.to(room).emit("updateBoard", { board: game.board, turn: game.turn, winner: null });
        }
    });

    socket.on("disconnect", () => {
        // Clean up bot games
        for(const gameId in botGames){
            if(botGames[gameId].playerId === socket.id){
                delete botGames[gameId];
            }
        }

        // Clean up rooms
        for(const room in rooms){
            rooms[room].players = rooms[room].players.filter(p => p.id !== socket.id);

            if(rooms[room].players.length === 0){
                delete rooms[room];
            }
        }
    });

});

server.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
);

