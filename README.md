# Chess (Browser Game)

A simple, fully client-side chess game for two players. It renders an 8×8 board, supports legal moves with basic rules, shows visual aids, tracks move history and time, and persists the game state in localStorage so you can resume where you left off.

## Features
- Two-player local play with turn indicator
- Legal move checking for all pieces
- Check, checkmate, and stalemate detection
- Pawn promotion via small centered modal (Queen, Rook, Bishop, Knight)
- En passant support and castling tracking
- Per-player Undo (only undo your own last move)
- Move history tracked internally (no on-screen log)
- Game timer
- Board flip with always-visible player control panels
- Visual help: coordinates, move/capture indicators, danger zones
- Important message balloons per player (check, captures, resign/draw), top text rotated
- Game state persistence via localStorage
- Mobile-friendly layout and vibration feedback (where supported)
- Light/Dark theme toggle with persistence
- Coordinates shown as numbers and capital letters
- Fully mirrored two-player controls; black player controls rotated 180° for orientation
- Player controls visible at all times; actions integrated per player
  - Single-row control bar for both players; wraps only on small screens
  - Short labels: Flip, Help, Reset, Resign, Draw, Undo
  - No on-screen moves log
  - No page scrolling; layout scales to fit the viewport
  - Each player has their own correctly oriented (flipped) messages and interface text
  - All messages and UI text are displayed according to the current player's side and perspective

## Getting Started
- Open index.html in any modern browser
- No build steps or dependencies required
- Optional: serve the folder with a static server for cleaner URLs

## Controls
- \u21bb Flip: toggles board orientation
- 👁 Help: shows coordinates, possible moves, and danger zones (On/Off)
- ⟲ Reset: starts a new game (clears saved state)
- \u21a9 Undo: available per player when your last move can be undone
- \u2691 Resign: ends the game and declares the opponent the winner
- \ud83e\udd4d Draw: offers a draw; if accepted, the game ends
- \ud83c\udf11 Theme: toggles light/dark theme
- Player Panels: controls stay visible for both players and align in one row
- Layout: auto-resizes to keep all content visible without scrolling
- Button Styling: uses Bootstrap 5.3.2 for responsive, color-coded buttons

## How To Play
- Click a square containing your piece to select it
- Click a highlighted target square to move or capture
- Selection shows valid moves; illegal moves are rejected
- Turn alternates automatically after each valid move

## Project Structure
```
index.html      # App layout and UI containers
styles.css      # Visual styles and responsive design
script.js       # Game logic, UI interactions, persistence
images/         # Chess piece PNGs
```

## Technical Notes
- Board: an 8×8 grid rendered in the DOM; each square uses data-row/data-col/data-coord attributes
- State: a single gameState object tracks board, turn, history, special rules, timers, and persistence
- Rules: move validation per piece, path blocking checks, check/checkmate/stalemate evaluation
- Persistence: localStorage stores board, turn, history, and counters; Reset clears storage
- UI: toast feedback, undo buttons per player, turn badge, timer, visual aids classes
- Accessibility: reduced motion respected; keyboard focus outlines provided
- Preferences: theme and uppercase options saved to localStorage; applied on init

## Assets
- Piece images are loaded from the images/ directory; alt text is set to piece names

## Bootstrap Button Styling
- Primary (btn-primary): Used for main actions like New Game
- Success (btn-success): Used for Undo buttons
- Info (btn-info): Used for Visual Help toggle
- Warning (btn-warning): Used for Reset/Flip actions
- Danger (btn-danger): Used for Resign button
- Secondary (btn-secondary): Used for Draw offer and secondary toggles

## Player Perspective Handling

The game interface is fully perspective-aware. All UI elements, messages, controls, and game states must adapt to the active player's orientation and side.

Information should always be displayed from the correct player's perspective.

Layout, text orientation, and controls must be mirrored where necessary.

Game outcomes and system messages must reflect both the correct logic and the correct visual orientation.

Each player's actions must be clearly tied to their respective side.

This ensures consistency, clarity, and proper two-player experience design throughout the application.

## Change History
- 2026-02-28: Initial README created; documented features, controls, structure, and technical notes
- 2026-02-28: Rotated black pieces to face white; implemented board flip; added visual aids CSS
- 2026-02-28: Fixed pawn promotion color; added modal styles for game over/promotion
- 2026-02-28: Added Light/Dark theme toggle; settings modal; uppercase options; check/mate flags in notation
- 2026-02-28: Mirrored player controls; ensured always visible; black controls rotated 180°; per-player toggles inline
- 2026-02-28: Moved turn/move/timer into each player panel; single-line recent moves; Visual Aids On/Off labels
- 2026-02-28: Shortened control labels; enforced wrap on small screens without scrolling
- 2026-02-28: Adjusted layout scaling to keep the full page visible without scrollbars
- 2026-02-28: Removed move log; added per-player toast balloons with rotated top text
- 2026-02-28: Updated player control buttons to use compact symbol labels (↻, 👁, ⟲, ↩, 🏳, 🤝, 🌓, 🔠)
- 2026-02-28: Fixed Visual Help button to use eye icons (👁️ enabled, 🙈 disabled) instead of On/Off text
- 2026-02-28: Fixed syntax error in createPieceElement function and added 180° rotation for black pieces
- 2026-02-28: Added Bootstrap button styling documentation to README
- 2026-02-28: Fixed uppercase coordinates toggle functionality; coordinates now show capital letters by default
- 2026-02-28: Updated capture messages to neutral format (e.g., "black pawn took white rook")
- 2026-02-28: Removed Caps button; uppercase coordinates are now the default behavior
- 2026-02-28: Renamed "Visual Aids" to "Visual Help" throughout the codebase (buttons, functions, classes)
- 2026-02-28: Added game-over modal for resignation with centered popup showing winner and new game option
- 2026-02-28: Updated resignation logic to show player-specific messages from each player's perspective
- 2026-02-28: Fixed resignation buttons to correctly identify which player resigned (White/Black button specific)
- 2026-02-28: Added player-specific orientation for game-over modal (flipped 180° for Black player)
- 2026-02-28: Replaced "Start New Game" button with minimal red power symbol (⏻) - round, icon-only, orientation-independent
- 2026-02-28: Replaced pawn promotion modal with a small centered popup for piece selection

## License
- No explicit license provided; review assets before redistribution

