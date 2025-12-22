# Tuiuiu mtr - Network Traceroute Tool
# Real-time network diagnostics with hop selection and theme cycling

Output docs/assets/demo-mtr.gif

Set Shell bash
Set FontSize 13
Set Width 1100
Set Height 700
Set Padding 15
Set PlaybackSpeed 0.5
Set TypingSpeed 0.005s

# Run mtr example (fast typing)
Type "pnpm tsx examples/app-mtr.ts google.com"
Enter

# Let it discover route and collect data
Sleep 5s

# Navigate hops
Down
Sleep 300ms
Down
Sleep 300ms
Down
Sleep 300ms
Up
Sleep 300ms

# Cycle through all 11 themes with Tab (0.5s each)
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 500ms

# Exit
Ctrl+C
Sleep 300ms
