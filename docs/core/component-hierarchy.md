# Component Hierarchy

This project follows a strict atomic design taxonomy. Every exported UI component is classified into exactly one layer.

## Layer Rules

- **Primitives**: Stateless render helpers (Box, Text, Spacer) and low level layout nodes.
- **Atoms**: Small interactive UI units that do not render other atoms, molecules, organisms, or templates.
- **Molecules**: Compositions of atoms that form a single functional control.
- **Organisms**: Larger UI sections that combine multiple atoms and molecules.
- **Templates**: Page level layout scaffolds and application shells.

## Composition Boundary

- Atoms MUST NOT render other atoms, molecules, organisms, or templates.
- If a component wraps another component, it MUST be classified at least one layer higher.

## What Counts As A Component

A component is any exported function that returns a VNode or a renderable UI element. Utilities, state factories, and constants are not considered components and are excluded from storybook coverage.

## Legacy Exports

Some components may be re-exported for backward compatibility. Classification is based on the component's source layer, not the re-export path. Storybook grouping always follows the classification rules above.
