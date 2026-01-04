export enum AuthType {
  TOKEN = 'token',
  PASSWORD = 'password',
}

export interface IServerConfig {
  url: string;
  username: string;
  password: string;
}

export interface IAppData {
  isServerConfigured: boolean;
  url: string;
  username: string;
  password: string;
  authType: AuthType;
  protocolVersion: string;
  serverType: 'subsonic' | 'navidrome';
  isConnecting: boolean;
  connectionError: string | null;
}
