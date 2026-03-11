export class HttpClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(
    private baseUrl: string,
    private username: string,
    private password: string,
  ) {}

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthenticated();
    const response = await this.doFetch(path, options);
    if (response.status === 401) {
      await this.refresh();
      const retryResponse = await this.doFetch(path, options);
      if (!retryResponse.ok) throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
      return retryResponse.json() as Promise<T>;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json() as Promise<T>;
  }

  private doFetch(path: string, options: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) await this.login();
  }

  private async login(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
    const data = await res.json() as { success: boolean; data: { accessToken: string; refreshToken: string } };
    this.token = data.data.accessToken;
    this.refreshToken = data.data.refreshToken;
    console.log('🔐 Successfully authenticated with API');
  }

  private async refresh(): Promise<void> {
    if (!this.refreshToken) { this.token = null; await this.login(); return; }
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    if (!res.ok) { this.token = null; this.refreshToken = null; await this.login(); return; }
    const data = await res.json() as { success: boolean; data: { accessToken: string; refreshToken: string } };
    this.token = data.data.accessToken;
    this.refreshToken = data.data.refreshToken;
  }
}
