# Essential Flavours Supplier Portal - Design Guidelines

## Design Approach: Material Design System

**Rationale**: This B2B procurement platform is utility-focused with information-dense interfaces, complex data tables, and extensive form workflows. Material Design provides robust patterns for data-heavy enterprise applications while maintaining professional aesthetics suitable for Australian B2B markets.

---

## Core Design Principles

1. **Clarity Over Decoration**: Prioritize information hierarchy and functional efficiency
2. **Consistent Patterns**: Maintain familiar interaction models across admin and supplier interfaces
3. **Data Density with Breathing Room**: Balance information richness with visual comfort
4. **Professional Trust**: Conservative, reliable aesthetic appropriate for procurement workflows

---

## Typography System

**Primary Font**: Roboto (via Google Fonts CDN)
**Secondary Font**: Roboto Mono (for data/numbers)

**Hierarchy**:
- Page Titles: text-4xl font-medium (Admin Dashboard, Supplier Management)
- Section Headers: text-2xl font-medium (Request Details, Quote Comparison)
- Card Headers: text-xl font-semibold
- Subheadings: text-lg font-medium
- Body Text: text-base font-normal
- Table Headers: text-sm font-semibold uppercase tracking-wide
- Table Data: text-sm font-normal
- Captions/Metadata: text-xs font-normal
- Buttons: text-sm font-medium uppercase tracking-wider

**Numerical Data**: Always use Roboto Mono at text-sm or text-base for prices, quantities, dates

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 4, 6, 8, 12, 16 consistently throughout
- Micro spacing (within components): p-1, p-2, gap-2
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Page margins: p-8, p-12 (desktop), p-4 (mobile)
- Card spacing: p-6 (desktop), p-4 (mobile)

**Container Strategy**:
- Max width: max-w-7xl mx-auto for content areas
- Full-width tables: w-full within containers
- Form max-width: max-w-3xl for readability
- Dashboard widgets: grid with gap-6

**Grid Patterns**:
- Dashboard stats: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Supplier cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Form layouts: Single column on mobile, 2-column on desktop (grid-cols-1 md:grid-cols-2 gap-6)

---

## Component Library

### Navigation
- **Admin Sidebar**: Fixed left sidebar (w-64), collapsible on mobile
  - Logo at top (h-16 flex items-center px-6)
  - Navigation items with icons (py-3 px-6 with hover states)
  - User profile at bottom with role badge
  - Active state: border-l-4 with background treatment
  
- **Supplier Top Navigation**: Horizontal bar with logo left, user menu right (h-16)
  - Simple, focused navigation limited to supplier capabilities

### Data Tables
- **Structure**: Full-width responsive tables with sticky headers
  - Header row: bg-treatment with border-b-2
  - Row height: py-4 px-6
  - Alternating row backgrounds for readability
  - Hover states on rows
  - Action buttons right-aligned in last column
  
- **Features**: 
  - Search bar above table (w-full md:w-96)
  - Filter dropdowns inline with search
  - Pagination below table (centered)
  - Items per page selector
  - Bulk action checkbox column (w-12)

### Forms
- **Input Fields**:
  - Label above input: text-sm font-medium mb-2
  - Input height: h-12
  - Input padding: px-4
  - Border: border-2 with focus ring-2 treatment
  - Helper text below: text-xs mt-1
  - Error messages: text-xs text-red-600 mt-1 with icon
  
- **Required Field Indicator**: Asterisk (*) in label or "Required" badge
  
- **Multi-Step Forms** (Quote Request Creation):
  - Stepper at top showing progress (4 steps)
  - Navigation: Back/Next buttons (bottom right)
  - Auto-save indicator
  - Step numbers in circles with connecting lines

### Cards
- **Dashboard Stats Cards**:
  - Border with shadow-sm
  - Padding: p-6
  - Icon in circle (h-12 w-12) top left
  - Large number: text-3xl font-bold
  - Label: text-sm text-muted
  - Trend indicator: small percentage with arrow icon
  
