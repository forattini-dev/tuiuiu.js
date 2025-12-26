# Tuiuiu Chat - Beautiful Bubbles & Theme Showcase
# WhatsApp-style chat interface with live theme switching

Output docs/recordings/examples/demo-chat.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.2
Set TypingSpeed 0.003s

# Run chat example
Type "pnpm tsx examples/app-chat.ts"
Enter

# Let it initialize
Sleep 1s

# === SHOWCASE: Chat Bubbles + Themes ===

# First message - natural typing
Set TypingSpeed 0.03s
Type "Hello! What is Tuiuiu?"
Enter
Sleep 800ms

# Second message
Type "That's amazing - zero dependencies!"
Enter
Sleep 800ms

# Third message
Type "Love the chat bubbles design"
Enter
Sleep 600ms

# Now showcase themes - deliberate, appreciable transitions
Tab
Sleep 600ms
Tab
Sleep 600ms
Tab
Sleep 600ms
Tab
Sleep 600ms
Tab
Sleep 600ms

# One more message in new theme
Type "Themes are gorgeous!"
Enter
Sleep 800ms

# Cycle a few more themes to show variety
Tab
Sleep 500ms
Tab
Sleep 500ms
Tab
Sleep 800ms

# Exit
Ctrl+C
Sleep 200ms
