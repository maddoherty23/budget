# Cash Runway API Endpoints

This document describes all API endpoints for the Cash Runway feature in Budget Buddy.

## Authentication

All endpoints require authentication via Firebase Auth. The `getCurrentUser()` function is used to verify the authenticated user, and all data operations are automatically scoped to the user's ID.

## Endpoints

### Cash Forecast

#### `POST /api/cash/forecast`
Generate a cash runway forecast.

**Request Body:**
```json
{
  "scenarioEdits"?: Array<{
    "type": "bill" | "spending" | "adjustment",
    "id"?: string,
    "date": string,
    "amount": number,
    "name"?: string
  }>
}
```

**Response:**
```json
{
  "forecast": {
    "dailyBalances": [...],
    "monthSummaries": [...],
    "dangerPoint": {...},
    "runwayDays": number
  },
  "meta": {
    "carryoverBalance": number,
    "billCount": number,
    "spendingCount": number,
    "calculatedAt": string,
    "cached": boolean
  }
}
```

#### `GET /api/cash/forecast`
Retrieve the most recent cached forecast.

**Response:** Same as POST endpoint.

---

### Bill Templates

#### `GET /api/bills/templates`
Get all bill templates for the user.

**Query Parameters:**
- `categoryId` (optional): Filter by category
- `isActive` (optional): Filter by active status (default: true)

**Response:**
```json
{
  "templates": [...],
  "count": number
}
```

#### `POST /api/bills/templates`
Create a new bill template.

**Request Body:**
```json
{
  "name": string,
  "defaultAmount": number,
  "categoryId"?: string,
  "priority": "critical" | "flexible" | "delayable",
  "consequenceWeight": number (0-100),
  "dueRule": {
    "type": "dayOfMonth",
    "day": number (1-31)
  } | {
    "type": "rrule",
    "rrule": string
  },
  "dueWindow": {
    "early": number,
    "late": number
  },
  "autopay": boolean
}
```

**Response:**
```json
{
  "success": true,
  "templateId": string,
  "message": string
}
```

#### `PATCH /api/bills/templates/[id]`
Update a bill template.

**Request Body:** Same fields as POST (all optional).

**Response:**
```json
{
  "success": true,
  "message": string
}
```

#### `DELETE /api/bills/templates/[id]`
Soft-delete a bill template (sets isActive = false).

**Response:**
```json
{
  "success": true,
  "message": string
}
```

---

### Bill Instances

#### `GET /api/bills/instances`
Get bill instances for the user.

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD format
- `endDate` (optional): YYYY-MM-DD format
- `status` (optional): "pending" | "paid" | "overdue" | "skipped"
- `templateId` (optional): Filter by template

**Response:**
```json
{
  "instances": [...],
  "count": number
}
```

#### `POST /api/bills/instances`
Create a manual bill instance (one-off or override).

**Request Body:**
```json
{
  "templateId"?: string,
  "name": string,
  "amount": number,
  "dueDate": string (ISO date),
  "categoryId"?: string,
  "priority": "critical" | "flexible" | "delayable",
  "consequenceWeight": number (0-100),
  "dueWindow": {
    "early": number,
    "late": number
  },
  "autopay": boolean
}
```

**Response:**
```json
{
  "success": true,
  "instanceId": string,
  "message": string
}
```

#### `PATCH /api/bills/instances/[id]`
Update a bill instance (e.g., mark as paid, reschedule).

**Request Body:** Any subset of the following:
```json
{
  "amount"?: number,
  "dueDate"?: string,
  "status"?: "pending" | "paid" | "overdue" | "skipped",
  "paidDate"?: string | null,
  "paidAmount"?: number | null,
  "name"?: string,
  "categoryId"?: string,
  "priority"?: string,
  "consequenceWeight"?: number,
  "dueWindow"?: object,
  "autopay"?: boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": string
}
```

#### `POST /api/bills/generate-instances`
Generate bill instances from templates for a date range.

**Request Body:**
```json
{
  "startDate": string (YYYY-MM-DD),
  "endDate": string (YYYY-MM-DD),
  "templateIds"?: string[] (optional, max 10)
}
```

