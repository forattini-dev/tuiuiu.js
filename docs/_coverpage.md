# 🐦 Tuiuiu

> Terminal UI Framework for the Modern Era

**Zero dependencies** • **Signal reactivity** • **50+ components** • **Full mouse support**

Build beautiful, reactive terminal apps with a familiar component API.

```typescript
import { render, Box, Text, useState, useInput } from 'tuiuiu.js';

const { waitUntilExit } = render(() =>
  Box({ padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    Text({ bold: true }, '🐦 Hello, Tuiuiu!')
  )
);
```

[Get Started](#quick-example)
[GitHub](https://github.com/forattini-dev/tuiuiu.js)
