# Cash Runway UI Components

This document describes the UI components built for the Cash Runway feature in Budget Buddy.

## Overview

The Cash Runway feature provides a complete UI dashboard for visualizing and managing cash flow forecasts. All components are built with React, TypeScript, and shadcn/ui components for consistent styling.

## Page Route

**Path**: `/cash-runway`

- Main entry point wrapping `CashRunwayDashboard` in `AppLayout`
- Protected by Firebase authentication

## Components

### 1. CashRunwayDashboard (Main Container)

**Location**: `src/components/pages/CashRunwayDashboard.tsx`

**Description**: Main dashboard component with tabs and summary cards.

**Features**:
- Auto-loads forecast on mount
- Four summary stat cards:
  - Current Balance
  - Lowest Balance (with danger point date)
  - Red Days count
  - Months at Risk
- Tabbed interface with 5 sections:
  - **Overview**: Forecast chart + Recommendations + Alerts
  - **Bills**: Priority-sorted bill management
  - **Calendar**: Month-view calendar
  - **Alerts**: Alert management
  - **Settings**: Cash plan configuration
- Global refresh functionality
- Loading and error states

**State Management**:
- Fetches forecast via `/api/cash/forecast`
- Passes forecast data down to child components
- Refresh callback propagates to child components

---

### 2. ForecastChart

**Location**: `src/components/cash-runway/ForecastChart.tsx`

**Description**: Interactive line chart showing daily balance projection.

**Features**:
- Recharts-based line chart with 400px height
- Daily balance visualization over forecast period
- Custom tooltips showing:
  - Full date
  - Balance (color-coded: red for negative, green for positive)
  - Warning flags for red days and buffer violations
- Custom dots highlighting:
  - Red dots (4px): Negative balance days
  - Yellow dots (3px): Buffer-low days
- Zero line reference (red dashed)
- X-axis: Shows every 7th day to avoid crowding
- Y-axis: Formatted in thousands ($Xk)
- Monthly summary cards below chart:
  - Income vs Expenses
  - Shortfall highlighting
  - Grid layout (3 columns on desktop)
- Legend for marker colors

**Chart Behavior**:
- 500ms animation on load
- Monotone curve interpolation
- Responsive container (100% width)

---

### 3. BillPriorityStack

**Location**: `src/components/cash-runway/BillPriorityStack.tsx`

**Description**: Priority-sorted bill management interface.

**Features**:
- Loads bill instances from `/api/bills/instances`
- Filter buttons: All | Pending | Paid | Overdue
- Groups bills by priority: Critical, Flexible, Delayable
- Within each group, sorts by due date
- Bill cards show:
  - Status icon (CheckCircle, Clock, AlertCircle, XCircle)
  - Name + status badge
  - Amount, due date, payment window, consequence weight
  - Autopay indicator
- Actions for pending bills:
  - **Mark Paid**: PATCH with status='paid', paidDate, paidAmount
  - **Skip**: PATCH with status='skipped'
- Color-coded by priority:
  - Critical: Red (bg-red-100, border-red-300)
  - Flexible: Yellow (bg-yellow-100, border-yellow-300)
  - Delayable: Green (bg-green-100, border-green-300)
- Triggers forecast refresh after actions

**Sorting Logic**:
```typescript
priorityOrder = { critical: 0, flexible: 1, delayable: 2 }
Sort by: priority (ascending), then dueDate (ascending)
```

---

### 4. CashCalendar

**Location**: `src/components/cash-runway/CashCalendar.tsx`

**Description**: Monthly calendar view of cash flow health.

**Features**:
- Month navigation (prev/next buttons)
- 7x6 grid layout (7 days/week × up to 6 weeks)
- Color-coded days:
  - White: Normal balance
  - Yellow: Below buffer floor
  - Red: Negative balance
  - Blue ring: Today
- Each day cell shows:
  - Day number
  - Balance in thousands ($X.Xk)
- Legend explaining colors
- Month summary card showing:
  - Total income
  - Total expenses
  - Net (color-coded: red if shortfall)
- Responsive grid with aspect-square cells
- Hover effects on day cells

**Date Mapping**:
- Maps forecast.dailyBalances to calendar dates
- Handles month transitions correctly
- Shows empty cells for days outside current month

---

### 5. AlertsList

**Location**: `src/components/cash-runway/AlertsList.tsx`

**Description**: Display and manage cash flow alerts.

**Props**:
- `showDismissed`: boolean (default: false)
- `limit`: number (optional)

**Features**:
- Fetches from `/api/alerts` with query params
- Severity-based icons:
  - High: AlertTriangle (red)
  - Medium: AlertCircle (yellow)
  - Low: Info (blue)
- Color-coded cards by severity:
  - High: Red background
  - Medium: Yellow background
  - Low: Blue background
