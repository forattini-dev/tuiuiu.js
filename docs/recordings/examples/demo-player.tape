# Tuiuiu Player - Terminal Music Player
# Winamp-inspired player with waveform visualization, playlist, and controls

Output docs/recordings/examples/demo-player.gif

Set Shell bash
Set FontSize 14
Set Width 1400
Set Height 900
Set Padding 20
Set PlaybackSpeed 1.0
Set TypingSpeed 0.003s

# Run the player
Type "pnpm tsx examples/tuiuiu-player.ts"
Enter

# Let waveform fade-in and show initial animation
Sleep 5s

# Navigate playlist with arrow keys
Down
Sleep 500ms
Down
Sleep 500ms
Down
Sleep 500ms

# Select track (Enter)
Enter
Sleep 3s

# Pause
Type " "
Sleep 1.5s

# Play
Type " "
Sleep 3s

# Next track
Type "n"
Sleep 3s

# Change theme
Type "t"
Sleep 2s

Type "t"
Sleep 2s

# Adjust volume
Type "+"
Sleep 300ms
Type "+"
Sleep 300ms
Type "+"
Sleep 1s

# Mute/unmute
Type "m"
Sleep 1s
Type "m"
Sleep 2s

# Exit
Type "q"
Sleep 500ms
