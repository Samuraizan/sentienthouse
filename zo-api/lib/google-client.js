/**
 * Google API Client Helper
 * 
 * Provides easy-to-use functions for interacting with Google Workspace APIs.
 * Handles token refresh automatically.
 * 
 * Usage:
 *   const google = require('./lib/google-client');
 *   
 *   // Calendar
 *   const events = await google.calendar.listEvents();
 *   await google.calendar.createEvent({ summary: 'Meeting', ... });
 *   
 *   // Gmail
 *   const messages = await google.gmail.listMessages({ q: 'is:unread' });
 *   await google.gmail.sendEmail({ to: 'user@example.com', subject: '...', body: '...' });
 *   
 *   // Drive
 *   const files = await google.drive.listFiles();
 *   await google.drive.uploadFile(filePath, folderId);
 *   
 *   // Sheets
 *   const data = await google.sheets.getValues(spreadsheetId, 'Sheet1!A1:D10');
 *   await google.sheets.appendRows(spreadsheetId, 'Sheet1', [[...], [...]]);
 *   
 *   // Docs
 *   const doc = await google.docs.getDocument(documentId);
 *   await google.docs.createDocument('New Doc');
 */

const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "..", "client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json");
const TOKEN_PATH = path.join(__dirname, "..", "token.json");

let cachedFetch = null;

async function getFetch() {
  if (!cachedFetch) {
    cachedFetch = (await import("node-fetch")).default;
  }
  return cachedFetch;
}

// Load credentials and tokens
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("Client credentials not found. Run: node google-auth.js");
  }
  const content = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  return content.installed || content.web;
}

function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("Token not found. Run: node google-auth.js");
  }
  return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
}

function saveTokens(tokens) {
  const existing = fs.existsSync(TOKEN_PATH) ? JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")) : {};
  const updated = { ...existing, ...tokens, updated_at: new Date().toISOString() };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
}

// Refresh access token if expired
async function refreshAccessToken() {
  const fetch = await getFetch();
  const credentials = loadCredentials();
  const tokens = loadTokens();
  
  if (!tokens.refresh_token) {
    throw new Error("No refresh token. Re-run: node google-auth.js");
  }
  
  const params = new URLSearchParams({
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token",
  });
  
  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }
  
  const newTokens = await response.json();
  saveTokens(newTokens);
  
  return newTokens.access_token;
}

// Get valid access token (refresh if needed)
async function getAccessToken() {
  const tokens = loadTokens();
  
  // Check if token is expired (with 5 min buffer)
  const expiresAt = tokens.expires_at || (tokens.created_at ? 
    new Date(tokens.created_at).getTime() + (tokens.expires_in * 1000) : 0);
  
  if (Date.now() > expiresAt - 300000) {
    return refreshAccessToken();
  }
  
  return tokens.access_token;
}

// Generic API request helper
async function apiRequest(url, options = {}) {
  const fetch = await getFetch();
  const token = await getAccessToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  return response.text();
}

// ═══════════════════════════════════════════════════════════════════
// GMAIL API
// ═══════════════════════════════════════════════════════════════════

