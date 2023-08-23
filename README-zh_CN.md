# luck-electron-auto-updater

`luck-electron-auto-updater` 对原生 `autoUpdater` 进行了扩展。虽然原生的 `autoUpdater` 只支持Mac和Windows的Squirrel程序，但此组件还增加了对Linux（Ubuntu）的支持。需要注意的是，Linux下的行为有所不同：它只提示用户进行更新，并在下载后引导用户打开文件，需要手动安装。

![Updater Image](images/16acbcd569be3e6f26756396924b9dcc7bf5828658df7a29fa620a5c5d9ab2e3.png)  

> 注意：在Linux系统下，由于需要用户手动安装，安装包可以不进行签名。

[English](./README.md) | 简体中文

## API

本组件的接口和事件与原生 `autoUpdater` 一致。

### 事件
- error
- checking-for-update
- update-available
- update-not-available
- update-downloaded
- before-quit-for-update

### 方法
- setFeedURL
- getFeedURL
- checkForUpdates
- quitAndInstall

更多详情，请参考 [autoUpdater 官方文档](https://www.electronjs.org/docs/latest/api/auto-updater)。

## 生命周期

本组件的生命周期与事件触发顺序与原生组件相同。区别在于，在Mac和Windows系统中，`quitAndInstall` 方法会更新并退出；而在Linux系统下，只会打开下载文件的位置。

## 使用示例

```
const { app, dialog } = require('electron')
const log = require("electron-log");
const { CustomAutoUpdater } = require('luck-electron-auto-updater');

app.autoUpdater = autoUpdater = new CustomAutoUpdater();
const { domain, freq, appName, channel } = app.appConfig.autoUpdate;

log.info('auto update', domain, freq, appName, channel);

if (!domain) return;

const suffix = ['darwin', 'linux'].includes(process.platform) ? `/RELEASES.json?method=JSON&version=${app.getVersion()}` : '';
const checkUpdateUrl = `${domain}/${appName}/${channel}/${process.platform}/${process.arch}${suffix}`;

log.info('auto update checkUpdateUrl', checkUpdateUrl);

function showUpdateDialog() {
    const dialogOpts = {
        type: 'info',
        buttons: [['darwin', 'win32'].includes(process.platform) ? app.i18n.__('restart') : app.i18n.__('open'), app.i18n.__('later')],
        title: app.i18n.__('app_update_tip'),
        message: app.newRelease,
        detail: app.i18n.__('app_update_tip_detail')
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
}

autoUpdater.on('update-available', () => {
    log.log('update-available');
    if (app.newRelease)
        showUpdateDialog();
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    log.log('update-downloaded');
    app.newRelease = process.platform === 'win32' ? releaseNotes : releaseName;
    showUpdateDialog();
})

autoUpdater.on('error', (message) => {
    log.error('There was a problem updating the application')
    log.error(message)
});

autoUpdater.setFeedURL({
    url: checkUpdateUrl,
    serverType: 'json',
});

app.whenReady().then(() => {

    // 默认在启用启动时检查一次更新
    setTimeout(() => {
        log.log('auto-update checkForUpdates');
        autoUpdater.checkForUpdates();
    }, 10000);

    // 定时检查更新
    setInterval(() => {
        log.log('auto-update interval checkForUpdates');
        autoUpdater.checkForUpdates()
    }, freq);
});
```

配置示例，这里的服务端使用的是：[nucleus](https://github.com/atlassian/nucleus)，请根据自己的服务端调整相关的代码和配置逻辑。
```
 autoUpdate: {
        // 是否启用自动更新
        enable: true,
        // 更新服务地址
        domain: "http://162.1.1.69:9999",
        // 更新服务中的应用名称
        appName: "pcclient",
        //publish server
        updateServer:'http://162.1.1.69:8888',
        // 更新频道id
        channel: "e1ad93770345249aeb962d450314e9ef",
        // app id
        appId: 1,
        // 应用更新检测频率，默认每天提醒一次
        freq: 86400000
    },
```

## 服务端返回的格式

更新服务器返回的版本清单格式如下。Linux和Mac系统的格式保持一致，而Windows有其专属格式。

```
{
  "releases": [
    {
      "version": "1.1.3",
      "updateTo": {
        "version": "1.1.3",
        "pub_date": "Tue Aug 15 2023 13:45:08 GMT+0800 (CST)",
        "notes": "",
        "name": "1.1.3",
        "url": "http://162.1.1.69:9999/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/luck-pc-client_1.1.3_arm64.deb"
      }
    },
    {
      "version": "1.1.4",
      "updateTo": {
        "version": "1.1.4",
        "pub_date": "Tue Aug 15 2023 13:45:08 GMT+0800 (CST)",
        "notes": "",
        "name": "1.1.4",
        "url": "http://162.1.1.69:9999/pcclient/e1ad93770345249aeb962d450314e9ef/linux/arm64/luck-pc-client_1.1.4_arm64.deb"
      }
    }
  ],
  "currentRelease": "1.1.4"
}
```

Win格式如下：

```
B54F68436459E0DDF06CDDEB96DEDADED6082066 http://162.1.1.69:9999/pcclient/e1ad93770345249aeb962d450314e9ef/win32/arm64/luck-pc-client-arm64-1.1.3-full.nupkg 147072854
```

## 测试

```
npm run test
```

## 应用发布服务端

您可以使用[electron-update-server](https://github.com/lucksoft-yungui/electron-update-server)应用发布服务端进行应用版本的管理和分发。该项目目前支持`darwin`、`win32`、`linux(ubuntu)`平台以及`x64`、`arm64`架构的应用管理。
