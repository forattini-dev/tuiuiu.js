# Tuiuiu MTR - Network Discovery Demo
# Watch the route unfold as hops are progressively discovered

Output docs/assets/demo-mtr.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.2
Set TypingSpeed 0.003s

# Run mtr with a target
Type "pnpm tsx examples/app-mtr.ts google.com"
Enter

# === SHOWCASE: Network Discovery ===

# Let hops be discovered progressively - this is the magic
Sleep 4s

# Navigate to see hop details (minimal interaction)
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 400ms

# Go back up
Up
Sleep 200ms
Up
Sleep 400ms

# Let more data accumulate - watch latency update
Sleep 2s

# One theme change
Tab
Sleep 800ms

# Final observation
Sleep 1.5s

# Exit
Ctrl+C
Sleep 200ms
