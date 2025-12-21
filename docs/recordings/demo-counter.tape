Output docs/assets/demo-counter.gif

Set FontSize 16
Set Width 800
Set Height 400
Set Padding 20
Set FontFamily "JetBrains Mono"
Set PlaybackSpeed 0.75
Set TypingSpeed 0.15s # Make typing a bit slower for better visualization

Type "pnpm run example:01"
Enter

Sleep 2s

# Simulate some interaction if your basic counter example has any
# For a simple counter, we might just let it run or press a key if it responds to input
# Since the basic counter example might just display, we'll observe it for a bit.
# If it has controls to increment/decrement, we could add:
# Type "arrowright" # example for increment
# Sleep 1s
# Type "arrowleft"  # example for decrement

# Let it display for a few seconds
Sleep 5s

# Exit the application using Ctrl+C
Ctrl+C
Sleep 1s
