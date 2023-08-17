import { expect } from 'chai';
import sinon from 'sinon';
import { app } from 'electron';
import { CustomAutoUpdater } from '../src/CustomAutoUpdater';
import nock from 'nock';
import path from 'path';
import fs from 'fs';


describe('CustomAutoUpdater', function () {
    let updater: CustomAutoUpdater;

    const mockPath = path.join(__dirname, 'mockDownloads');

    beforeEach(function () {
        // 模拟 app.getVersion()
        sinon.stub(app, 'getPath').returns(mockPath);
        sinon.stub(app, 'getVersion').returns('1.1.0');
        sinon.stub(process, 'platform').value('linux');

        if (!fs.existsSync(mockPath)) {
            fs.mkdirSync(mockPath, { recursive: true });
        }

        // 模拟 RELEASES.json 请求
        nock('http://162.1.1.69:9999')
            .get('/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/RELEASES.json')
            .reply(200, {
                releases: [
                    {
                        version: "1.1.4",
                        updateTo: {
                            version: "1.1.4",
                            pub_date: "Tue Aug 15 2023 13:45:08 GMT+0800 (CST)",
                            notes: "",
                            name: "1.1.4",
                            url: "http://162.1.1.69:9999/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/luck-pc-client_1.1.4_arm64.deb"
                        }
                    }
                ],
                currentRelease: '1.1.4'
            }, {
                'Content-Type': 'application/json'
            });

        // 模拟下载请求
        nock('http://162.1.1.69:9999')
            .get('/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/luck-pc-client_1.1.4_arm64.deb')
            .reply(200, 'fake_file_content');


        updater = new CustomAutoUpdater();
    });

    afterEach(function () {
        // 恢复所有模拟
        sinon.restore();
        nock.cleanAll();
        fs.rmSync(mockPath, { recursive: true, force: true });
    });

    it('should emit update-available and update-downloaded if a new update is found', function (done) {

        updater.on('update-available', (updateInfo) => {
            expect(updateInfo.version).to.equal('1.1.4');
            // // 监听 update-downloaded 事件
            updater.on('update-downloaded', (updateInfo, filePath) => {
                console.log('filePath', filePath);
                expect(filePath).to.be.a('string');
                done();
            });
        });

        updater.setFeedURL({ url: "http://162.1.1.69:9999/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/RELEASES.json" });
        updater.checkForUpdates();
    });
});
