const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    resizable: true,
    title: '수학 마법사의 탑',
    icon: path.join(__dirname, 'dist', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 빌드된 index.html 로드
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // 메뉴바 숨기기 (게임 전용 창)
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
