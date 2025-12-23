# Tuiuiu ping - Network Latency Monitor
# Real-time ping visualization with statistics and latency graph

Output docs/assets/demo-ping.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.5
Set TypingSpeed 0.003s

# Run ping example
Type "pnpm tsx examples/app-ping.ts 8.8.8.8"
Enter

# Let it collect initial ping data
Sleep 3s

# Clear stats to show the feature
Type "c"
Sleep 1.5s

# Theme cycling to show visual variety
Tab
Sleep 200ms
Tab
Sleep 200ms
Tab
Sleep 200ms
Tab
Sleep 300ms

# Let more data accumulate
Sleep 1.5s

# Exit
Ctrl+C
Sleep 200ms
