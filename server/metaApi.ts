/**
 * Meta Graph API Client for Facebook Pages Publishing & OAuth
 * Supports Graph API v19.0+
 */

export interface MetaPageAccount {
  id: string;
  name: string;
  category?: string;
  category_list?: Array<{ id: string; name: string }>;
  tasks?: string[];
  access_token: string;
  fan_count?: number;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

export class MetaGraphApiClient {
  private apiVersion = 'v19.0';
  private baseUrl = 'https://graph.facebook.com';

  constructor(
    private appId: string,
    private appSecret: string
  ) {}

  /**
   * Constructs the official Facebook OAuth dialog URL
   */
  getOAuthUrl(redirectUri: string, state: string): string {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'public_profile',
      'email',
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      state: state,
      response_type: 'code',
      scope: scopes,
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for a short-lived user access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code: code,
    });

    const res = await fetch(`${this.baseUrl}/${this.apiVersion}/oauth/access_token?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `OAuth exchange failed with status ${res.status}`);
    }

    return data;
  }

  /**
   * Exchanges a short-lived user access token for a long-lived user token (valid ~60 days)
   */
  async getLongLivedUserToken(shortLivedToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const res = await fetch(`${this.baseUrl}/${this.apiVersion}/oauth/access_token?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      // Fallback to short-lived if exchange fails
      return { access_token: shortLivedToken, token_type: 'bearer', expires_in: 5184000 };
    }

    return data;
  }

  /**
   * Retrieves the authenticated user's Facebook profile
   */
  async getUserProfile(userAccessToken: string): Promise<{
    id: string;
    name: string;
    email?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/${this.apiVersion}/me?fields=id,name,email&access_token=${userAccessToken}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || 'Failed to fetch user profile');
    }

    return data;
  }

  /**
   * Retrieves all Facebook Pages the user manages via /me/accounts
   * This retrieves the permanent Page Access Tokens required for publishing
   */
  async getManagedPages(userAccessToken: string): Promise<MetaPageAccount[]> {
    const fields = 'id,name,category,category_list,tasks,access_token,fan_count,picture.type(large)';
    let url = `${this.baseUrl}/${this.apiVersion}/me/accounts?fields=${fields}&limit=100&access_token=${userAccessToken}`;
    const allPages: MetaPageAccount[] = [];

    while (url) {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to fetch managed Facebook Pages');
      }

      if (data.data && Array.isArray(data.data)) {
        allPages.push(...data.data);
      }

      // Handle pagination if user manages 100+ pages
      url = data.paging?.next || null;
    }

    return allPages;
  }

  /**
   * Tests whether a Page Access Token is valid and has publish permission
   */
  async testPagePermissions(pageId: string, pageAccessToken: string): Promise<{
    valid: boolean;
    name?: string;
    canPost?: boolean;
    error?: string;
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/${this.apiVersion}/${pageId}?fields=id,name,can_post&access_token=${pageAccessToken}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        return {
          valid: false,
          error: data.error?.message || `API error (${res.status})`,
        };
      }

      return {
        valid: true,
        name: data.name,
        canPost: data.can_post !== false,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Network connection failed',
      };
    }
  }

  /**
   * Publishes a post directly to a Facebook Page timeline using Page Access Token
   * Official endpoints:
   *  - Feed post (text/link): POST /{page-id}/feed
   *  - Photo post (image): POST /{page-id}/photos
   */
  async publishToPage(
    pageId: string,
    pageAccessToken: string,
    postData: {
      message: string;
      linkUrl?: string;
      mediaUrl?: string;
    }
  ): Promise<{
    id: string; // The Facebook Post ID (e.g. 123456789_987654321)
    metaErrorCode?: number;
    metaErrorSubcode?: number;
  }> {
    let endpoint = `${this.baseUrl}/${this.apiVersion}/${pageId}/feed`;
    const body: Record<string, string> = {
      access_token: pageAccessToken,
    };

    if (postData.mediaUrl && postData.mediaUrl.trim().length > 0) {
      // Photo post endpoint
      endpoint = `${this.baseUrl}/${this.apiVersion}/${pageId}/photos`;
      body.url = postData.mediaUrl;
      body.caption = postData.message;
    } else {
      // Standard feed post
      body.message = postData.message;
      if (postData.linkUrl && postData.linkUrl.trim().length > 0) {
        body.link = postData.linkUrl;
      }
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errorObj = data.error || {};
      const errorMsg = errorObj.message || `Meta API request failed with status ${res.status}`;
      const err: any = new Error(errorMsg);
      err.code = errorObj.code;
      err.subcode = errorObj.error_subcode;
      err.type = errorObj.type;
      throw err;
    }

    return {
      id: data.id || data.post_id,
    };
  }
}
