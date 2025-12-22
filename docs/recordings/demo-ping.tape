# Tuiuiu ping - Network Latency Monitor
# Beautiful ping utility with gauges, sparklines and live graphs

Output docs/assets/demo-ping.gif

Set Shell bash
Set FontSize 13
Set Width 1100
Set Height 650
Set Padding 15
Set PlaybackSpeed 0.5
Set TypingSpeed 0.03s

# Run ping example targeting google.com
Type "pnpm tsx examples/app-ping.ts google.com"
Enter

# Let it collect initial data and show the UI
Sleep 4s

# Cycle through themes with Tab
Tab
Sleep 2s
Tab
Sleep 2s
Tab
Sleep 2s

# Let it run showing live updates with current theme
Sleep 3s

# Clear stats with 'c'
Type "c"
Sleep 2s

# Show more data collection
Sleep 3s

# Exit
Ctrl+C
Sleep 300ms
