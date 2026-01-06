# Tuiuiu Player - Terminal Music Player (Compact)
# Quick showcase of waveform, playlist, and controls

Output docs/recordings/examples/demo-player.gif

Set Shell bash
Set FontSize 14
Set Width 1400
Set Height 900
Set Padding 20
Set PlaybackSpeed 2.5
Set TypingSpeed 0.001s
Set Framerate 30

# Run the player
Type "pnpm tsx examples/tuiuiu-player.ts"
Enter

# Show waveform animation
Sleep 2s

# Navigate playlist
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 1.5s

# Pause/Play
Type " "
Sleep 500ms
Type " "
Sleep 1s

# Next track
Type "n"
Sleep 1s

# Change theme twice
Type "t"
Sleep 800ms
Type "t"
Sleep 800ms

# Volume
Type "+"
Sleep 150ms
Type "+"
Sleep 150ms
Type "+"
Sleep 500ms

# Mute/unmute
Type "m"
Sleep 400ms
Type "m"
Sleep 800ms

# Exit
Type "q"
Sleep 200ms
