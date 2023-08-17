export interface UpdateInfo {
    version: string;
    pub_date: string;
    notes: string;
    name: string;
    url: string;
}

export type ServerType = 'json' | 'default';

export interface FeedURLOptions {
    url: string;
    headers?: Record<string, string>;
    serverType?: ServerType;
}

export interface AutoUpdaterMethods {
    setFeedURL(options: FeedURLOptions): void;
    getFeedURL(): string;
    checkForUpdates(): void;
    quitAndInstall(): void;
}

export enum AutoUpdaterEventKeys {
    Error = 'error',
    CheckingForUpdate = 'checking-for-update',
    UpdateAvailable = 'update-available',
    UpdateNotAvailable = 'update-not-available',
    UpdateDownloaded = 'update-downloaded',
    BeforeQuitForUpdate = 'before-quit-for-update'
}
