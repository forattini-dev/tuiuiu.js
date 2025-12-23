# Tuiuiu counter - Basic Counter Example
# Demonstrates reactive signals with keyboard controls

Output docs/assets/demo-counter.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.5
Set TypingSpeed 0.003s

# Run counter example
Type "pnpm tsx examples/app-counter.ts"
Enter

# Let it initialize
Sleep 800ms

# Rapid increment sequence - counting up fast
Up
Sleep 150ms
Up
Sleep 150ms
Up
Sleep 150ms
Type "k"
Sleep 150ms
Type "k"
Sleep 150ms
Up
Sleep 150ms
Up
Sleep 150ms
Type "k"
Sleep 150ms
Up
Sleep 150ms
Up
Sleep 300ms

# Decrement sequence
Down
Sleep 150ms
Down
Sleep 150ms
Type "j"
Sleep 150ms
Type "j"
Sleep 300ms

# Reset to zero
Type "r"
Sleep 500ms

# Final increment
Up
Sleep 200ms
Up
Sleep 200ms
Up
Sleep 400ms

# Exit
Ctrl+C
Sleep 200ms
