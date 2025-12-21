Output docs/assets/demo-counter.gif

Set FontSize 12
Set Width 800
Set Height 450
Set Padding 20
# Set FontFamily "JetBrains Mono" # Removed to use system default for better compatibility

Set PlaybackSpeed 0.75
Set TypingSpeed 0.05s # Make typing faster

Type "pnpm run example:01"
Enter

Sleep 1s

# Simulate some interaction if your basic counter example has any
# For a simple counter, we might just let it run or press a key if it responds to input
# Since the basic counter example might just display, we'll observe it for a bit.
# If it has controls to increment/decrement, we could add:
# Type "arrowright" # example for increment
# Sleep 1s
# Type "arrowleft"  # example for decrement

# Let it display for a few seconds
Sleep 2.5s

# Exit the application using Ctrl+C
Ctrl+C
Sleep 500ms