**Response:**
```json
{
  "success": true,
  "message": string,
  "generatedCount": number,
  "templatesProcessed": number
}
```

---

### Planned Spending

#### `GET /api/planned-spending`
Get planned spending items.

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD format
- `endDate` (optional): YYYY-MM-DD format
- `categoryId` (optional): Filter by category

**Response:**
```json
{
  "items": [...],
  "count": number
}
```

#### `POST /api/planned-spending`
Create a planned spending item.

**Request Body:**
```json
{
  "name": string,
  "totalAmount": number,
  "categoryId"?: string,
  "allocationType": "singleDay" | "week" | "range",
  
  // For singleDay:
  "date"?: string (ISO date),
  
  // For week:
  "weekStart"?: string (ISO date),
  "spreadMode"?: "even" | "startHeavy" | "endHeavy",
  
  // For range:
  "rangeStart"?: string (ISO date),
  "rangeEnd"?: string (ISO date),
  "spreadMode"?: "even" | "startHeavy" | "endHeavy"
}
```

**Response:**
```json
{
  "success": true,
  "itemId": string,
  "message": string
}
```

#### `PATCH /api/planned-spending/[id]`
Update a planned spending item.

**Request Body:** Same fields as POST (all optional).

**Response:**
```json
{
  "success": true,
  "message": string
}
```

#### `DELETE /api/planned-spending/[id]`
Delete a planned spending item.

**Response:**
```json
{
  "success": true,
  "message": string
}
```

---

### Cash Plan Settings

#### `GET /api/cash/plan`
Get the user's cash plan settings.

**Response:**
```json
{
  "bufferFloor": number,
  "horizonDays": number,
  "accountMode": "single" | "multi" | "all",
  "selectedAccountIds": string[]
}
```

#### `PATCH /api/cash/plan`
Update cash plan settings.

**Request Body:**
```json
{
  "bufferFloor"?: number (>= 0),
  "horizonDays"?: number (1-365),
  "accountMode"?: "single" | "multi" | "all",
  "selectedAccountIds"?: string[]
}
```

**Response:**
```json
{
  "success": true,
  "message": string
}
```

---

### Alerts

#### `GET /api/alerts`
Get alerts for the user.

**Query Parameters:**
- `severity` (optional): "low" | "medium" | "high"
- `dismissed` (optional): boolean (default: false)
- `limit` (optional): number (default: 50)

**Response:**
```json
{
  "alerts": [...],
  "count": number,
  "total": number
}
```

#### `PATCH /api/alerts/[id]`
Update an alert (mainly for dismissing).

**Request Body:**
```json
{
  "dismissed": boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": string
}
```

---

### Recommendations

#### `POST /api/cash/recommendations`
Generate AI recommendations based on the current forecast.

**Request Body:**
```json
{
  "forecastId"?: string (optional),
  "includeGenerated"?: boolean (default: true)
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "delay_bill" | "cut_spending" | "increase_income" | "budget_adjustment" | "general",
      "priority": "critical" | "high" | "medium" | "low",
      "title": string,
      "description": string,
      "impact"?: string,
      "targetId"?: string
    }
  ],
  "savedCount": number,
  "forecastSummary": {
    "totalDays": number,
    "redDays": number,
    "bufferLowDays": number,
    "monthsWithShortfall": number,
    "dangerPointBalance": number | null
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": string,
  "details"?: string
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Cache Invalidation

The following operations automatically invalidate the forecast cache:
- Creating, updating, or deleting bill templates
- Creating or updating bill instances
- Creating, updating, or deleting planned spending
- Updating cash plan settings

This ensures the forecast is always recalculated with the latest data.

---

## Notes

1. All date fields should be in ISO 8601 format (e.g., "2024-01-15T00:00:00.000Z")
2. All amount fields are in the user's base currency (typically USD)
3. Firestore Timestamps are automatically converted to/from ISO date strings
4. All operations are automatically scoped to the authenticated user
5. The forecast engine is stateless and recalculates on demand
6. Caching is based on SHA-256 hash of inputs (bills, spending, carryover)
