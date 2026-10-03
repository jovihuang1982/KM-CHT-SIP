
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUtsDvdgLMP2kAWdRpl66jpGRPSd1VrU5tuTFVZcHxbr6NNBcVL9TxG6q3fNfTH51Ikw/exec";
const LIFF_ID = '2011447440-TpOhGOzi';

let casesData = [
	{
		IssueId: "REQ-20260928-01",
		LineId: "U123456",
		LineName: "張小明",
		Phone: "分機 2101",
		Department: "資訊處",
		Contact: "張先生",
		IssueType: "話機障礙",
		Description: "話機拿起無聲，無法撥接外部電話。",
		IssueTime: "2026-09-28 09:30",
		CaseClosed: false,
		ActionTaken: "",
		IssueCategory: "未分類"
	},
	{
		IssueId: "REQ-20260927-05",
		LineId: "U888999",
		LineName: "李總務",
		Phone: "分機 1105",
		Department: "總務處",
		Contact: "李小姐",
		IssueType: "更改共振群組",
		Description: "需新增新進人員分機 1108 到客服共振組。",
		IssueTime: "2026-09-27 14:15",
		CaseClosed: true,
		ActionTaken: "已於交換機後台加入共振設定並測試通話正常。",
		IssueCategory: "軟體問題"
	},
	{
		IssueId: "REQ-20260926-02",
		LineId: "U333222",
		LineName: "王業務",
		Phone: "0912-345678",
		Department: "業務部",
		Contact: "王專員",
		IssueType: "話機障礙",
		Description: "通話雜音極大，斷斷續續。",
		IssueTime: "2026-09-26 11:00",
		CaseClosed: true,
		ActionTaken: "檢查為 RJ11 水晶頭接觸不良，重新壓接新水晶頭後恢復正常。",
		IssueCategory: "線路問題"
	}
];

let editModalObj;
let chart1Instance = null;
let chart2Instance = null;

document.addEventListener('DOMContentLoaded', () => {
	editModalObj = new bootstrap.Modal(document.getElementById('editModal'));

	// 監聽登入送出事件
	document.getElementById('loginForm').addEventListener('submit', (e) => {
		e.preventDefault();

		if (verifyLogin()) {
			// 切換 View
			document.getElementById('loginView').classList.remove('active');
			document.getElementById('dashboardView').classList.add('active');

			// 載入表格與圖表
			renderTable(casesData);
			initCharts();
		} else {
			// should be replaced by a login fail page
			console.log('login failed');
		}
	});
});

async function verifyLogin() {
	var userName = document.getElementById('username').value;
	var password = document.getElementById('password').value;

	console.log('username: ' + userName + ' password: ' + password);

	const payload = {
		action: 'verify_login',
		userName: userName,
		password: password
	};

	try {
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
			console.log('login successfully');
			return true;
		} else {
			console.log('login failed');
			return false;
		}
	} catch (err) {
		console.error("捕捉到錯誤:", err);
	} finally {
		return false;
	}
}

function switchTab(tab) {
	document.getElementById('tabAnalytics').classList.remove('active');
	document.getElementById('tabCases').classList.remove('active');
	document.getElementById('analyticsContent').style.display = 'none';
	document.getElementById('casesContent').style.display = 'none';

	const navbarCollapse = document.getElementById('navbarNav');
	if (navbarCollapse.classList.contains('show')) {
		new bootstrap.Collapse(navbarCollapse).hide();
	}

	if (tab === 'analytics') {
		document.getElementById('tabAnalytics').classList.add('active');
		document.getElementById('analyticsContent').style.display = 'block';
	} else {
		document.getElementById('tabCases').classList.add('active');
		document.getElementById('casesContent').style.display = 'block';
	}
}

function logout() {
	document.getElementById('dashboardView').classList.remove('active');
	document.getElementById('loginView').classList.add('active');
}

