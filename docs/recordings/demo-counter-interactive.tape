# docs/recordings/demo-counter-interactive.tape

# Output to GIF
Output docs/assets/demo-counter-interactive.gif

# Window Settings
Set FontSize 16
Set Width 800
Set Height 400
Set Padding 20
Set FontFamily "JetBrains Mono"
Set PlaybackSpeed 0.75
Set TypingSpeed 0.15s

# Start the counter example
Type "pnpm run example:01"
Enter
Sleep 2s

# Increment a few times
Type "k"
Sleep 500ms
Type "k"
Sleep 500ms
Type "up" # Using arrow key
Sleep 500ms
Type "up"
Sleep 500ms

# Reset
Type "r"
Sleep 1s

# Decrement a few times
Type "j"
Sleep 500ms
Type "j"
Sleep 500ms
Type "down" # Using arrow key
Sleep 500ms
Type "down"
Sleep 500ms

# Exit the application using Ctrl+C
Ctrl+C
Sleep 1s
