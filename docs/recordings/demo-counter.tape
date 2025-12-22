# Tuiuiu counter - Basic Counter Example
# Simple reactive counter with keyboard controls

Output docs/assets/demo-counter.gif

Set FontSize 12
Set Width 800
Set Height 450
Set Padding 20
Set PlaybackSpeed 0.75
Set TypingSpeed 0.005s

# Run counter example (fast typing)
Type "pnpm tsx examples/app-counter.ts"
Enter

# Let it initialize
Sleep 1s

# Increment a few times
Up
Sleep 400ms
Up
Sleep 400ms
Up
Sleep 400ms
Type "k"
Sleep 400ms

# Decrement
Down
Sleep 400ms
Type "j"
Sleep 400ms

# Reset
Type "r"
Sleep 1s

# Exit
Ctrl+C
Sleep 500ms
