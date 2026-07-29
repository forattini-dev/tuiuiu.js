# Styling: typed terminal props, not browser CSS

Tuiuiu does not use a browser, DOM, CSS files, CSS-in-JS, or a web cascade to
render applications. The normal and recommended styling API is the typed
object passed directly to components:

```typescript
Box(
  {
    flexDirection: 'row',
    gap: 1,
    padding: 1,
    borderStyle: 'round',
    borderColor: 'primary',
  },
  Text({ color: 'success', bold: true }, 'Ready')
)
```

Layout values are measured in terminal cells. Names such as `flexDirection`
are familiar from flexbox, but their implementation and supported values are
owned by Tuiuiu.

## Themes

Use semantic colors such as `primary`, `success`, `warning`, and
`destructive` so components adapt to the active terminal theme. Calling
`setTheme()` is optional; Tuiuiu has a default theme.

## About TCSS

The repository contains an opt-in parser historically named TCSS. It is a
standalone terminal style-rule resolver, not browser CSS, and it is not
automatically applied by `render()`, `Box()`, or `Text()`.

Applications should only import it when they explicitly want to resolve a
rule string into component props:

```typescript
import { applyStyles } from 'tuiuiu.js/styling'
import { Box, Text } from 'tuiuiu.js'

const panelProps = applyStyles(
  '.panel { padding: 1; border-color: cyan; }',
  { type: 'Box', classes: ['panel'] }
)

Box(panelProps, Text({}, 'Resolved explicitly'))
```

For new applications, typed component props and themes are the primary API.
