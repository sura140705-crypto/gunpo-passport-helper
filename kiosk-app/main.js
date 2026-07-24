// 군포시 민원 서식 작성 도우미 — 키오스크(Electron) 메인 프로세스
// 전체화면 키오스크로 로컬 index.html 실행. 인터넷·외부 통신 없음.
const { app, BrowserWindow, Menu, globalShortcut, session } = require('electron');
const path = require('path');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,               // 키오스크 잠금(전체화면·창 조작 제한)
    autoHideMenuBar: true,
    backgroundColor: '#eef2f7',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,  // 렌더러에서 Node 접근 차단(보안)
      spellcheck: false,
    },
  });

  Menu.setApplicationMenu(null); // 상단 메뉴 제거
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // 외부 링크·새 창 차단(키오스크에서 밖으로 못 나가게)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.on('closed', () => { win = null; });
  return win;
}

app.whenReady().then(() => {
  // 개인정보: 세션에 아무것도 남기지 않도록 캐시/저장소 비우기
  session.defaultSession.clearStorageData().catch(() => {});

  createWindow();

  // 관리자용 종료 단축키 (시민은 알기 어려움)
  globalShortcut.register('Control+Shift+Q', () => app.quit());
  // 관리자용 첫 화면 복귀 단축키
  globalShortcut.register('Control+Shift+H', () => {
    if (win) win.loadFile(path.join(__dirname, 'app', 'index.html'));
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
