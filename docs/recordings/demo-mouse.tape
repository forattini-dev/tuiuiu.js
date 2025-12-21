# Tuiuiu Mouse Demo
# Full mouse support: click, hover, scroll

Output docs/assets/demo-mouse.gif

Set Shell bash
Set FontSize 14
Set Width 900
Set Height 550
Set Padding 15
Set PlaybackSpeed 0.5
Set TypingSpeed 0.03s

# Run event system example (has mouse events)
Type "pnpm example:17"
Enter

Sleep 1.5s

# Simulate mouse interactions with keyboard (arrow keys)
# Since VHS doesn't support real mouse, we show keyboard nav
Up
Sleep 300ms
Down
Sleep 300ms
Left
Sleep 300ms
Right
Sleep 300ms

# Click simulation
Enter
Sleep 500ms

# More navigation
Tab
Sleep 300ms
Tab
Sleep 300ms
Enter
Sleep 1s

# Exit
Ctrl+C
Sleep 300ms
