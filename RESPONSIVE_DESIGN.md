# Responsive Design Guide

This document outlines the responsive design implementation for the Carrier Dispute System, ensuring optimal user experience across all device sizes from 320px to 1920px.

## Breakpoint System

The application uses a mobile-first approach with the following breakpoints:

| Breakpoint | Min Width | Target Devices | Grid Columns |
|------------|-----------|----------------|--------------|
| Mobile (xs) | 320px | Small phones | 1 |
| Mobile (sm) | 640px | Phones, large phones | 1-2 |
| Tablet (md) | 768px | Tablets, small laptops | 2-3 |
| Desktop (lg) | 1024px | Laptops, desktops | 3-4 |
| Large (xl) | 1280px | Large desktops | 4+ |
| Ultra-wide (2xl) | 1536px | Ultra-wide monitors | 4+ |

## Responsive Utilities

### CSS Classes

The `responsive.css` file provides comprehensive utility classes:

#### Touch Targets
- `.touch-target` - Ensures minimum 44x44px tap targets for mobile

#### Responsive Text
- `.text-responsive-xs` through `.text-responsive-3xl` - Auto-scaling typography

#### Responsive Spacing
- `.container-responsive` - Adaptive padding (16px mobile → 48px ultra-wide)
- `.gap-responsive` - Adaptive gaps (12px mobile → 24px desktop)

#### Visibility
- `.hidden-mobile` - Hide on mobile, show on desktop
- `.mobile-only` - Show only on mobile devices

### Component Patterns

#### Responsive Grids

```tsx
// Dashboard metrics: 1 col mobile, 2 cols tablet, 4 cols desktop
<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {/* Metric cards */}
</div>

// Charts: 1 col mobile, 2 cols desktop
<div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
  {/* Chart components */}
</div>
```

#### Responsive Forms

```tsx
// Two-column form on desktop, single column on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Field Name</Label>
    <Input />
  </div>
</div>

// Three-column form for amount fields
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {/* Amount inputs */}
</div>
```

#### Responsive Dialogs

```tsx
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
  {/* Dialog content */}
</DialogContent>
```

#### Responsive Tables

Two approaches are available:

1. **Horizontal Scroll** (default for data tables)
```tsx
<div className="table-responsive">
  <table>
    {/* Table content */}
  </table>
</div>
```

2. **Card Layout** (alternative for mobile)
```tsx
<div className="table-cards">
  <table>
    <tbody>
      <tr>
        <td data-label="Field Name">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Component-Specific Implementations

### Dashboard
- **Mobile (320-640px)**: Single column layout, stacked metric cards, reduced chart heights (250px)
- **Tablet (640-1024px)**: 2-column metric grid, side-by-side charts
- **Desktop (1024px+)**: 4-column metric grid, full-size charts (300px)

### Cases Page
- **Mobile**: Vertical stacked controls, full-width buttons, card-based case display
- **Tablet**: 2-column case grid, horizontal filter bar
- **Desktop**: 3-column case grid, expanded filters

### Forms (CreateCaseForm)
- **Mobile**: Single column, full-width inputs, stacked field groups
- **Tablet**: 2-column layout for paired fields, 3-column for amounts
- **Desktop**: Maintains tablet layout with increased spacing

### Navigation (DashboardLayout)
- **Mobile**: Collapsible sidebar, hamburger menu, overlay navigation
- **Desktop**: Persistent sidebar, expanded menu items

## Charts & Visualizations

All charts use `ResponsiveContainer` from Recharts:

```tsx
<ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
  <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
    {/* Chart content */}
  </BarChart>
</ResponsiveContainer>
```

- Mobile: 250px height, reduced margins
- Desktop: 300px height, standard margins

## Typography Scaling

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| H1 | 24px | 30px | 36px |
| H2 | 20px | 24px | 24px |
| H3 | 18px | 20px | 20px |
| Body | 14px | 16px | 16px |
| Small | 12px | 14px | 14px |

## Spacing System

| Property | Mobile | Tablet | Desktop | Ultra-wide |
|----------|--------|--------|---------|------------|
| Container padding | 16px | 24px | 32px | 48px |
| Card gaps | 12px | 16px | 24px | 24px |
| Form gaps | 16px | 24px | 24px | 24px |

## Touch Optimization

### Minimum Tap Targets
All interactive elements maintain a minimum 44x44px touch target on mobile devices.

### Touch-Friendly Controls
- Larger buttons on mobile (min-height: 44px)
- Increased spacing between interactive elements
- Swipe-enabled carousels and lists

## Performance Considerations

### Image Optimization
- Use `img-responsive` class for fluid images
- Implement lazy loading for off-screen images
- Serve appropriately sized images per breakpoint

### Scroll Performance
- `-webkit-overflow-scrolling: touch` for smooth scrolling
- Thin scrollbars with `.scrollbar-thin` utility
- Horizontal scroll for wide tables on mobile

## Testing Checklist

- [ ] Test on iPhone SE (320px width)
- [ ] Test on iPhone 12/13 (390px width)
- [ ] Test on iPad (768px width)
- [ ] Test on iPad Pro (1024px width)
- [ ] Test on MacBook (1280px width)
- [ ] Test on iMac (1920px width)
- [ ] Test on ultra-wide monitor (2560px width)
- [ ] Verify touch targets (minimum 44x44px)
- [ ] Test form inputs on mobile keyboards
- [ ] Verify chart responsiveness
- [ ] Test table overflow behavior
- [ ] Verify dialog/modal sizing
- [ ] Test navigation collapse/expand
- [ ] Verify all images scale properly

## Browser Compatibility

The responsive design is tested and supported on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Accessibility

All responsive implementations maintain WCAG AA compliance:
- Keyboard navigation works at all breakpoints
- Focus indicators remain visible
- Color contrast maintained across themes
- Screen reader compatibility preserved
- Touch targets meet accessibility guidelines

## Future Enhancements

- [ ] Add landscape mode optimizations for tablets
- [ ] Implement progressive web app (PWA) features
- [ ] Add print stylesheets for reports
- [ ] Optimize for foldable devices
- [ ] Add dark mode responsive adjustments
