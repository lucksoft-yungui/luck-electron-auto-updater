import { EventEmitter } from 'events';
import { AutoUpdaterEventKeys, UpdateInfo } from './types';

export class UpdateEventEmitter extends EventEmitter {
    emit(event: AutoUpdaterEventKeys.Error, error: Error): boolean;
    emit(event: AutoUpdaterEventKeys.CheckingForUpdate): boolean;
    emit(event: AutoUpdaterEventKeys.UpdateAvailable, updateInfo: UpdateInfo): boolean;
    emit(event: AutoUpdaterEventKeys.UpdateNotAvailable): boolean;
    emit(event: AutoUpdaterEventKeys.UpdateDownloaded, updateInfo: UpdateInfo, filePath: string): boolean;
    emit(event: AutoUpdaterEventKeys.BeforeQuitForUpdate): boolean;
    emit(event: AutoUpdaterEventKeys, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }
}


