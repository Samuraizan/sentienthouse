/**
 * Google OAuth2 Authentication Script
 * 
 * Run this once to generate token.json for Google API access.
 * 
 * Usage: node google-auth.js
 * 
 * This will:
 * 1. Open a browser for Google login
 * 2. Ask you to grant permissions for Calendar, Drive, Sheets, Docs, Gmail
 * 3. Save the access/refresh tokens to token.json
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

// Paths
const CREDENTIALS_PATH = path.join(__dirname, "client_secret_473298819240-kkqgen93r91d28h9u8erlb8r9t9donj8.apps.googleusercontent.com.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

// Google OAuth2 scopes for all services
const SCOPES = [
  // Gmail
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  // Calendar
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  // Drive
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  // Sheets
  "https://www.googleapis.com/auth/spreadsheets",
  // Docs
  "https://www.googleapis.com/auth/documents",
];

// Load credentials
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error("❌ Client secret file not found at:", CREDENTIALS_PATH);
    console.error("   Please download it from Google Cloud Console and place it in the zo-api folder.");
    process.exit(1);
  }
  
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  const credentials = JSON.parse(content);
  
  // Handle both "installed" and "web" application types
  return credentials.installed || credentials.web;
}

// Generate authorization URL
function getAuthUrl(credentials) {
  const params = new URLSearchParams({
    client_id: credentials.client_id,
    redirect_uri: "http://localhost:3333/callback",
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // Force consent to get refresh token
  });
  
  return `${credentials.auth_uri}?${params.toString()}`;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code, credentials) {
  const fetch = (await import("node-fetch")).default;
  
  const params = new URLSearchParams({
    code,
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    redirect_uri: "http://localhost:3333/callback",
    grant_type: "authorization_code",
  });
  
  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return response.json();
}

// Save tokens to file
function saveTokens(tokens) {
  const tokenData = {
    ...tokens,
    created_at: new Date().toISOString(),
    scopes: SCOPES,
  };
  
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  console.log("\n✅ Tokens saved to:", TOKEN_PATH);
}

// Open URL in browser
function openBrowser(url) {
  const { exec } = require("child_process");
  
  const platform = process.platform;
  let command;
  
  if (platform === "win32") {
    command = `start "" "${url}"`;
  } else if (platform === "darwin") {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log("\n⚠️  Could not open browser automatically.");
      console.log("   Please open this URL manually:\n");
      console.log(`   ${url}\n`);
    }
  });
}

// Main authentication flow
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║       Google OAuth2 Authentication for Zo House           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    console.log("⚠️  token.json already exists at:", TOKEN_PATH);
    console.log("   Delete it first if you want to re-authenticate.\n");
    
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    console.log("   Current token info:");
    console.log("   - Created:", token.created_at || "unknown");
    console.log("   - Scopes:", (token.scopes || []).length, "permissions");
    console.log("   - Has refresh token:", !!token.refresh_token);
    
    process.exit(0);
  }
  
  // Load credentials
  console.log("📂 Loading credentials...");
  const credentials = loadCredentials();
  console.log("   Client ID:", credentials.client_id.substring(0, 20) + "...");
  console.log("   Project:", credentials.project_id || "unknown");
  
  // Generate auth URL
  const authUrl = getAuthUrl(credentials);
  
  console.log("\n🔐 Requesting permissions for:");
  console.log("   • Gmail (read, send, compose)");
  console.log("   • Google Calendar (full access)");
  console.log("   • Google Drive (full access)");
  console.log("   • Google Sheets (full access)");
  console.log("   • Google Docs (full access)");
  
  // Start local server to receive callback
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, "http://localhost:3333");
      
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        
        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <head><title>Authentication Failed</title></head>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #e53935;">❌ Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(error));
          return;
        }
        
        if (code) {
          try {
            console.log("\n📥 Received authorization code, exchanging for tokens...");
            const tokens = await exchangeCodeForTokens(code, credentials);
            saveTokens(tokens);
            
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <head><title>Authentication Successful</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; min-height: 100vh; margin: 0;">
                  <div style="max-width: 500px; margin: 0 auto; padding-top: 80px;">
                    <h1 style="color: #4ade80; font-size: 48px; margin-bottom: 20px;">✓</h1>
                    <h2 style="color: #f0f0f0; margin-bottom: 10px;">Authentication Successful!</h2>
                    <p style="color: #aaa; margin-bottom: 30px;">
                      Zo House agents now have access to Google Workspace.
                    </p>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: left;">
                      <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">Permissions granted:</p>
                      <ul style="color: #ccc; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>📧 Gmail - Read, send, compose emails</li>
                        <li>📅 Calendar - Manage events</li>
                        <li>📁 Drive - Access files and folders</li>
                        <li>📊 Sheets - Read and write spreadsheets</li>
                        <li>📝 Docs - Create and edit documents</li>
                      </ul>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                      You can close this window now.
                    </p>
                  </div>
                </body>
              </html>
            `);
            
            console.log("\n🎉 Authentication complete!");
            console.log("   Your agents can now access Google Workspace APIs.\n");
            
            server.close();
            resolve(tokens);
          } catch (err) {
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <head><title>Authentication Error</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                  <h1 style="color: #e53935;">❌ Token Exchange Failed</h1>
                  <p>${err.message}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(err);
          }
        }
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    
    server.listen(3333, () => {
      console.log("\n🌐 Starting local server on http://localhost:3333");
      console.log("   Waiting for Google OAuth callback...\n");
      console.log("📱 Opening browser for authentication...\n");
      
      openBrowser(authUrl);
      
      console.log("─".repeat(60));
      console.log("If the browser doesn't open, copy this URL:\n");
      console.log(authUrl);
      console.log("─".repeat(60));
    });
    
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error("❌ Port 3333 is already in use. Please close any other servers and try again.");
      } else {
        console.error("❌ Server error:", err.message);
      }
      reject(err);
    });
  });
}

// Run
main().catch((err) => {
  console.error("\n❌ Authentication failed:", err.message);
  process.exit(1);
});
