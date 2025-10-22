# FastCal API Specification

**Base URL:** `http://localhost:8000/api`

## EventDrafts Endpoints

### Create Draft Event
- **POST** `/drafts/create`
- **Body:**
  ```json
  {
    "user": "string",
    "title": "string",
    "startTime": "ISO8601 datetime",
    "endTime": "ISO8601 datetime",
    "location": "string",
    "attendees": ["string"],
    "tags": ["string"]
  }
  ```
- **Response:** `{ success: boolean, data: DraftEvent }`

### Get Draft by ID
- **GET** `/drafts/:id`
- **Response:** `{ success: boolean, data: DraftEvent }`

### Get User's Drafts
- **GET** `/drafts/user/:userId`
- **Response:** `{ success: boolean, data: DraftEvent[] }`

### Validate Draft
- **POST** `/drafts/:id/validate`
- **Response:** `{ success: boolean, data: { valid: boolean, message: string } }`

### Update Draft
- **PUT** `/drafts/:id`
- **Body:** Partial DraftEvent object
- **Response:** `{ success: boolean, data: DraftEvent }`

### Delete Draft
- **DELETE** `/drafts/:id`
- **Response:** `{ success: boolean, data: { deleted: boolean } }`

## Data Types

### DraftEvent
```typescript
{
  _id: string
  user: string
  title: string
  startTime: Date
  endTime: Date
  location: string
  attendees: string[]
  tags: string[]
  status: "Created" | "Proposed" | "Validated" | "Conflicted"
}
```
