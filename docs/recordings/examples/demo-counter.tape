# Tuiuiu Counter - Reactive Signals Demo
# Feel the speed: instant reactive updates with zero lag

Output docs/assets/demo-counter.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.2
Set TypingSpeed 0.003s

# Run counter example
Type "pnpm tsx examples/app-counter.ts"
Enter

# Let it initialize
Sleep 800ms

# === SHOWCASE: Feel the speed ===
# Rapid burst - show signal reactivity
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 80ms
Up
Sleep 400ms

# Appreciate the result
Sleep 600ms

# Vim-style keys work too (k for up)
Type "k"
Sleep 80ms
Type "k"
Sleep 80ms
Type "k"
Sleep 400ms

# Quick decrement burst
Down
Sleep 80ms
Down
Sleep 80ms
Down
Sleep 80ms
Down
Sleep 80ms
Down
Sleep 400ms

# Pause to see the count
Sleep 500ms

# Reset to zero - satisfying snap back
Type "r"
Sleep 800ms

# One final increment to end on positive
Up
Sleep 150ms
Up
Sleep 150ms
Up
Sleep 400ms

# Exit
Ctrl+C
Sleep 200ms
