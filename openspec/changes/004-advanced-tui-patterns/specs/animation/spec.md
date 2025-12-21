# Animation System

## ADDED Requirements

### Requirement: Spring Animation
The system SHALL support physics-based spring animations.

#### Scenario: Create spring animation
- **WHEN** `createSpring({ mass, stiffness, damping })` is called
- **THEN** a spring animator is created with given parameters
- **AND** default values are used for missing parameters

#### Scenario: Animate to target
- **WHEN** `spring.to(targetValue)` is called
- **THEN** the value animates towards target using spring physics
- **AND** the animation follows natural motion curves

#### Scenario: Natural motion
- **WHEN** spring animation is active
- **THEN** the value may overshoot the target before settling
- **AND** the oscillation is determined by damping ratio

#### Scenario: Interruption
- **WHEN** a new target is set during animation
- **THEN** the animation redirects smoothly to new target
- **AND** current velocity is preserved

#### Scenario: Completion detection
- **WHEN** spring value is within 0.01 of target with near-zero velocity
- **THEN** the animation is considered complete
- **AND** an `onComplete` callback is invoked

---

### Requirement: Spring Presets
The system SHALL provide common spring configuration presets.

#### Scenario: Bouncy preset
- **WHEN** `SPRING_BOUNCY` is used
- **THEN** animation has low damping and visible overshoot
- **AND** feels playful and energetic

#### Scenario: Stiff preset
- **WHEN** `SPRING_STIFF` is used
- **THEN** animation has high stiffness and minimal overshoot
- **AND** feels snappy and responsive

#### Scenario: Gentle preset
- **WHEN** `SPRING_GENTLE` is used
- **THEN** animation has low stiffness and high damping
- **AND** feels smooth and relaxed

---

### Requirement: Easing Functions
The system SHALL provide standard easing functions for animations.

#### Scenario: Linear easing
- **WHEN** `easeLinear` is used
- **THEN** progress is constant throughout animation

#### Scenario: Ease in/out
- **WHEN** `easeInOut` variants are used
- **THEN** animation starts slow, speeds up, then slows down

#### Scenario: Elastic easing
- **WHEN** `easeElastic` is used
- **THEN** animation overshoots and oscillates before settling

#### Scenario: Bounce easing
- **WHEN** `easeBounce` is used
- **THEN** animation bounces like a ball hitting the ground

#### Scenario: Custom bezier
- **WHEN** `cubicBezier(x1, y1, x2, y2)` is called
- **THEN** a custom easing curve is created from control points

---

### Requirement: Animation Hooks
The system SHALL provide React-like hooks for animations.

#### Scenario: useSpring hook
- **WHEN** `const [value, api] = useSpring(config)` is called
- **THEN** a reactive animated value is returned
- **AND** the api provides start/stop/reset methods

#### Scenario: useTransition hook
- **WHEN** `const styles = useTransition(items, config)` is called
- **THEN** enter/leave animations are managed automatically
- **AND** item mounting/unmounting is animated

#### Scenario: Frame rate limiting
- **WHEN** animations are running
- **THEN** updates are capped at 60fps by default
- **AND** the limit is configurable via options

---

### Requirement: Animation Sequences
The system SHALL support chained and parallel animations.

#### Scenario: Sequential chain
- **WHEN** `sequence([anim1, anim2, anim3])` is called
- **THEN** animations run one after another
- **AND** each waits for the previous to complete

#### Scenario: Parallel group
- **WHEN** `parallel([anim1, anim2, anim3])` is called
- **THEN** all animations run simultaneously
- **AND** the group completes when all finish

#### Scenario: Staggered animation
- **WHEN** `stagger(items, { delay: 50 })` is called
- **THEN** each item's animation starts 50ms after the previous
- **AND** creates a wave effect
