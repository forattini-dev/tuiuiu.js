# Best Practices

To build scalable, maintainable, and performant Tuiuiu applications, follow these guidelines.

## Performance

### 1. Minimize Re-renders
Use **Signals** granularly. Don't re-render the entire app if only a single text label changes.

*   **Bad:** One giant signal object for the whole app state.
*   **Good:** Separate signals for independent data (e.g., `userSignal`, `counterSignal`).

### 2. Use `createMemo` for Heavy Computations
If you have expensive logic (sorting a large table, parsing a huge log file), wrap it in `createMemo`. It will only re-calculate when inputs change.

```typescript
// Only re-sorts if 'users' or 'sortKey' changes
const sortedUsers = createMemo(() => {
  return [...users()].sort((a, b) => a[sortKey()] - b[sortKey()]);
});
```

### 3. Scrolling & Large Lists

Use `ScrollList` for scrollable lists - it provides smooth line-by-line scrolling with automatic height estimation:

```typescript
ScrollList({
  items: logs(),
  children: (log) => LogEntry({ log }),  // Render function, NOT VNode!
  height: 20,
  autoScroll: true,  // Follow new items
})
```

For chat UIs, use `ChatList` (pre-configured with `inverted: true` and `autoScroll: true`).

For very large datasets (10k+ items), use `VirtualList` which only renders visible items.

### 4. Optimize Animation
Use `useAnimation` or `createUpdateBatcher` for high-frequency updates. Avoid `setInterval` with very low delays (e.g., < 16ms).

## User Experience (UX)

### 1. Always Provide a Way Out
Always ensure the user can exit your app or current modal.
*   Bind `Ctrl+C` or `q` to exit.
*   Bind `Esc` to close modals/dialogs.

### 2. Handle Resize
Terminals are often resized. Use relative units (flexbox, percentages) rather than hardcoded rows/columns where possible.

### 3. Capabilities Fallback
Don't assume everyone has a Nerd Font or TrueColor support. Use the `getChars()` utility to fallback to ASCII automatically.

```typescript
// Good
const chars = getChars();
const arrow = chars.arrows.right; // '▶' or '>' depending on terminal
```

## Code Structure

### 1. Component Composition
Break your UI into small, reusable functions.

```typescript
// Good
function UserCard(user) { ... }
function UserList(users) { return users.map(UserCard) }
```

### 2. Logic Separation
Keep your business logic (fetching data, complex transformations) separate from your view logic (components). Use custom hooks (e.g., `useUserList()`).

### 3. Types
Use TypeScript interfaces for your Component props. It makes refactoring much safer.

```typescript
interface MyComponentProps {
  title: string;
  isActive?: boolean;
}
```

## Accessibility (a11y) in TUI

While terminals aren't screen readers in the web sense, accessibility still applies:
1.  **Contrast**: Ensure text is readable against the background. Use the `Theme` system to maintain ratios.
2.  **Keyboard Nav**: Ensure all interactive elements are reachable via keyboard (Tab, Arrows).
3.  **No Color-Only Info**: Don't rely *only* on color to convey status (e.g., red/green). Use symbols too (✔/✗).
