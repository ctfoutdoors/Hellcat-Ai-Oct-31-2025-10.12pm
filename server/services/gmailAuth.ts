import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Gmail OAuth2 Helper
 * Manages OAuth2 authentication for Gmail API access
 */
export class GmailAuthService {
  private oauth2Client: OAuth2Client;
  private static SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generate authorization URL for user to grant Gmail access
   */
  public getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GmailAuthService.SCOPES,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  public async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    };
  }

  /**
   * Set credentials from stored tokens
   */
  public setCredentials(tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }): void {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get authenticated Gmail client
   */
  public getGmailClient() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token!;
  }

  /**
   * Check if token is expired or about to expire
   */
  public isTokenExpired(): boolean {
    const expiryDate = this.oauth2Client.credentials.expiry_date;
    if (!expiryDate) return true;
    return Date.now() >= expiryDate - 5 * 60 * 1000;
  }

  /**
   * Ensure we have a valid access token (refresh if needed)
   */
  public async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      console.log('[GmailAuth] Access token expired, refreshing...');
      await this.refreshAccessToken();
    }
  }
}

export function createGmailAuthService(): GmailAuthService | null {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  const authService = new GmailAuthService(clientId, clientSecret, redirectUri);
  const accessToken = process.env.GMAIL_ACCESS_TOKEN;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const expiryDate = process.env.GMAIL_TOKEN_EXPIRY ? parseInt(process.env.GMAIL_TOKEN_EXPIRY) : undefined;

  if (accessToken) {
    authService.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate,
    });
  }

  return authService;
}
