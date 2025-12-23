# Tuiuiu chat - Interactive Chat Demo
# Shows chat bubbles, markdown rendering, and streaming responses

Output docs/assets/demo-chat.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.5
Set TypingSpeed 0.003s

# Run chat example
Type "pnpm tsx examples/app-chat.ts"
Enter

# Let it initialize
Sleep 1s

# Type messages (more realistic typing speed for chat)
Set TypingSpeed 0.025s
Type "Hey! What is Tuiuiu?"
Sleep 200ms
Enter
Sleep 1.2s

Type "Can it handle complex layouts?"
Sleep 200ms
Enter
Sleep 1.2s

Type "That's amazing! Zero dependencies!"
Sleep 200ms
Enter
Sleep 1.2s

# Show help command
Set TypingSpeed 0.015s
Type "/help"
Enter
Sleep 800ms

# Toggle help
Type "h"
Sleep 600ms

# Close help
Type "h"
Sleep 400ms

# Change theme
Tab
Sleep 300ms
Tab
Sleep 300ms
Tab
Sleep 400ms

# One more message
Set TypingSpeed 0.025s
Type "Love the theme switching!"
Sleep 200ms
Enter
Sleep 800ms

# Exit
Ctrl+C
Sleep 200ms
