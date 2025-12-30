# Compounding Lenses Marketing Section

## Overview

A new landing page section that showcases Budget Buddy's "Compounding Impact Modeling" feature through interactive financial strategy "Lenses." Users can explore how different popular money management philosophies would play out with their real finances.

## Location

### Marketing Section
- **Component**: `src/components/landing/CompoundingLensesSection.tsx`
- **Integrated in**: `src/components/pages/Landing.tsx` (between Features and Pricing sections)
- **Public URL**: Available on landing page at `/`

### App Feature (Authenticated)
- **Page Component**: `src/components/pages/CompoundingLens.tsx`
- **Route**: `/compounding-lens`
- **Navigation**: Added to sidebar with Sparkles icon
- **Layout**: Uses AppLayout wrapper for authenticated users

## Features

### 1. Six Financial Lenses

Each lens represents a different financial strategy with realistic projected outcomes:

1. **Ramsey Lens** (Snowball) - Focus on motivation through quick wins
2. **Avalanche** - Mathematically optimal (highest APR first)
3. **50/30/20** - Balanced lifestyle approach
4. **Pay Yourself First** - Aggressive savings priority
5. **FIRE / Early Freedom** - Extreme saving for early retirement
6. **Safety-First Runway** ⭐ (Budget Buddy original, recommended)

### 2. Interactive UI Elements

- **Lens Picker**: Horizontally scrollable tabs (mobile-friendly) showing all 6 lenses
- **Single Mode**: Deep dive into one lens with rules and 6 projected stats
- **Compare Mode**: Side-by-side comparison of 3 lenses (Ramsey, Avalanche, Safety-First)
- **Compare Toggle**: Switch between Single and Compare views

### 3. Data Model

Each lens includes:
- ID, name, icon (from Lucide)
- Tagline
- 3 strategy rules
- 6 projected stats (with optional subtext)
- "Best for" description
- Recommended flag (for Safety-First)

### 4. Design System Compliance

Matches existing landing page aesthetic:
- White background with subtle gray borders
- Rounded corners (12-16px)
- Soft shadows
- Mint/teal accent color (via `--primary`)
- Generous whitespace
- Clean typography hierarchy
- Framer Motion animations (fade/slide transitions)
- Mobile-responsive grid layouts

## Usage

The section is automatically included in the landing page. To view:

```bash
npm run dev
# Visit http://localhost:3000
# Scroll to "See what small changes become"
```

## Customization

### Add a New Lens

Edit `src/components/landing/CompoundingLensesSection.tsx`:

```typescript
const lenses: Lens[] = [
  // ... existing lenses
  {
    id: "your-lens",
    name: "Your Strategy Name",
    icon: YourIcon, // from lucide-react
    tagline: "Short description",
    rules: [
      "Rule 1",
      "Rule 2",
      "Rule 3",
    ],
    stats: [
      { label: "Debt-free date", value: "Dec 2028", subtext: "36 months" },
      { label: "Interest saved", value: "$4,200" },
      // ... more stats
    ],
    bestFor: "your target user",
    recommended: false,
  },
];
```

### Change Compare Lenses

By default, Compare mode shows Ramsey, Avalanche, and Safety-First. To change:

```typescript
const compareLenses = lenses.filter((l) =>
  ["your-id-1", "your-id-2", "your-id-3"].includes(l.id)
);
```

### Modify Copy

Key text elements in the component:
- **Eyebrow**: "New: Compounding Lenses"
- **Headline**: "See what small changes **become**" (teal highlight)
- **Subheadline**: "Switch between proven money strategies..."
- **CTA**: "Want the plan that fits your life?"

## Accessibility

- Keyboard navigable tabs (lens picker)
- Semantic HTML structure
- ARIA attributes on interactive elements
- High contrast text (meets WCAG AA)
- Focus states on all buttons/tabs

## Mobile Responsive

- Lens picker: Horizontal scroll on mobile
- Single mode card: Stacks columns on mobile
- Compare mode: Stacks 3 cards vertically on mobile
- CTA buttons: Stack vertically on mobile

## Animation Details

- Lens switching: 200ms fade with subtle vertical slide
- No heavy motion (respects `prefers-reduced-motion`)
- Smooth transitions on hover states
- Maintains calm, professional feel

## Tech Stack

- **React 19** with TypeScript
- **Framer Motion** for animations
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **shadcn/ui Button** component

## Future Enhancements

Potential additions:
- Real data integration (connect to user's actual finances)
- Hybrid AI Plan lens (premium feature)
- Export/share lens results
- Timeline visualization improvements
- Dark mode support
- Lens recommendation quiz

## Notes

- All data is currently placeholder/dummy data
- No backend integration required
- Fully self-contained component
- Performance optimized (memoization on lens switching)
