# Savings Levers Feature

A habit-tracking and savings goal feature that helps users set monthly savings targets and adjust spending categories with interactive "levers" to reach their goals.

## Overview

The Savings Levers feature provides:
- **Goal setting**: Set a monthly savings target (e.g., $100/month)
- **Interactive levers**: Adjust spending reduction percentages or frequency caps for different categories
- **Real-time projections**: See how changes affect your projected savings
- **Weekly tracking**: View mock weekly results showing how well you're following the plan
- **Supportive messaging**: Calm, non-judgmental feedback on progress

## Design Philosophy

This feature matches Budget Buddy's clean, minimal design system:
- White background with subtle gray borders
- Rounded cards (12-16px radius)
- Soft shadows and borders
- Teal/mint accents (chart-2 color) for highlights and active states
- Clean typography with friendly, minimal copy
- No shame language - only supportive, helpful messaging

## Files Created

### Core Logic
- `src/lib/savingsLevers.ts` - Types, mock data, and calculation utilities

### Components
- `src/components/pages/SavingsLevers.tsx` - Main page component
- `src/components/pages/savings-levers/GoalSetupCard.tsx` - Goal setup interface
- `src/components/pages/savings-levers/GlobalIntensityControl.tsx` - Overall intensity toggle
- `src/components/pages/savings-levers/LeverCard.tsx` - Individual category control card
- `src/components/pages/savings-levers/ImpactSummaryCard.tsx` - Projected savings summary
- `src/components/pages/savings-levers/WeeklyScoreboard.tsx` - Weekly progress tracking

### Route
- `src/app/savings-levers/page.tsx` - Next.js page route

### Navigation
- Updated `src/components/layout/AppLayout.tsx` to add "Savings Levers" nav item

## Features

### 1. Goal Setup
- Input monthly savings target
- Choose mode: "Reduce spending", "Increase income", or "Mix of both"
- Click "Build my plan" to generate levers

### 2. Global Intensity Control
Three intensity levels that affect all unlocked levers:
- **Low stress**: Gentle reductions (10% or -1 trip/week)
- **Balanced**: Moderate reductions (15% or -2 trips/week)
- **Fast results**: Aggressive reductions (25% or -3 trips/week)

### 3. Individual Levers
Each category (Groceries, Coffee Shops, Dining Out, Subscriptions, Shopping) has:
- **Baseline display**: Shows current monthly spending
- **Slider control**: Adjust reduction percentage or frequency target
- **Intensity buttons**: Per-category gentle/balanced/aggressive presets
- **Lock toggle**: Exclude a category from savings plan
- **Progress bar**: Visual feedback on target savings
- **Real-time savings calculation**: See impact of each change

#### Category Types
- **Percent reduction** (Groceries, Dining, Subscriptions, Shopping): Reduce spending by X%
- **Frequency cap** (Coffee Shops): Limit trips per week

### 4. Impact Summary Card
Live-updating panel showing:
- Projected monthly savings
- Weekly target breakdown
- Remaining amount to reach goal (if short)
- Progress bar toward goal
- Confidence level (High/Medium/Low) based on aggressiveness

### 5. Weekly Scoreboard
After clicking "Load Demo Week", shows:
- Per-category results (target vs actual)
- ✅/⚠️ indicators for each category
- Overall status: On track / Slightly off / Off track
- Contextual action buttons:
  - **On track**: "Keep plan" or "Adjust plan"
  - **Slightly off**: "Adjust next week" or "Make it up"
  - **Off track**: "Lower stress plan" (auto-adjusts to gentle) or "Adjust manually"

## Mock Data

All data is mock/in-memory only. No backend integration.

### Baseline Data (from `MOCK_BASELINES`)
- Groceries: $480/month
- Coffee Shops: $120/month (7 trips/week @ $4/trip)
- Dining Out: $240/month
- Subscriptions: $65/month
- Shopping: $200/month

### Weekly Results Generation
The "Load Demo Week" button generates randomized weekly results:
- 70% chance to be on track
- 30% chance to be slightly over target
- Results vary to make the demo feel realistic

## Calculations

### Projected Savings
For each enabled, unlocked lever:
- **Percent reduction**: `baseline × (percent / 100)`
- **Frequency reduction**: `(baseline trips - target trips) × avg cost × 4.33 weeks`

Total projected savings = sum of all lever savings

### Weekly Target
`monthlyGoal / 4.33` (average weeks per month)

### Week Status
- **On track**: 0 misses
- **Slightly off**: 1 miss
- **Off track**: 2+ misses

A "miss" = actual spending/trips exceeded the cap

## Usage

1. Navigate to `/savings-levers` (or click "Savings Levers" in the sidebar)
2. Click "Start a Goal" to begin, or "Load Demo Week" for instant demo
3. Enter your monthly savings goal (e.g., $100)
4. Choose how to save (reduce spending recommended for this demo)
5. Click "Build my plan"
6. Adjust global intensity or individual levers
7. Click "Load Demo Week" to see mock weekly results
8. Review scoreboard and adjust plan as needed

## Responsive Design

- **Desktop**: Two-column layout (levers left, summary/scoreboard right)
- **Mobile**: Stacked layout with proper spacing
- All sliders and buttons are keyboard accessible

## Accessibility

- Sliders have `aria-label` attributes
- Focus states on all interactive elements
- Color is not the only indicator (icons + text)
- Semantic HTML structure

## Future Enhancements (Not Implemented)

These features are mentioned as possibilities but not built:
- Persist state to localStorage or Firestore
- Integrate with real transaction data
- Track progress over multiple weeks
- Send notifications for weekly check-ins
- Add more categories dynamically
- Export savings plan as PDF
- Link to actual budget adjustments

## Tech Stack

- **React** with TypeScript
- **Next.js 16** App Router
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI Slider** (via shadcn/ui)
- **Lucide React** for icons

## Color System

Uses Budget Buddy's existing design tokens:
- `chart-2` (teal/mint): Primary accent color
- `border`: Light gray borders
- `card`: White background
- `muted-foreground`: Secondary text
- `success`: Green for on-track status
- `warning`: Orange for slightly-off status
- `destructive`: Red for off-track status

## Navigation

The "Savings Levers" link appears in:
- Desktop sidebar (4th item)
- Mobile hamburger menu
- Not in mobile bottom nav (only top 4 items shown there)

## Development

To work on this feature:
1. All components are in `src/components/pages/savings-levers/`
2. Shared logic is in `src/lib/savingsLevers.ts`
3. Main page component is `src/components/pages/SavingsLevers.tsx`
4. Route is defined in `src/app/savings-levers/page.tsx`

The feature is self-contained and doesn't affect other parts of the app.
