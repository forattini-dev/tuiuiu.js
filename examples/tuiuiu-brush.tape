# Tuiuiu Brush Demo - tuiuiu.js
# A nostalgic recreation of Windows 95/98 MS Paint
# Press 'd' to draw "tuiuiu.js" logo automatically

Output examples/tuiuiu-brush.gif

Set Shell "bash"
Set FontSize 12
Set Width 1800
Set Height 1000
Set Padding 10
Set Theme "Builtin Light"
Set TypingSpeed 50ms
Set PlaybackSpeed 1.0

# Start the app
Type "pnpm example examples/tuiuiu-brush.ts"
Enter
Sleep 3s

# Draw the "tuiuiu.js" logo pixel by pixel (press 'd' for demo)
Type "d"
Sleep 4s

# Cycle through tools to show the MS Paint interface
# Press 2 for Line tool
Type "2"
Sleep 700ms

# Press 3 for Rectangle tool
Type "3"
Sleep 700ms

# Press 4 for Circle tool
Type "4"
Sleep 700ms

# Press 5 for Fill bucket
Type "5"
Sleep 700ms

# Press 6 for Eraser
Type "6"
Sleep 700ms

# Back to Pencil (default)
Type "1"
Sleep 1s

# Show the logo a bit longer
Sleep 2s

# Clear canvas to show it works
Type "c"
Sleep 1s

# Final pause
Sleep 1s

# Exit
Type "q"
Sleep 500ms