const gmail = {
  // List messages
  async listMessages({ q = "", maxResults = 20, labelIds = [] } = {}) {
    const params = new URLSearchParams({ maxResults });
    if (q) params.append("q", q);
    labelIds.forEach(id => params.append("labelIds", id));
    
    return apiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`);
  },
  
  // Get message details
  async getMessage(messageId, format = "full") {
    return apiRequest(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=${format}`);
  },
  
  // Send email
  async sendEmail({ to, subject, body, cc = "", bcc = "", isHtml = false }) {
    const boundary = "boundary_" + Date.now();
    const contentType = isHtml ? "text/html" : "text/plain";
    
    let email = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      bcc ? `Bcc: ${bcc}` : "",
      `Subject: ${subject}`,
      `Content-Type: ${contentType}; charset=utf-8`,
      "",
      body,
    ].filter(Boolean).join("\r\n");
    
    const encodedEmail = Buffer.from(email).toString("base64url");
    
    return apiRequest("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: encodedEmail }),
    });
  },
  
  // Create draft
  async createDraft({ to, subject, body, isHtml = false }) {
    const contentType = isHtml ? "text/html" : "text/plain";
    
    let email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: ${contentType}; charset=utf-8`,
      "",
      body,
    ].join("\r\n");
    
    const encodedEmail = Buffer.from(email).toString("base64url");
    
    return apiRequest("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      body: JSON.stringify({ message: { raw: encodedEmail } }),
    });
  },
};

// ═══════════════════════════════════════════════════════════════════
// CALENDAR API
// ═══════════════════════════════════════════════════════════════════

const calendar = {
  // List events
  async listEvents({ calendarId = "primary", timeMin, timeMax, maxResults = 50, q = "" } = {}) {
    const params = new URLSearchParams({ maxResults, singleEvents: true, orderBy: "startTime" });
    if (timeMin) params.append("timeMin", timeMin);
    if (timeMax) params.append("timeMax", timeMax);
    if (q) params.append("q", q);
    
    return apiRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`);
  },
  
  // Get event
  async getEvent(eventId, calendarId = "primary") {
    return apiRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`);
  },
  
  // Create event
  async createEvent({ calendarId = "primary", summary, description = "", start, end, location = "", attendees = [] }) {
    return apiRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: "POST",
      body: JSON.stringify({
        summary,
        description,
        location,
        start: typeof start === "string" ? { dateTime: start } : start,
        end: typeof end === "string" ? { dateTime: end } : end,
        attendees: attendees.map(email => ({ email })),
      }),
    });
  },
  
  // Update event
  async updateEvent(eventId, updates, calendarId = "primary") {
    return apiRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },
  
  // Delete event
  async deleteEvent(eventId, calendarId = "primary") {
    return apiRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
      method: "DELETE",
    });
  },
};

// ═══════════════════════════════════════════════════════════════════
// DRIVE API
// ═══════════════════════════════════════════════════════════════════

const drive = {
  // List files
  async listFiles({ q = "", pageSize = 50, fields = "files(id,name,mimeType,modifiedTime,size,parents)" } = {}) {
    const params = new URLSearchParams({ pageSize, fields });
    if (q) params.append("q", q);
    
    return apiRequest(`https://www.googleapis.com/drive/v3/files?${params}`);
  },
  
  // Get file metadata
  async getFile(fileId, fields = "*") {
    return apiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`);
  },
  
  // Download file content
  async downloadFile(fileId) {
    return apiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  },
  
  // Create folder
  async createFolder(name, parentId = null) {
    const body = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) body.parents = [parentId];
    
    return apiRequest("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  
  // Share file
  async shareFile(fileId, email, role = "reader") {
    return apiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ type: "user", role, emailAddress: email }),
    });
  },
  
  // Delete file
  async deleteFile(fileId) {
    return apiRequest(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
    });
  },
};

// ═══════════════════════════════════════════════════════════════════
// SHEETS API
// ═══════════════════════════════════════════════════════════════════

const sheets = {
  // Get spreadsheet metadata
  async getSpreadsheet(spreadsheetId) {
    return apiRequest(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  },
  
  // Get values from a range
  async getValues(spreadsheetId, range) {
    return apiRequest(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
  },
  
  // Update values in a range
  async updateValues(spreadsheetId, range, values, valueInputOption = "USER_ENTERED") {
    return apiRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`,
      {
        method: "PUT",
        body: JSON.stringify({ values }),
      }
    );
  },
  
  // Append rows
  async appendRows(spreadsheetId, range, values, valueInputOption = "USER_ENTERED") {
    return apiRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}`,
      {
        method: "POST",
        body: JSON.stringify({ values }),
      }
    );
  },
  
  // Create new spreadsheet
  async createSpreadsheet(title, sheetTitles = ["Sheet1"]) {
    return apiRequest("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      body: JSON.stringify({
        properties: { title },
        sheets: sheetTitles.map(title => ({ properties: { title } })),
      }),
    });
  },
};

// ═══════════════════════════════════════════════════════════════════
// DOCS API
// ═══════════════════════════════════════════════════════════════════

const docs = {
  // Get document
  async getDocument(documentId) {
    return apiRequest(`https://docs.googleapis.com/v1/documents/${documentId}`);
  },
  
  // Create document
  async createDocument(title) {
    return apiRequest("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },
  
  // Batch update (insert text, delete, etc.)
  async batchUpdate(documentId, requests) {
    return apiRequest(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });
  },
  
  // Helper: Insert text at beginning
  async insertText(documentId, text, index = 1) {
    return docs.batchUpdate(documentId, [
      { insertText: { location: { index }, text } },
    ]);
  },
  
  // Helper: Replace all text
  async replaceText(documentId, searchText, replaceText) {
    return docs.batchUpdate(documentId, [
      { replaceAllText: { containsText: { text: searchText }, replaceText } },
    ]);
  },
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  gmail,
  calendar,
  drive,
  sheets,
  docs,
  // Utility exports
  getAccessToken,
  refreshAccessToken,
  apiRequest,
};
