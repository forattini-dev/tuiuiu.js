# Tuiuiu mtr - Network Traceroute Tool
# Real-time network diagnostics with hop visualization and latency charts

Output docs/assets/demo-mtr.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.5
Set TypingSpeed 0.003s

# Run mtr example with a target
Type "pnpm tsx examples/app-mtr.ts github.com"
Enter

# Let it discover route and collect initial data
Sleep 3s

# Navigate hops to show selection
Down
Sleep 150ms
Down
Sleep 150ms
Down
Sleep 150ms
Down
Sleep 200ms

# Go back up
Up
Sleep 150ms
Up
Sleep 200ms

# Quick theme cycle
Tab
Sleep 200ms
Tab
Sleep 200ms
Tab
Sleep 300ms

# Let metrics accumulate
Sleep 1.5s

# Exit
Ctrl+C
Sleep 200ms