- Shows:
  - Alert title + severity badge
  - Description
  - Target ID (if actionable)
  - Timestamp
  - Dismiss button (X icon)
- Dismissed alerts shown with 60% opacity
- Dismiss action: PATCH `/api/alerts/[id]` with dismissed=true

**Empty States**:
- No alerts: "No active alerts. Looking good!"
- With dismissed filter: "No alerts found."

---

### 6. RecommendationsList

**Location**: `src/components/cash-runway/RecommendationsList.tsx`

**Description**: AI-generated recommendations for improving cash flow.

**Features**:
- Fetches from `/api/cash/recommendations` (POST)
- Initial load with `includeGenerated: false` (reads cached)
- Refresh button triggers regeneration with `includeGenerated: true`
- Type-based icons:
  - delay_bill: TrendingDown (yellow)
  - cut_spending: TrendingDown (red)
  - increase_income: TrendingUp (green)
  - budget_adjustment: DollarSign (blue)
  - general: Lightbulb (gray)
- Priority color-coding:
  - Critical: Red background
  - High: Orange background
  - Medium: Yellow background
  - Low: Blue background
- Recommendation cards show:
  - Icon + title + priority badge
  - Description
  - Impact statement (💡 emoji prefix)
- Loading and generating states

**Recommendation Types**:
1. `delay_bill`: Suggests delaying flexible/delayable bills
2. `cut_spending`: Recommends reducing planned spending
3. `increase_income`: Suggests income increases (future enhancement)
4. `budget_adjustment`: General budget rebalancing advice
5. `general`: Health status or broad guidance

---

### 7. CashPlanSettings

**Location**: `src/components/cash-runway/CashPlanSettings.tsx`

**Props**:
- `onSave`: Callback function to refresh dashboard

**Description**: Configuration interface for cash plan parameters.

**Features**:
- Loads current settings from `/api/cash/plan`
- Loads available accounts from `/api/accounts`
- **Buffer Floor Input**:
  - Number input (min: 0, step: 100)
  - Help text explaining threshold
- **Forecast Horizon Input**:
  - Number input (min: 1, max: 365)
  - Help text: "Number of days to forecast"
- **Account Mode Selector**:
  - Dropdown: All Accounts | Single Account | Multiple Accounts
  - Help text explaining mode
- **Account Selection** (for single/multi modes):
  - Checkbox list of all accounts
  - Shows account name + current balance
  - Single mode: Disables other checkboxes after one selected
  - Multi mode: Allows multiple selections
  - Validation error for single mode with 0 accounts
- **Preview Panel**:
  - Shows forecast period, buffer floor, starting balance
  - Starting balance calculated based on account mode:
    - All: Sum of all account balances
    - Single: Balance of selected account
    - Multi: Sum of selected account balances
- **Save Button**:
  - PATCH to `/api/cash/plan`
  - Success message (green alert, auto-dismiss after 3s)
  - Triggers `onSave()` callback to refresh dashboard
- Loading state during data fetch
- Saving state with disabled button

**Starting Balance Calculation**:
```typescript
if (accountMode === "all") {
  return accounts.reduce((sum, a) => sum + a.currentBalance, 0);
} else if (accountMode === "single") {
  return accounts.find(a => a.id === selectedAccountIds[0])?.currentBalance || 0;
} else {
  return accounts
    .filter(a => selectedAccountIds.includes(a.id))
    .reduce((sum, a) => sum + a.currentBalance, 0);
}
```

---

## Component Hierarchy

```
CashRunwayDashboard (pages/)
├── Summary Cards (4x Card components)
│   ├── Current Balance
│   ├── Lowest Balance
│   ├── Red Days
│   └── Months at Risk
└── Tabs
    ├── Overview Tab
    │   ├── ForecastChart
    │   ├── RecommendationsList
    │   └── AlertsList (limit: 5)
    ├── Bills Tab
    │   └── BillPriorityStack
    ├── Calendar Tab
    │   └── CashCalendar
    ├── Alerts Tab
    │   └── AlertsList (showDismissed: true)
    └── Settings Tab
        └── CashPlanSettings
```

---

## Shared UI Components Used

