# Tuiuiu htop - Data Mastery Demo
# Interactive process viewer with real-time sorting and live system data

Output docs/assets/demo-htop.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.2
Set TypingSpeed 0.003s

# Run htop example
Type "pnpm tsx examples/app-htop.ts"
Enter

# Let it initialize and show real processes
Sleep 2s

# === SHOWCASE: Data Mastery ===

# Navigate down the process list
Down
Sleep 120ms
Down
Sleep 120ms
Down
Sleep 120ms
Down
Sleep 120ms
Down
Sleep 400ms

# Sort by Memory (M) - watch the list reorder!
Type "M"
Sleep 1s

# Navigate to see memory hogs
Down
Sleep 120ms
Down
Sleep 120ms
Down
Sleep 400ms

# Sort by CPU (P) - instant resort
Type "P"
Sleep 1s

# Back to top
Type "g"
Sleep 600ms

# Sort by PID (N) - ascending order
Type "N"
Sleep 1s

# Let it update with live data
Sleep 1.5s

# One theme change to show adaptability
Tab
Sleep 800ms

# Exit
Type "q"
Sleep 200ms