- **Supplier Cards**:
  - Padding: p-6
  - Header with company name (text-lg font-semibold)
  - Key info in 2-column grid
  - Status badge (top right)
  - Action buttons at bottom

### Buttons
**Using Shadcn Button Component Standards**:
- Primary: Solid background, medium height (h-10), padding px-6
- Secondary: Outline variant
- Ghost: Minimal for tables/lists
- Destructive: For delete actions
- All buttons: rounded-md, font-medium, uppercase tracking-wide
- Icon buttons: h-10 w-10 (square)
- Loading states: Spinner icon with disabled state

### Badges & Status Indicators
- **Status Badges**: Rounded-full px-3 py-1 text-xs font-semibold uppercase
  - Active/Submitted: Green treatment
  - Pending/Draft: Yellow treatment  
  - Closed/Rejected: Red treatment
  - Cancelled: Gray treatment
  
- **Role Badges**: Similar styling, smaller (px-2 py-0.5)

### Modals/Dialogs
- **Overlay**: Fixed inset with backdrop
- **Modal Container**: max-w-2xl mx-auto mt-20
- **Header**: p-6 border-b with title (text-xl) and close button
- **Content**: p-6 with scrollable area if needed
- **Footer**: p-6 border-t with actions right-aligned

### Quote Comparison View
- **Layout**: Horizontal scroll table on mobile, full-width on desktop
- **Sticky Columns**: Material name column fixed left
- **Highlight Best Value**: Subtle background treatment on winning cells
- **Visual Ranking**: Star icons or numbered badges (1st, 2nd, 3rd)

### Dashboard Analytics
- **Charts**: Use Recharts library via CDN
  - Line charts for price trends (h-64)
  - Bar charts for supplier performance (h-80)  
  - Pie charts for category breakdown (h-64)
  - Responsive containers with padding p-4

### File Upload
- **Dropzone**: Dashed border, h-32, centered content
  - Icon (upload cloud) at top
  - "Drag and drop or click to upload" text
  - File type/size restrictions below
- **File List**: Below dropzone with remove buttons

### Email Templates (HTML)
- **Max Width**: 600px centered
- **Header**: Essential Flavours logo, contact info
- **Content Box**: Border with padding for request details
- **CTA Button**: Large (h-12), full-width on mobile
- **Footer**: Small text with unsubscribe/contact

---

## Responsive Breakpoints

- **Mobile**: Base styles (< 768px)
  - Single column layouts
  - Collapsed sidebar to hamburger menu
  - Stacked form fields
  - Horizontal scroll tables
  
- **Tablet**: md: (768px+)
  - 2-column grids where appropriate
  - Expanded navigation hints
  
- **Desktop**: lg: (1024px+)
  - Full sidebar visible
  - 3-4 column grids for cards
  - Side-by-side form layouts
  - Full data tables without scroll

---

## Images

**Logo Placement**:
- Admin sidebar: Top left, height h-10, width auto
- Supplier navigation: Top left, height h-8
- Email templates: Centered, max-width 200px

**No Hero Images**: This is an enterprise portal, not a marketing site. Focus on immediate functionality.

**Illustrations** (optional, use sparingly):
- Empty states: Small centered illustrations (h-48) for "No requests yet"
- Error pages: Friendly illustration with explanation

**Icons**: Material Icons (via Google Fonts CDN) throughout interface
- Navigation: 24px icons
- Buttons: 20px icons  
- Table actions: 18px icons
- Status indicators: 16px icons

---

## Accessibility Standards

- All form inputs have associated labels
- Focus states clearly visible with ring-2 treatment
- Keyboard navigation fully supported
- ARIA labels on icon-only buttons
- Color contrast ratios meet WCAG AA standards
- Table headers properly marked with scope attributes
- Error messages programmatically associated with fields