# Accessibility Guide

This document outlines the accessibility features implemented in the Carrier Dispute System to ensure WCAG 2.1 Level AA compliance.

## Overview

The system is designed to be accessible to all users, including those using assistive technologies like screen readers, keyboard-only navigation, and users with visual impairments.

## Keyboard Navigation

### Skip Links
- **Implementation**: `SkipLinks` component in `App.tsx`
- **Usage**: Press `Tab` on page load to reveal skip links
- **Links**:
  - Skip to main content (`#main-content`)
  - Skip to navigation (`#navigation`)

### Focus Management
- All interactive elements are keyboard accessible
- Proper tab order follows visual layout
- Focus indicators visible on keyboard navigation only (`:focus-visible`)
- Escape key closes dialogs and modals

### Focus Indicators
- **Buttons**: 2px outline with 4px shadow glow (`btn-focus` class)
- **Form Inputs**: 2px outline with 3px shadow glow (`input-focus` class)
- **Links**: 2px outline with 4px offset (`link-focus` class)
- **Cards**: 2px outline with 4px shadow glow (`card-focus` class)

## Screen Reader Support

### ARIA Labels
- Navigation: `<nav role="navigation" aria-label="Main navigation">`
- Main content: `<main role="main" aria-label="Main content">`
- Buttons and links have descriptive labels

### ARIA Live Regions
- Dynamic content updates announced to screen readers
- **Polite**: Non-urgent updates (`aria-live-polite` class)
- **Assertive**: Urgent updates (`aria-live-assertive` class)

### Semantic HTML
- Proper use of `<nav>`, `<main>`, `<button>`, `<a>`, etc.
- Heading hierarchy (`h1` → `h2` → `h3`)
- Form labels associated with inputs (`htmlFor`/`id`)

### Screen Reader Only Content
- `.sr-only` class hides content visually but keeps it accessible
- `.sr-only-focusable` makes content visible when focused

## Color Contrast

### WCAG AA Requirements
- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text** (18pt+): 3:1 contrast ratio minimum
- **UI components**: 3:1 contrast ratio minimum

### Implementation
- All text uses `hsl(var(--foreground))` on `hsl(var(--background))`
- Status colors include text indicators (not color alone):
  - Success: ✓ prefix
  - Error: ✗ prefix
  - Warning: ⚠ prefix
  - Info: ℹ prefix

### High Contrast Mode
- Increased outline widths (3px)
- Increased border widths (2px)
- Enhanced focus indicators

## Form Accessibility

### Labels
- All inputs have associated `<label>` elements
- Labels use `htmlFor` attribute matching input `id`
- Required fields marked with asterisk (`required-indicator` class)

### Error Handling
- Error messages use `error-message` class
- Invalid inputs styled with `input-invalid` class
- Error messages include icon for visual indication
- ARIA attributes for error announcement

### Success Feedback
- Success messages use `success-message` class
- Valid inputs styled with `input-valid` class
- Success messages include icon for visual indication

## Responsive Design

### Touch Targets
- Minimum 44px × 44px touch targets on mobile
- `touch-target` utility class ensures proper sizing
- Adequate spacing between interactive elements

### Mobile Accessibility
- Collapsible navigation on mobile
- Touch-friendly controls
- Responsive focus indicators

## Motion Preferences

### Reduced Motion
- Respects `prefers-reduced-motion` media query
- Animations disabled or reduced for users who prefer less motion
- Transitions set to 0.01ms when reduced motion is preferred

## Testing

### Keyboard Testing
1. Navigate with `Tab` key
2. Activate with `Enter` or `Space`
3. Close dialogs with `Escape`
4. Use arrow keys in menus

### Screen Reader Testing
- **NVDA** (Windows): Free, open-source
- **JAWS** (Windows): Commercial
- **VoiceOver** (macOS/iOS): Built-in
- **TalkBack** (Android): Built-in

### Color Contrast Testing
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome DevTools**: Lighthouse accessibility audit
- **axe DevTools**: Browser extension

### Automated Testing
```bash
# Run accessibility tests
npm run test:a11y

# Run Lighthouse audit
npm run lighthouse
```

## Accessibility Utilities

### CSS Classes

#### Focus Indicators
- `.focus-visible-ring` - Base focus ring (2px outline)
- `.btn-focus` - Enhanced button focus
- `.input-focus` - Enhanced input focus
- `.link-focus` - Enhanced link focus
- `.card-focus` - Enhanced card focus
- `.keyboard-focus` - Focus only on keyboard navigation

#### Screen Reader
- `.sr-only` - Hide visually, keep for screen readers
- `.sr-only-focusable` - Show when focused
- `.not-sr-only` - Opposite of sr-only

#### Form States
- `.required-indicator` - Adds asterisk for required fields
- `.error-message` - Error message styling
- `.success-message` - Success message styling
- `.input-invalid` - Invalid input styling
- `.input-valid` - Valid input styling

#### Status Indicators
- `.status-success` - Success with ✓ prefix
- `.status-error` - Error with ✗ prefix
- `.status-warning` - Warning with ⚠ prefix
- `.status-info` - Info with ℹ prefix

## Best Practices

### Do's
✅ Use semantic HTML elements
✅ Provide text alternatives for images
✅ Ensure sufficient color contrast
✅ Make all functionality keyboard accessible
✅ Provide clear focus indicators
✅ Use ARIA labels when needed
✅ Test with real assistive technologies

### Don'ts
❌ Don't use color alone to convey information
❌ Don't remove focus indicators
❌ Don't use `div` or `span` for buttons
❌ Don't auto-play audio or video
❌ Don't use `tabindex` values greater than 0
❌ Don't rely on mouse-only interactions

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

## Support

For accessibility issues or suggestions, please contact the development team or file an issue in the project repository.
