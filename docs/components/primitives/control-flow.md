# Control Flow

Components for conditional rendering and iteration without JSX.

## When (Conditional)

Render children only when condition is true:

```typescript
import { When } from 'tuiuiu.js';

When(isLoading(), Spinner({ label: 'Loading...' }))

When(error(),
  Text({ color: 'red' }, `Error: ${error()}`)
)

// With else
When(
  loggedIn(),
  Text({}, `Welcome, ${user().name}!`),
  Text({}, 'Please log in')
)
```

### Usage Pattern

```typescript
function Status({ loading, error, data }) {
  return Box({ flexDirection: 'column' },
    When(loading(), Spinner()),
    When(error(), Text({ color: 'red' }, error())),
    When(data(), DataView({ data: data() }))
  );
}
```

## Each (Iteration)

Render a list of items:

```typescript
import { Each } from 'tuiuiu.js';

Each(items(), (item, index) =>
  Text({ key: item.id }, `${index + 1}. ${item.name}`)
)

// With empty state
Each(
  items(),
  (item) => ListItem({ item }),
  () => Text({ color: 'gray' }, 'No items yet')
)
```

### With Keys

Always provide a unique key for efficient updates:

```typescript
Each(users(), (user) =>
  Box({ key: user.id },
    Text({}, user.name),
    Text({ color: 'gray' }, user.email)
  )
)
```

## Transform

Apply a transformation to children:

```typescript
import { Transform } from 'tuiuiu.js';

// Add prefix to all text
Transform(
  (text) => `→ ${text}`,
  Box({},
    Text({}, 'First item'),
    Text({}, 'Second item')
  )
)
```

## Static

Prevent re-renders of static content:

```typescript
import { Static } from 'tuiuiu.js';

// This header never re-renders
Static({},
  Box({ borderStyle: 'double', padding: 1 },
    Text({ bold: true }, 'Application Header')
  )
)
```

Useful for:
- Headers that don't change
- Log output that should persist
- Performance optimization

## Slot

Named slots for component composition:

```typescript
import { Slot } from 'tuiuiu.js';

function Card({ header, footer, children }) {
  return Box({ flexDirection: 'column', borderStyle: 'round' },
    Slot('header', header),
    Box({ padding: 1 }, children),
    Slot('footer', footer)
  );
}

// Usage
Card({
  header: Text({ bold: true }, 'Card Title'),
  footer: Text({ color: 'gray' }, 'Footer text'),
  children: Text({}, 'Card content goes here')
})
```

## Fragment

Group elements without adding a wrapper:

```typescript
import { Fragment } from 'tuiuiu.js';

Fragment(
  Text({}, 'Line 1'),
  Text({}, 'Line 2'),
  Text({}, 'Line 3')
)

// Equivalent to returning multiple elements
// without an extra Box wrapper
```

## Combining Control Flow

```typescript
function UserList({ users, loading, error }) {
  return Box({ flexDirection: 'column' },
    When(loading(),
      Spinner({ label: 'Loading users...' })
    ),

    When(error(),
      Text({ color: 'red' }, `Error: ${error()}`)
    ),

    When(users()?.length > 0,
      Each(users(), (user) =>
        Box({ key: user.id, padding: 1, borderStyle: 'single' },
          Text({ bold: true }, user.name),
          Text({ color: 'gray' }, user.email)
        )
      ),
      // Empty state (when users is empty array)
      Text({ color: 'gray', dim: true }, 'No users found')
    )
  );
}
```

## API Reference

### When

```typescript
function When(
  condition: boolean,
  thenContent: VNode,
  elseContent?: VNode
): VNode | null
```

### Each

```typescript
function Each<T>(
  items: T[],
  render: (item: T, index: number) => VNode,
  fallback?: () => VNode
): VNode[]
```

### Static

```typescript
function Static(
  props: { id?: string },
  ...children: VNode[]
): VNode
```

### Fragment

```typescript
function Fragment(...children: VNode[]): VNode[]
```