function renderTable(data) {
	const tbody = document.getElementById('caseTableBody');
	tbody.innerHTML = '';

	data.forEach(item => {
		const statusBadge = item.CaseClosed
			? `<span class="badge badge-closed">已結案</span>`
			: `<span class="badge badge-open">未處置</span>`;

		const tr = document.createElement('tr');
		tr.innerHTML = `
                    <td class="fw-bold small text-nowrap">${item.IssueId}</td>
                    <td class="small text-muted text-nowrap">${item.IssueTime}</td>
                    <td class="text-nowrap">${item.Department}<br><span class="small text-muted">${item.Contact}</span></td>
                    <td class="text-nowrap"><span class="badge bg-secondary">${item.IssueType}</span></td>
                    <td class="small"><div class="text-truncate-custom" title="${item.Description}">${item.Description}</div></td>
                    <td class="text-nowrap">${statusBadge}</td>
                    <td class="text-nowrap"><span class="badge bg-outline-dark border text-dark">${item.IssueCategory}</span></td>
                    <td class="small"><div class="text-truncate-custom" title="${item.ActionTaken || '-'}">${item.ActionTaken || '-'}</div></td>
                    <td class="text-center text-nowrap">
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditModal('${item.IssueId}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </td>
                `;
		tbody.appendChild(tr);
	});
}

function openEditModal(issueId) {
	const item = casesData.find(c => c.IssueId === issueId);
	if (!item) return;

	document.getElementById('modalIssueId').value = item.IssueId;
	document.getElementById('displayIssueId').value = item.IssueId;
	document.getElementById('displayDescription').value = item.Description;
	document.getElementById('modalCaseClosed').value = item.CaseClosed ? "true" : "false";
	document.getElementById('modalIssueCategory').value = item.IssueCategory;
	document.getElementById('modalActionTaken').value = item.ActionTaken;

	editModalObj.show();
}

function saveCaseAdminData() {
	const issueId = document.getElementById('modalIssueId').value;
	const item = casesData.find(c => c.IssueId === issueId);

	if (item) {
		item.CaseClosed = (document.getElementById('modalCaseClosed').value === "true");
		item.IssueCategory = document.getElementById('modalIssueCategory').value;
		item.ActionTaken = document.getElementById('modalActionTaken').value.trim();

		renderTable(casesData);
		updateKPI();
		editModalObj.hide();
	}
}

function filterCases() {
	const searchVal = document.getElementById('searchInput').value.toLowerCase();
	const statusVal = document.getElementById('statusFilter').value;
	const categoryVal = document.getElementById('categoryFilter').value;

	const filtered = casesData.filter(item => {
		const matchesSearch = item.IssueId.toLowerCase().includes(searchVal) ||
			item.Contact.toLowerCase().includes(searchVal) ||
			item.Department.toLowerCase().includes(searchVal);

		const matchesStatus = (statusVal === "") ||
			(statusVal === "Closed" && item.CaseClosed) ||
			(statusVal === "Open" && !item.CaseClosed);

		const matchesCategory = (categoryVal === "") || (item.IssueCategory === categoryVal);

		return matchesSearch && matchesStatus && matchesCategory;
	});

	renderTable(filtered);
}

function updateKPI() {
	const openCount = casesData.filter(c => !c.CaseClosed).length;
	document.getElementById('kpiOpenCases').innerText = openCount;
}

function initCharts() {
	if (chart1Instance) chart1Instance.destroy();
	if (chart2Instance) chart2Instance.destroy();

	const ctx1 = document.getElementById('categoryChart').getContext('2d');
	chart1Instance = new Chart(ctx1, {
		type: 'doughnut',
		data: {
			labels: ['線路問題', '軟體問題', '硬體問題', '未分類'],
			datasets: [{
				data: [45, 25, 20, 10],
				backgroundColor: ['#1F3A52', '#D4AF37', '#778899', '#E0E0E0']
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: window.innerWidth < 576 ? 'bottom' : 'right' }
			}
		}
	});

	const ctx2 = document.getElementById('typeChart').getContext('2d');
	chart2Instance = new Chart(ctx2, {
		type: 'bar',
		data: {
			labels: ['話機障礙', '更改共振組', '其他業務'],
			datasets: [{
				label: '報修件數',
				data: [18, 7, 3],
				backgroundColor: '#1F3A52'
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false } }
		}
	});
}