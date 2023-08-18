import { expect } from 'chai';
import sinon from 'sinon';
import { app } from 'electron';
import { CustomAutoUpdater } from '../src/CustomAutoUpdater';
import { AutoUpdaterEventKeys } from '../src/types';
import nock from 'nock';
import path from 'path';
import fs from 'fs';

// Linux environment
describe('CustomAutoUpdater on Linux', function () {
    let updater: CustomAutoUpdater;

    const mockPath = path.join(__dirname, 'mockDownloads');
    const feedUrl = "http://local.mock.com/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/RELEASES.json";

    // Scenario with available updates
    describe('With new updates available', function () {
        beforeEach(function () {
            sinon.stub(app, 'getPath').returns(mockPath);
            sinon.stub(app, 'getVersion').returns('1.1.0');
            sinon.stub(process, 'platform').value('linux');

            if (!fs.existsSync(mockPath)) {
                fs.mkdirSync(mockPath, { recursive: true });
            }

            // Mock the RELEASES.json request
            nock('http://local.mock.com')
                .get('/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/RELEASES.json')
                .replyWithFile(200, path.join(__dirname, 'mocks/RELEASES.json'), {
                    'Content-Type': 'application/json'
                });

            // Mock download request
            nock('http://local.mock.com')
                .get('/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/luck-pc-client_1.1.4_arm64.deb')
                .reply(200, 'fake_file_content');

            updater = new CustomAutoUpdater();
        });

        afterEach(function () {
            if (!nock.isDone()) {
                console.log(nock.pendingMocks()); // Print unmatched rules
            }
            // Restore all stubs
            sinon.restore();
            nock.cleanAll();
        });

        it('should emit update-available and update-downloaded if a new update is found', function (done) {

            updater.on(AutoUpdaterEventKeys.UpdateAvailable, (updateInfo) => {
                expect(updateInfo.version).to.equal('1.1.4');
                updater.on(AutoUpdaterEventKeys.UpdateDownloaded, (updateInfo, filePath) => {
                    expect(updateInfo).to.be.an('object');
                    expect(filePath).to.be.a('string');
                    done();
                });
            });

            updater.setFeedURL({ url: feedUrl });
            updater.checkForUpdates();
        });

        it('should emit before-quit-for-update after update-downloaded event', function (done) {

            let beforeQuitForUpdateEmitted = false;

            updater.on(AutoUpdaterEventKeys.UpdateAvailable, (updateInfo) => {
                expect(updateInfo.version).to.equal('1.1.4');
            });

            updater.on(AutoUpdaterEventKeys.BeforeQuitForUpdate, () => {
                beforeQuitForUpdateEmitted = true;
            });

            updater.on(AutoUpdaterEventKeys.UpdateDownloaded, (updateInfo, filePath) => {
                expect(filePath).to.be.a('string');
                expect(updateInfo).to.be.an('object');
                updater.quitAndInstall();
                expect(beforeQuitForUpdateEmitted).to.be.true;
                done();
            });

            updater.setFeedURL({ url: feedUrl });
            updater.checkForUpdates();
        });
    });

    // Scenario without available updates
    describe('With no new updates available', function () {
        beforeEach(function () {
            sinon.stub(app, 'getPath').returns(mockPath);
            // Assume the current app version to be 1.1.4
            sinon.stub(app, 'getVersion').returns('1.1.4');
            sinon.stub(process, 'platform').value('linux');

            if (!fs.existsSync(mockPath)) {
                fs.mkdirSync(mockPath, { recursive: true });
            }

            // Mock the RELEASES.json request
            nock('http://local.mock.com')
                .get('/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/RELEASES.json')
                .replyWithFile(200, path.join(__dirname, 'mocks/RELEASES.json'), {
                    'Content-Type': 'application/json'
                });

            updater = new CustomAutoUpdater();
        });

        afterEach(function () {
            if (!nock.isDone()) {
                console.log(nock.pendingMocks()); // Print unmatched rules
            }
            // Restore all stubs
            sinon.restore();
            nock.cleanAll();
        });

        it('should emit update-not-available if no new updates are found', function (done) {
            updater.on(AutoUpdaterEventKeys.UpdateNotAvailable, () => {
                done();
            });

            updater.setFeedURL({ url: feedUrl });
            updater.checkForUpdates();
        });
    });
});