import { UpdateEventEmitter } from './UpdateEventEmitter';
import { app, autoUpdater as nativeAutoUpdater, net, shell } from 'electron';
import * as semver from 'semver';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';
import { UpdateInfo, AutoUpdaterEventKeys } from './types';

export class CustomAutoUpdater extends UpdateEventEmitter {
    private feedURL: string = '';
    private platform: NodeJS.Platform = process.platform;
    private latestUpdateInfo: UpdateInfo | null = null;
    private downloadPath: string = app.getPath('downloads');

    constructor(){
        super();
        this.setupListener();
    }

    setupListener(){
        nativeAutoUpdater.on(AutoUpdaterEventKeys.Error, (error: Error) => {
            this.emit(AutoUpdaterEventKeys.Error, error);
        });
        
        nativeAutoUpdater.on(AutoUpdaterEventKeys.CheckingForUpdate, () => {
            this.emit(AutoUpdaterEventKeys.CheckingForUpdate);
        });
        
        nativeAutoUpdater.on(AutoUpdaterEventKeys.UpdateAvailable, (updateInfo: UpdateInfo) => {
            this.emit(AutoUpdaterEventKeys.UpdateAvailable, updateInfo);
        });
        
        nativeAutoUpdater.on(AutoUpdaterEventKeys.UpdateNotAvailable, () => {
            this.emit(AutoUpdaterEventKeys.UpdateNotAvailable);
        });
        
        nativeAutoUpdater.on(AutoUpdaterEventKeys.UpdateDownloaded, (updateInfo: any, filePath: any) => {
            this.emit(AutoUpdaterEventKeys.UpdateDownloaded, updateInfo as UpdateInfo, filePath as string);
        });
        
        nativeAutoUpdater.on(AutoUpdaterEventKeys.BeforeQuitForUpdate, () => {
            this.emit(AutoUpdaterEventKeys.BeforeQuitForUpdate);
        });
    }

    setFeedURL(options: { url: string }) {
        this.feedURL = options.url;
        if (this.platform !== 'linux') {
            nativeAutoUpdater.setFeedURL(options);
        }
    }

    getFeedURL(): string {
        return this.feedURL;
    }

    checkForUpdates() {
        this.emit(AutoUpdaterEventKeys.CheckingForUpdate);
        if (this.platform === 'linux') {
            this._checkForLinuxUpdates();
        } else {
            nativeAutoUpdater.checkForUpdates();
        }
    }

    private _checkForLinuxUpdates() {
        const request = net.request(this.feedURL);
        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                const releases = JSON.parse(data).releases;
                const latestRelease = releases[releases.length - 1].updateTo;
                if (semver.gt(latestRelease.version, app.getVersion())) {
                    this.latestUpdateInfo = latestRelease;
                    this.emit(AutoUpdaterEventKeys.UpdateAvailable, latestRelease);
                    this._downloadUpdate(latestRelease.url);
                } else {
                    this.emit(AutoUpdaterEventKeys.UpdateNotAvailable);
                }
            });
        });
        request.end();
    }

    private _downloadUpdate(url: string) {
        const fileName = path.basename(url);
        const filePath = this.downloadPath = path.join(this.downloadPath, fileName);

        const file = fs.createWriteStream(filePath);

        file.on('error', (err) => {
            console.error('Error writing to file', err);
        });
        
        http.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    if (this.latestUpdateInfo) {
                        this.emit(AutoUpdaterEventKeys.UpdateDownloaded, this.latestUpdateInfo, filePath);
                    }
                });
            });
        });
    }

    quitAndInstall() {
        if (this.platform === 'linux') {
            shell.showItemInFolder(this.downloadPath);
        } else {
            nativeAutoUpdater.quitAndInstall();
        }
    }
}