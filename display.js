// ============================================================================
// display.js — Logic cho trang hiển thị công khai (index.html)
// ============================================================================

import {
  doc,
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db, SESSIONS, getWeekId, getMonday, formatDMY, weekIdToMonday } from "./shared.js";
import { DEFAULT_LEADERS } from "./firebase-config.js";

const els = {
  weekRangeText: document.getElementById("weekRangeText"),
  statusArea: document.getElementById("statusArea"),
  loadingArea: document.getElementById("loadingArea"),
  tableWrap: document.getElementById("tableWrap"),
  tableHeadRow: document.getElementById("tableHeadRow"),
  tableBody: document.getElementById("tableBody"),
  dayCards: document.getElementById("dayCards"),
  prevBtn: document.getElementById("prevWeekBtn"),
  nextBtn: document.getElementById("nextWeekBtn"),
  thisBtn: document.getElementById("thisWeekBtn"),
};

let currentWeekId = getWeekId(new Date());
let unsubscribeWeek = null;
let leaders = DEFAULT_LEADERS;
let leadersLoaded = false;

function showStatus(msg, type = "info") {
  if (!msg) {
    els.statusArea.innerHTML = "";
    return;
  }
  els.statusArea.innerHTML = `<div class="status-banner ${type}">${escapeHtml(msg)}</div>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function loadLeaders() {
  try {
    const snap = await getDoc(doc(db, "settings", "leaders"));
    if (snap.exists() && Array.isArray(snap.data().leaders) && snap.data().leaders.length) {
      leaders = snap.data().leaders;
    }
  } catch (e) {
    console.warn("Không tải được danh sách lãnh đạo, dùng mặc định.", e);
  }
  leadersLoaded = true;
}

function renderHeader() {
  els.tableHeadRow.innerHTML = `<th style="width:90px;">Thời gian</th>` +
    leaders.map((l) => `
      <th>
        <span class="leader-name">${escapeHtml(l.name)}</span>
        <span class="leader-title">${escapeHtml(l.title)}</span>
      </th>`).join("");
}

function sessionHtml(text) {
  const t = (text || "").trim();
  if (!t) return `<span class="session-text empty">Chưa có nội dung</span>`;
  return `<span class="session-text">${escapeHtml(t)}</span>`;
}

function renderWeek(weekData) {
  renderHeader();

  const days = weekData?.days || [];

  // ---- desktop table ----
  els.tableBody.innerHTML = days.map((day) => {
    const cells = leaders.map((l) => {
      const blocks = SESSIONS.map((s) => `
        <div class="session-block">
          <div class="session-label">${s.label}</div>
          ${sessionHtml(day.sessions?.[s.key]?.[l.id])}
        </div>`).join("");
      return `<td>${blocks}</td>`;
    }).join("");
    return `
      <tr>
        <td class="day-cell">${day.weekday}<span class="d">(${formatDMY(day.date)})</span></td>
        ${cells}
      </tr>`;
  }).join("");

  // ---- mobile cards ----
  els.dayCards.innerHTML = days.map((day) => {
    const rows = leaders.map((l) => {
      const blocks = SESSIONS.map((s) => `
        <div class="session-block">
          <div class="session-label">${s.label}</div>
          ${sessionHtml(day.sessions?.[s.key]?.[l.id])}
        </div>`).join("");
      return `
        <div class="leader-row">
          <div class="leader-name">${escapeHtml(l.name)}</div>
          <div class="leader-title">${escapeHtml(l.title)}</div>
          ${blocks}
        </div>`;
    }).join("");
    return `
      <div class="day-card">
        <div class="day-head"><span>${day.weekday}</span><span class="d">${formatDMY(day.date)}</span></div>
        ${rows}
      </div>`;
  }).join("");
}

function updateWeekRangeLabel(weekData, weekId) {
  if (weekData) {
    els.weekRangeText.textContent =
      `Tuần ${weekData.weekNumber}, từ ngày ${formatDMY(weekData.startDate)} đến ngày ${formatDMY(weekData.endDate)}`;
  } else {
    const monday = weekIdToMonday(weekId);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    els.weekRangeText.textContent = `Tuần ${weekId.split("-W")[1]} (chưa có dữ liệu)`;
  }
}

function subscribeToWeek(weekId) {
  if (unsubscribeWeek) unsubscribeWeek();
  els.loadingArea.style.display = "";
  els.tableWrap.style.display = "none";
  els.dayCards.style.display = "none";
  showStatus("");

  const ref = doc(db, "weeks", weekId);
  unsubscribeWeek = onSnapshot(
    ref,
    (snap) => {
      els.loadingArea.style.display = "none";
      els.tableWrap.style.display = "";
      els.dayCards.style.display = "";
      if (snap.exists()) {
        const data = snap.data();
        updateWeekRangeLabel(data, weekId);
        renderWeek(data);
      } else {
        updateWeekRangeLabel(null, weekId);
        renderWeek({ days: [] });
        showStatus("Chưa có lịch công tác cho tuần này.", "info");
      }
    },
    (err) => {
      els.loadingArea.style.display = "none";
      console.error(err);
      showStatus("Không thể tải dữ liệu lịch công tác. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.", "error");
    }
  );
}

function goToWeek(weekId) {
  currentWeekId = weekId;
  subscribeToWeek(currentWeekId);
}

els.prevBtn.addEventListener("click", () => {
  const monday = weekIdToMonday(currentWeekId);
  monday.setDate(monday.getDate() - 7);
  goToWeek(getWeekId(monday));
});

els.nextBtn.addEventListener("click", () => {
  const monday = weekIdToMonday(currentWeekId);
  monday.setDate(monday.getDate() + 7);
  goToWeek(getWeekId(monday));
});

els.thisBtn.addEventListener("click", () => {
  goToWeek(getWeekId(new Date()));
});

(async function init() {
  await loadLeaders();
  subscribeToWeek(currentWeekId);
})();
