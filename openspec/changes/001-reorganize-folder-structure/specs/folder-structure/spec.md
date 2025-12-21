# Spec: Folder Structure

## Capability
`folder-structure`

## Description
Defines the layered folder structure for tuiuiu source code organization.

---

## ADDED Requirements

### Requirement: Layered Architecture
The codebase MUST be organized into distinct layers with clear dependencies.

#### Scenario: Layer 0 - Primitives
**Given** the `src/primitives/` directory exists
**When** files are placed in this layer
**Then** they MUST only contain reactive primitives (Signal, Effect, etc.)
**And** they MUST NOT import from design-system or app layers
**And** they MAY import from utils

#### Scenario: Layer 1 - Design System
**Given** the `src/design-system/` directory exists
**When** files are placed in this layer
**Then** they MUST be organized by category (primitives, forms, feedback, etc.)
**And** they MAY import from primitives layer
**And** they MAY import from utils
**And** they MUST NOT import from app layer

#### Scenario: Layer 2 - Application
**Given** the `src/app/` directory exists
**When** files are placed in this layer
**Then** they MUST contain application-level concerns (render loop, focus, input)
**And** they MAY import from any layer below (primitives, design-system)
**And** they MAY import from utils and hooks

---

### Requirement: Design System Categories
The design system MUST be organized into logical component categories.

#### Scenario: Core Category
**Given** the `src/design-system/core/` directory exists
**Then** it MUST contain rendering engine components
**And** it MUST include `renderer.ts` for VNode → ANSI conversion
**And** it MUST include `layout.ts` for flexbox calculations

#### Scenario: Primitives Category
**Given** the `src/design-system/primitives/` directory exists
**Then** it MUST contain basic building block components
**And** it MUST include Box, Text, Spacer components
**And** components MUST be pure functions returning VNode

#### Scenario: Forms Category
**Given** the `src/design-system/forms/` directory exists
**Then** it MUST contain user input components
**And** it MUST include TextInput, Select components
**And** components MUST follow dual API pattern (createX + renderX)

#### Scenario: Feedback Category
**Given** the `src/design-system/feedback/` directory exists
**Then** it MUST contain user feedback components
**And** it MUST include Spinner, ProgressBar, Badge components

#### Scenario: Data Display Category
**Given** the `src/design-system/data-display/` directory exists
**Then** it MUST contain data presentation components
**And** it MUST include Table, CodeBlock, Markdown components

#### Scenario: Overlays Category
**Given** the `src/design-system/overlays/` directory exists
**Then** it MUST contain layered UI components
**And** it MUST include Modal component

#### Scenario: Layout Category
**Given** the `src/design-system/layout/` directory exists
**Then** it MUST contain layout utility components
**And** it MUST include SplitPanel component

---

### Requirement: Index Files
Each directory MUST have an index.ts that exports all public APIs.

#### Scenario: Directory Export
**Given** a directory with multiple TypeScript files
**When** the index.ts file is created
**Then** it MUST re-export all public types and functions
**And** it MUST NOT export internal implementation details
**And** users MUST be able to import from the index

#### Scenario: Main Index
**Given** the `src/index.ts` file exists
**When** a user imports from 'tuiuiu'
**Then** they MUST have access to all public APIs
**And** backward compatibility MUST be maintained

---

### Requirement: No Circular Dependencies
The layered structure MUST prevent circular dependencies.

#### Scenario: Layer Direction
**Given** three layers (primitives, design-system, app)
**When** imports are analyzed
**Then** lower layers MUST NOT import from higher layers
**And** TypeScript compilation MUST succeed without circular dependency warnings

---

## Testing Requirements

#### Scenario: Structure Verification
**Given** the reorganization is complete
**When** running `pnpm exec tsc --noEmit`
**Then** compilation MUST succeed with no errors

#### Scenario: Test Suite
**Given** the reorganization is complete
**When** running `pnpm test:run`
**Then** all existing tests MUST pass

#### Scenario: Verification Script
**Given** the reorganization is complete
**When** running `pnpm exec tsx scripts/verify.ts`
**Then** all verifications MUST pass
