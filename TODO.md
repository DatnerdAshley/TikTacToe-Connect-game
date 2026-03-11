# TikTacToe GitHub Pages Setup

## Task
Set up the game to run on GitHub Pages with:
- ✅ Bot mode (play vs AI)
- ✅ Local PvP (two players, same device)
- ✅ Online PvP (two players, different devices via PeerJS)

## Steps Completed
- [x] 1. Analyze existing codebase
- [x] 2. Plan the solution for GitHub Pages compatibility
- [x] 3. Create standalone index.html at root (works without server)
- [x] 4. Update game.js to include PeerJS online multiplayer
- [x] 5. Update index.html with online multiplayer UI
- [x] 6. Update style.css with new UI styles

## How to Deploy to GitHub Pages

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add GitHub Pages support with online multiplayer"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages** (left sidebar)
   - Under "Build and deployment":
     - Source: Select **Deploy from a branch**
     - Branch: Select **main** (or master)
     - Folder: Select **/** (root)
   - Click **Save**

3. **Wait 1-2 minutes** for deployment, then visit:
   `https://yourusername.github.io/TikTacToe-Connect-game/`

## How to Play Online

1. **Player 1** (Host):
   - Click "Play Online"
   - Click "Create Room"
   - Share the displayed code with Player 2

2. **Player 2** (Joiner):
   - Click "Play Online"
   - Enter the code from Player 1
   - Click "Join Room"

3. **Game starts!** Both players can see the board and play in real-time.

## How It Works
- **PeerJS** uses WebRTC for peer-to-peer connections
- No server needed - players connect directly to each other
- Works in modern browsers (Chrome, Firefox, Edge, Safari)