From shadcn/ui:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button` (variants: default, outline, ghost)
- `Badge` (variants: outline, secondary)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Input`
- `Label`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Checkbox`
- `Alert`, `AlertDescription`

From lucide-react icons:
- `Calendar`, `DollarSign`, `AlertTriangle`, `TrendingUp`, `Settings`
- `CheckCircle`, `Clock`, `XCircle`, `AlertCircle`, `Info`
- `ChevronLeft`, `ChevronRight`
- `Lightbulb`, `TrendingDown`
- `X`

From Recharts:
- `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`, `ReferenceLine`

---

## Data Flow

1. **Dashboard Load**:
   ```
   User navigates to /cash-runway
   → CashRunwayDashboard mounts
   → Calls POST /api/cash/forecast
   → Renders forecast data in summary cards
   → Passes forecast to child components
   ```

2. **Bill Action** (e.g., Mark Paid):
   ```
   User clicks "Mark Paid" in BillPriorityStack
   → Component calls PATCH /api/bills/instances/[id]
   → API updates Firestore + invalidates cache
   → Component calls onRefresh() prop
   → Dashboard reloads forecast
   → All components re-render with new data
   ```

3. **Settings Change**:
   ```
   User updates settings in CashPlanSettings
   → User clicks "Save Settings"
   → Component calls PATCH /api/cash/plan
   → API updates cashPlan + invalidates cache
   → Component calls onSave() prop
   → Dashboard reloads forecast
   → All components re-render
   ```

4. **Alert Dismissal**:
   ```
   User clicks dismiss (X) on alert
   → AlertsList calls PATCH /api/alerts/[id]
   → API updates alert.dismissed = true
   → Component reloads alerts
   → Dismissed alert hidden or shown with opacity
   ```

5. **Recommendation Generation**:
   ```
   User clicks "Refresh" in RecommendationsList
   → Component calls POST /api/cash/recommendations
   → API runs forecast engine + generates recommendations
   → API saves recommendations to Firestore
   → Component displays recommendations
   ```

---

## Styling Patterns

### Color Scheme

**Status Colors**:
- Success/Positive: Green (#10b981, bg-green-50, border-green-200)
- Warning/Buffer Low: Yellow (#f59e0b, bg-yellow-50, border-yellow-200)
- Danger/Negative: Red (#dc2626, bg-red-50, border-red-200)
- Info: Blue (#3b82f6, bg-blue-50, border-blue-200)
- Neutral: Gray (#6b7280, bg-gray-50, border-gray-200)

**Priority Colors**:
- Critical: Red
- High: Orange
- Flexible/Medium: Yellow
- Delayable/Low: Green/Blue

### Typography

- **Headings**: `text-3xl font-bold` (h1), `font-semibold text-sm` (h4)
- **Body**: `text-sm text-gray-600` (default), `text-xs text-gray-500` (help text)
- **Numbers**: `text-2xl font-bold` (summary cards), `font-semibold` (emphasis)

### Spacing

- Card padding: `p-4`
- Section spacing: `space-y-6` (between major sections), `space-y-2` or `space-y-3` (within sections)
- Grid gaps: `gap-2`, `gap-4`, `gap-6`

### Responsive Design

- Summary cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Tabs: `grid-cols-5` (full width)
- Month summary: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Calendar: `grid-cols-7` (fixed)

---

## Accessibility

- Semantic HTML: Cards, labels, buttons
- ARIA labels on icons
- Keyboard navigation: Tabs, buttons, form inputs
- Focus states: Ring styles on interactive elements
- Color contrast: Meets WCAG AA standards
- Loading states: Screen reader friendly
- Error messages: Clear and descriptive

---

## Performance Considerations

1. **Data Fetching**:
   - Initial load: Single forecast fetch
   - Component-specific: Lazy load bills, alerts, recommendations
   - Cache invalidation: Automatic on mutations

2. **Rendering**:
   - Recharts: Virtualized with ResponsiveContainer
   - Calendar: Efficient date mapping with Map()
   - Lists: Key props for optimal reconciliation

3. **State Management**:
   - Local component state (no global store needed)
   - Minimal prop drilling (2-3 levels max)
   - Callbacks for refresh coordination

4. **Chart Optimization**:
   - X-axis: Show every 7th tick (reduces DOM nodes)
   - Custom dots: Only render for red/buffer-low days
   - Animation: 500ms (balanced UX)

---

## Future Enhancements

Potential UI improvements:
1. **Drag-and-drop** for bill reordering
2. **What-if scenarios** UI with sliders
3. **Mobile optimizations** (responsive tabs, swipe gestures)
4. **Export functionality** (PDF reports, CSV data)
5. **Notification preferences** (alert thresholds, email/push)
6. **Bill templates UI** (create/edit recurring bills)
7. **Planned spending UI** (create/edit spending items)
8. **Dark mode** support
9. **Accessibility improvements** (screen reader enhancements)
10. **Onboarding tour** for first-time users

---

## Testing Recommendations

1. **Unit Tests**:
   - Component rendering
   - User interactions (clicks, inputs)
   - State updates
   - API mock responses

2. **Integration Tests**:
   - Full dashboard flow
   - API integration
   - Firestore operations

3. **E2E Tests**:
   - Complete user journeys
   - Cross-browser testing
   - Mobile responsiveness

4. **Visual Regression**:
   - Snapshot tests for components
   - Chart rendering consistency
   - Responsive breakpoints
