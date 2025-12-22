# Tuiuiu mtr - Network Traceroute Diagnostic
# Real-time traceroute with latency statistics and graph

Output docs/assets/demo-mtr.gif

Set Shell bash
Set FontSize 13
Set Width 1100
Set Height 700
Set Padding 15
Set PlaybackSpeed 0.5
Set TypingSpeed 0.03s

# Run mtr example targeting google.com
Type "pnpm tsx examples/app-mtr.ts google.com"
Enter

# Wait for route discovery
Sleep 4s

# Navigate through hops with arrow keys
Down
Sleep 800ms
Down
Sleep 800ms
Down
Sleep 800ms

# Let it collect data
Sleep 2s

# Cycle through themes
Tab
Sleep 1.5s
Tab
Sleep 1.5s

# Navigate back up
Up
Sleep 800ms
Up
Sleep 800ms

# Show more data collection
Sleep 2s

# Exit
Ctrl+C
Sleep 300ms
