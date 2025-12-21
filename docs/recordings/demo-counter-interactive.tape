# docs/recordings/demo-counter-interactive.tape

# Output to GIF
Output docs/assets/demo-counter-interactive.gif

# Window Settings
Set FontSize 12
Set Width 800
Set Height 450
Set Padding 20
# Set FontFamily "JetBrains Mono" # Removed to use system default for better compatibility

Set PlaybackSpeed 0.75
Set TypingSpeed 0.05s

# Start the counter example
Type "pnpm run example:01"
Enter
Sleep 1s

# Increment a few times
Type "k"
Sleep 200ms
Type "k"
Sleep 200ms
Type "up" # Using arrow key
Sleep 200ms
Type "up"
Sleep 200ms

# Reset
Type "r"
Sleep 500ms

# Decrement a few times
Type "j"
Sleep 200ms
Type "j"
Sleep 200ms
Type "down" # Using arrow key
Sleep 200ms
Type "down"
Sleep 200ms

# Exit the application using Ctrl+C
Ctrl+C
Sleep 500ms
