# Navigation Hooks

Tuiuiu provides a powerful navigation system inspired by Kyma, suitable for wizards, slide decks, and pagination.

## useNavigation

Creates a linked-list navigation controller for a set of items.

### Usage

```typescript
import { useNavigation, useInput } from 'tuiuiu.js';

function Wizard() {
  const nav = useNavigation([
    { id: 'step1', title: 'Welcome' },
    { id: 'step2', title: 'Terms' },
    { id: 'step3', title: 'Finish' },
  ]);

  useInput((_, key) => {
    if (key.rightArrow) nav.next();
    if (key.leftArrow) nav.prev();
  });

  const current = nav.current();

  return Box({},
    Text({}, `Step ${current.index + 1}: ${current.data.title}`)
  );
}
```

### API

The `nav` object returned provides:

- **Traversal**: `next()`, `prev()`, `first()`, `last()`, `goTo(index)`
- **State**: `current()` (reactive), `currentIndex()`, `isFirst()`, `isLast()`
- **History**: `back()`, `history()`

## createWizard

A specialized version of navigation that adds validation and completion tracking.

### Usage

```typescript
import { createWizard } from 'tuiuiu.js';

const wizard = createWizard([
  { 
    id: 'email', 
    title: 'Enter Email',
    validate: async () => isValidEmail(email()) 
  },
  { id: 'done', title: 'Done' }
]);

// ... inside component ...
async function handleNext() {
  const isValid = await wizard.validateCurrent();
  if (isValid) {
    wizard.next();
  }
}
```

## createPagination

Helper to paginate a flat array of items.

### Usage

```typescript
import { createPagination } from 'tuiuiu.js';

const items = ['a', 'b', 'c', 'd', 'e'];
const paged = createPagination(items, { perPage: 2 });

console.log(paged.items()); // ['a', 'b']
paged.next();
console.log(paged.items()); // ['c', 'd']
```
