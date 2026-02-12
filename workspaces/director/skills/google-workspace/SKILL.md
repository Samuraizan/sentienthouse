---
name: google-workspace
description: Read and write to Google Calendar, Drive, Sheets, Docs, and Gmail using Google APIs
---

# Google Workspace Integration

This skill enables interaction with Google Workspace services: Calendar, Drive, Sheets, Docs, and Gmail. Use this whenever you need to read from or write to any Google service.

## Authentication

All Google API calls use OAuth 2.0 with the Zo House service account credentials stored at:
- Client Secret: `zo-api/client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json`
- Token: `zo-api/token.json` (generated after first auth)
- Project ID: `zoconsole`

If authentication fails, prompt the human to run the auth flow or check credentials.

## Triggers

- "add to calendar", "schedule", "create event", "check calendar", "what's on my calendar"
- "upload to drive", "save to drive", "find in drive", "share file", "create folder"
- "update sheet", "read spreadsheet", "add row", "get data from sheets"
- "create doc", "update document", "read doc", "write to docs"
- "send email", "check email", "read inbox", "draft email", "reply to"

---

## Google Calendar

### Read Events
```
GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
```
- `calendarId`: Use `primary` for the main calendar or a specific calendar ID
- Query params: `timeMin`, `timeMax` (RFC3339), `maxResults`, `q` (search)

### Create Event
```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
```
Body:
```json
{
  "summary": "Event Title",
  "description": "Event description",
  "start": { "dateTime": "2024-01-15T10:00:00+05:30", "timeZone": "Asia/Kolkata" },
  "end": { "dateTime": "2024-01-15T11:00:00+05:30", "timeZone": "Asia/Kolkata" },
  "attendees": [{ "email": "guest@example.com" }],
  "location": "Zo House BLR / Zo House Whitefield"
}
```

### Update Event
```
PATCH https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
```

### Delete Event
```
DELETE https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
```

---

## Google Drive

### List Files
```
GET https://www.googleapis.com/drive/v3/files
```
- Query params: `q` (search query), `pageSize`, `fields`
- Search examples: `q=name contains 'report'`, `q=mimeType='application/vnd.google-apps.folder'`

### Upload File
```
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
```
- Use multipart upload with metadata and file content
- Set `parents` array for folder placement

### Create Folder
```
POST https://www.googleapis.com/drive/v3/files
```
Body:
```json
{
  "name": "Folder Name",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["parent_folder_id"]
}
```

### Download File
```
GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media
```

### Share File
```
POST https://www.googleapis.com/drive/v3/files/{fileId}/permissions
```
Body:
```json
{
  "type": "user",
  "role": "reader",
  "emailAddress": "user@example.com"
}
```

---

## Google Sheets

### Read Spreadsheet
```
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}
```
- `range`: Sheet name and cell range, e.g., `Sheet1!A1:D10`

### Write to Spreadsheet
```
PUT https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}?valueInputOption=USER_ENTERED
```
Body:
```json
{
  "values": [
    ["Row1Col1", "Row1Col2"],
    ["Row2Col1", "Row2Col2"]
  ]
}
```

### Append Rows
```
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append?valueInputOption=USER_ENTERED
```
Body:
```json
{
  "values": [["NewRow1", "NewRow2"]]
}
```

### Create Spreadsheet
```
POST https://sheets.googleapis.com/v4/spreadsheets
```
Body:
```json
{
  "properties": { "title": "New Spreadsheet" },
  "sheets": [{ "properties": { "title": "Sheet1" } }]
}
```

---

## Google Docs

### Read Document
```
GET https://docs.googleapis.com/v1/documents/{documentId}
```

### Create Document
```
POST https://docs.googleapis.com/v1/documents
```
Body:
```json
{
  "title": "Document Title"
}
```

### Update Document (Batch Update)
```
POST https://docs.googleapis.com/v1/documents/{documentId}:batchUpdate
```
Body:
```json
{
  "requests": [
    {
      "insertText": {
        "location": { "index": 1 },
        "text": "Hello, World!\n"
      }
    }
  ]
}
```

### Common Update Operations
- `insertText`: Add text at a specific index
- `deleteContentRange`: Remove content between indexes
- `replaceAllText`: Find and replace text
- `insertTable`: Add a table
- `insertInlineImage`: Add an image

---

## Gmail

### List Messages
```
GET https://gmail.googleapis.com/gmail/v1/users/me/messages
```
- Query params: `q` (search), `maxResults`, `labelIds`
- Search examples: `q=is:unread`, `q=from:user@example.com`, `q=subject:report`

### Read Message
```
GET https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}
```
- Use `format=full` for complete message with body

### Send Email
```
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
```
Body (base64 encoded RFC 2822 message):
```json
{
  "raw": "base64_encoded_email_content"
}
```

Email format before encoding:
```
From: sender@zohouse.co
To: recipient@example.com
Subject: Your Subject Here
Content-Type: text/html; charset=utf-8

<html><body>Your HTML content here</body></html>
```

### Create Draft
```
POST https://gmail.googleapis.com/gmail/v1/users/me/drafts
```
Body:
```json
{
  "message": {
    "raw": "base64_encoded_email_content"
  }
}
```

### Reply to Thread
Include `threadId` in the message and add `In-Reply-To` and `References` headers.

---

## Common Zo House Resources

### Shared Calendars
- `zo-events@zohouse.co` - Events calendar
- `zo-blr@zohouse.co` - BLR property calendar
- `zo-wtf@zohouse.co` - WTF property calendar

### Shared Drives
- Zo House Operations - Main ops folder
- Zo House Events - Event materials
- Zo House Finance - Financial records

### Key Spreadsheets
- Guest Tracker (BLR): Check workspace docs for ID
- Guest Tracker (WTF): Check workspace docs for ID
- Revenue Dashboard: Check workspace docs for ID
- Event Pipeline: Check workspace docs for ID

---

## Error Handling

| Error Code | Meaning | Action |
|------------|---------|--------|
| 401 | Unauthorized | Re-authenticate, check token expiry |
| 403 | Forbidden | Check permissions, request access |
| 404 | Not Found | Verify resource ID, check if deleted |
| 429 | Rate Limited | Wait and retry with exponential backoff |

## Best Practices

1. **Always confirm before destructive actions** - Before deleting or overwriting, confirm with the human
2. **Log all changes** - Record what was created/modified/deleted for audit trail
3. **Use batch operations** - For multiple updates, use batch endpoints to reduce API calls
4. **Cache IDs** - Store frequently used spreadsheet/doc IDs in workspace files
5. **Handle errors gracefully** - If an API call fails, explain the error and suggest alternatives
