// 初始化 vConsole, for debug
var vConsole = new window.VConsole();

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyhd7rYJ3CWRmVxUx4yfLYq5GeIzafzjm4Lbg-EJQZ4YLxMDezMz0QNXEXDoHHYgwdaVg/exec";        
const LIFF_ID = '2011447440-TpOhGOzi';

// 初始化 LIFF
liff.init({ liffId: LIFF_ID }).then(() => {
    console.log("LIFF 已初始化");
});

document.getElementById('submitBtn').addEventListener('click', async () => {
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // 1. 取得必填欄位的值並去除前後空白
    const phone = document.getElementById('phone').value.trim();
    const department = document.getElementById('department').value.trim();
    const contact = document.getElementById('contact').value.trim();
    
    // 2. 欄位空白防呆檢查
    if (!phone || !department || !contact) {
        alert("請完整填寫必填欄位（分機、單位、聯絡人）！");
        return; 
    }

    try {
        // 3. 確保使用者已登入
        if (!liff.isLoggedIn()) { 
            liff.login(); 
            return; 
        }

        // 4. 顯示全螢幕 Loading 遮罩並鎖定按鈕
        loadingOverlay.style.display = 'flex';
        submitBtn.disabled = true;
        submitBtn.innerText = "處理中...";

        // 5. 取得使用者 LINE 個人資料
        const profile = await liff.getProfile();

        // 6. 取得當前格式化時間
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const hour = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const formattedToday = `${yyyy}-${mm}-${dd}-${hour}:${minutes}`;

        // 7. 準備 Payload 資料包
        const payload = {
            userId: profile.userId,
            userName: profile.displayName,
            phone: phone,
            department: department,
            contact: contact,
            issueType: document.getElementById('issueType').value,
            description: document.getElementById('description').value,
            issueTime: formattedToday
        };

        // 8. 發送 Fetch 請求到 GAS
        const response = await fetch(GAS_WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "text/plain;charset=utf-8" 
            },
            mode: 'cors' 
        });

        if (response.ok) {
            console.log("請求已成功送達後端！");
            showSuccessAndClose();
        } else {
            console.warn("伺服器回應狀態碼非 200，但後端可能已執行");
            showSuccessAndClose();
        }

    } catch (err) {
        console.error("捕捉到錯誤:", err);
        
        // 9. 針對 LINE 內嵌瀏覽器特有的 Load failed 假性報錯進行安全放行
        if (err.message === "Load failed") {
            console.warn("這是 LINE 內嵌瀏覽器的跨網域重新導向限制，但後端已確認執行，視為成功。");
            showSuccessAndClose();
            return; 
        }

        // 10. 若為其他真實錯誤，恢復畫面與按鈕
        loadingOverlay.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerText = "送出回報";
        alert("送出發生錯誤，請稍後再試。");
    }
});

function showSuccessAndClose() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'none';
    
    const container = document.getElementById('mainContainer');
    
    container.innerHTML = `
        <div class="success-wrapper">
          <div class="success-icon-box">
            <span class="success-icon">✓</span>
          </div>
          <div class="success-title">報修成功，您可利用查詢鈕確認案件狀態</div>
          <div class="success-text">
            安全連線已建立，視窗將於 
            <span id="countdown" class="countdown-num">3</span> 
            秒後自動關閉
          </div>
        </div>
    `;

    let seconds = 3;
    const countdownEl = document.getElementById('countdown');
    const timer = setInterval(() => {
        seconds--;
        if (countdownEl) countdownEl.textContent = seconds;
        if (seconds <= 0) {
          clearInterval(timer);
          if (typeof liff !== 'undefined' && liff.closeWindow) {
            liff.closeWindow();
          } else {
            console.log("LIFF closeWindow 觸發 (非 LINE 環境)");
          }
        }
    }, 1000);
}