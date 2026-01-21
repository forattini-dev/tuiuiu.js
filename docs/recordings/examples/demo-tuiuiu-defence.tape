# Tuiuiu Defence - Terminal Tower Defense Game
# A complete tower defense game built with Tuiuiu.js
# Features: Path-following monsters, tower placement, upgrades, waves, economy

Output docs/recordings/examples/demo-tuiuiu-defence.gif

Set Shell "bash"
Set FontSize 12
Set Width 1800
Set Height 1000
Set Padding 10
Set PlaybackSpeed 1.0
Set TypingSpeed 50ms
Set Framerate 30

# Start the game
Type "pnpm tsx examples/tuiuiu-defence.ts"
Enter
Sleep 3s

# Menu is showing - Start Game is already selected
# Press Enter to start
Enter
Sleep 2s

# Game started! Build towers
# Move cursor to find buildable spots
Sleep 1s

# Navigate down to find a good spot
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 500ms

# Move right towards path
Right
Right
Right
Right
Right
Sleep 500ms

# Build a tower with 'b'
Type "b"
Sleep 1s

# Move to another spot
Down
Down
Down
Right
Right
Right
Sleep 500ms

# Build another tower
Type "b"
Sleep 1s

# Move to third spot
Down
Down
Down
Left
Left
Sleep 500ms

# Build third tower
Type "b"
Sleep 1s

# Watch the game - monsters spawning and being attacked
Sleep 8s

# Move to a tower to upgrade
Up
Up
Up
Up
Up
Right
Right
Sleep 500ms

# Upgrade the tower
Type "u"
Sleep 1s

# Watch more gameplay
Sleep 6s

# Exit the game
Type "q"
Sleep 500ms
