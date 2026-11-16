// ============================================================================
// admin.js — Logic cho trang nhập liệu (admin.html)
// ============================================================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  db,
  auth,
  SESSIONS,
  getWeekId,
  getMonday,
  formatDMY,
  weekIdToMonday,
  buildEmptyWeek,
} from "./shared.js";
import { DEFAULT_LEADERS } from "./firebase-config.js";

const els = {
  loginView: document.getElementById("loginView"),
  editorView: document.getElementById("editorView"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginBtn: document.getElementById("loginBtn"),
  loginStatus: document.getElementById("loginStatus"),
  whoEmail: document.getElementById("whoEmail"),
  logoutBtn: document.getElementById("logoutBtn"),
  saveStatus: document.getElementById("saveStatus"),
  weekRangeText: document.getElementById("weekRangeText"),
  prevBtn: document.getElementById("prevWeekBtn"),
  nextBtn: document.getElementById("nextWeekBtn"),
  thisBtn: document.getElementById("thisWeekBtn"),
  copyPrevBtn: document.getElementById("copyPrevBtn"),
  seedSampleBtn: document.getElementById("seedSampleBtn"),
  toggleLeadersBtn: document.getElementById("toggleLeadersBtn"),
  leadersPanel: document.getElementById("leadersPanel"),
  leadersForm: document.getElementById("leadersForm"),
  saveLeadersBtn: document.getElementById("saveLeadersBtn"),
  daysEditor: document.getElementById("daysEditor"),
  saveWeekBtn: document.getElementById("saveWeekBtn"),
};

let leaders = DEFAULT_LEADERS;
let currentWeekId = getWeekId(new Date());
let currentWeekData = null;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function banner(el, msg, type) {
  if (!msg) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="status-banner ${type}">${escapeHtml(msg)}</div>`;
}

// ---------------- Đăng nhập / đăng xuất ----------------

els.loginBtn.addEventListener("click", async () => {
  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;
  if (!email || !password) {
    banner(els.loginStatus, "Vui lòng nhập email và mật khẩu.", "error");
    return;
  }
  els.loginBtn.disabled = true;
  banner(els.loginStatus, "Đang đăng nhập…", "info");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    banner(els.loginStatus, "Đăng nhập thất bại: email hoặc mật khẩu không đúng.", "error");
  } finally {
    els.loginBtn.disabled = false;
  }
});

els.logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if (user) {
    els.loginView.style.display = "none";
    els.editorView.style.display = "";
    els.whoEmail.textContent = user.email;
    await loadLeaders();
    renderLeadersForm();
    await loadWeek(currentWeekId);
  } else {
    els.loginView.style.display = "";
    els.editorView.style.display = "none";
  }
});

// ---------------- Danh sách lãnh đạo ----------------

async function loadLeaders() {
  try {
    const snap = await getDoc(doc(db, "settings", "leaders"));
    if (snap.exists() && Array.isArray(snap.data().leaders) && snap.data().leaders.length) {
      leaders = snap.data().leaders;
    }
  } catch (e) {
    console.warn(e);
  }
}

function renderLeadersForm() {
  els.leadersForm.innerHTML = leaders.map((l, i) => `
    <div class="leader-form-row">
      <input type="text" data-idx="${i}" data-field="name" value="${escapeHtml(l.name)}" placeholder="Tên (VD: Đ/c Nguyễn Văn A)" />
      <input type="text" data-idx="${i}" data-field="title" value="${escapeHtml(l.title)}" placeholder="Chức danh" />
    </div>
  `).join("");
}

els.toggleLeadersBtn.addEventListener("click", () => {
  const show = els.leadersPanel.style.display === "none";
  els.leadersPanel.style.display = show ? "" : "none";
  els.toggleLeadersBtn.textContent = show ? "Sửa danh sách 4 chức danh ▴" : "Sửa danh sách 4 chức danh ▾";
});

els.saveLeadersBtn.addEventListener("click", async () => {
  const inputs = els.leadersForm.querySelectorAll("input");
  const updated = leaders.map((l) => ({ ...l }));
  inputs.forEach((inp) => {
    const idx = Number(inp.dataset.idx);
    updated[idx][inp.dataset.field] = inp.value.trim();
  });
  leaders = updated;
  try {
    await setDoc(doc(db, "settings", "leaders"), { leaders });
    banner(els.saveStatus, "Đã lưu danh sách chức danh.", "success");
    renderDaysEditor();
  } catch (e) {
    console.error(e);
    banner(els.saveStatus, "Lỗi khi lưu danh sách chức danh: " + e.message, "error");
  }
});

// ---------------- Tải / điều hướng tuần ----------------

async function loadWeek(weekId) {
  currentWeekId = weekId;
  const monday = weekIdToMonday(weekId);
  els.weekRangeText.textContent = `Tuần ${weekId.split("-W")[1]} — từ ${formatDMY(monday)}`;
  banner(els.saveStatus, "Đang tải dữ liệu tuần…", "info");
  try {
    const snap = await getDoc(doc(db, "weeks", weekId));
    if (snap.exists()) {
      currentWeekData = snap.data();
    } else {
      currentWeekData = buildEmptyWeek(monday);
    }
    els.weekRangeText.textContent =
      `Tuần ${currentWeekData.weekNumber} — từ ${formatDMY(currentWeekData.startDate)} đến ${formatDMY(currentWeekData.endDate)}`;
    banner(els.saveStatus, "");
    renderDaysEditor();
  } catch (e) {
    console.error(e);
    banner(els.saveStatus, "Không tải được dữ liệu tuần: " + e.message, "error");
  }
}

els.prevBtn.addEventListener("click", () => {
  const monday = weekIdToMonday(currentWeekId);
  monday.setDate(monday.getDate() - 7);
  loadWeek(getWeekId(monday));
});

els.nextBtn.addEventListener("click", () => {
  const monday = weekIdToMonday(currentWeekId);
  monday.setDate(monday.getDate() + 7);
  loadWeek(getWeekId(monday));
});

els.thisBtn.addEventListener("click", () => loadWeek(getWeekId(new Date())));

els.copyPrevBtn.addEventListener("click", async () => {
  if (!confirm("Sao chép toàn bộ nội dung của tuần trước vào tuần hiện tại? Nội dung hiện tại (chưa lưu) sẽ bị thay thế.")) return;
  const monday = weekIdToMonday(currentWeekId);
  const prevMonday = new Date(monday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevWeekId = getWeekId(prevMonday);
  try {
    const snap = await getDoc(doc(db, "weeks", prevWeekId));
    if (!snap.exists()) {
      banner(els.saveStatus, "Tuần trước chưa có dữ liệu để sao chép.", "error");
      return;
    }
    const prevData = snap.data();
    const newWeek = buildEmptyWeek(monday);
    newWeek.days.forEach((day, i) => {
      const prevDay = prevData.days?.[i];
      if (prevDay) day.sessions = JSON.parse(JSON.stringify(prevDay.sessions));
    });
    currentWeekData = newWeek;
    renderDaysEditor();
    banner(els.saveStatus, "Đã sao chép nội dung từ tuần trước. Nhớ bấm Lưu để áp dụng.", "success");
  } catch (e) {
    console.error(e);
    banner(els.saveStatus, "Lỗi khi sao chép: " + e.message, "error");
  }
});

// ---------------- Dữ liệu mẫu (demo nhanh, dựa trên tuần 47/2026) ----------------

const SAMPLE_WEEK_SESSIONS = [
  { // Thứ Hai 16/11
    l1: { morning: "(07h30) Dự khai mạc Triển lãm mỹ thuật “Hồ Chí Minh - Chân dung một con người” hưởng ứng “Ngày Văn hóa Việt Nam” năm 2026; (08h00) Chủ trì Kỳ họp thứ 8 (chuyên đề) HĐND tỉnh khóa XVIII, nhiệm kỳ 2026 - 2031", afternoon: "Dự Ngày hội Đại đoàn kết toàn dân tộc tại khu dân cư Phố Thầu, phường Thục Phán" },
    l2: { morning: "(07h30) Dự khai mạc Triển lãm mỹ thuật “Hồ Chí Minh - Chân dung một con người” hưởng ứng “Ngày Văn hóa Việt Nam” năm 2026; (08h00) Dự Kỳ họp thứ 8 (chuyên đề) HĐND tỉnh khóa XVIII, nhiệm kỳ 2026 - 2031", afternoon: "Làm việc tại cơ quan" },
    l3: { morning: "Dự Hội nghị quán triệt, triển khai Quyết định số 170/QĐ-TTg ngày 24/9/2026 của Thủ tướng Chính phủ tại Hà Nội", afternoon: "Đi công tác ngoài tỉnh" },
    l4: { morning: "Dự Ngày hội Đại đoàn kết toàn dân tộc tại xã Bảo Lâm", afternoon: "Dự Lễ khánh thành Trường THPT Bản Ngà" },
  },
  { // Thứ Ba 17/11
    l1: { morning: "Dự Lễ công bố Quyết định thành lập và ra mắt Trung đoàn CSCĐ dự bị chiến đấu thuộc Công an tỉnh", afternoon: "Làm việc tại cơ quan" },
    l2: { morning: "Đi công tác ngoài tỉnh (cả ngày)", afternoon: "Đi công tác ngoài tỉnh (cả ngày)" },
    l3: { morning: "Dự Chương trình kỷ niệm 44 năm ngày Nhà giáo Việt Nam (20/11/1982 - 20/11/2026) và ra mắt chính thức nền tảng Tammi OA ngành Giáo dục và Đào tạo tỉnh Cao Bằng", afternoon: "- Dự Hội nghị đánh giá, xếp loại chất lượng tập thể, lãnh đạo Công an tỉnh;\n- Làm việc với TikTok Việt Nam" },
    l4: { morning: "Làm việc tại cơ quan", afternoon: "Họp xử lý các dự án chậm tiến độ, có khó khăn, vướng mắc; cơ sở nhà đất cần đánh giá lại hiệu quả kinh tế" },
  },
  { // Thứ Tư 18/11
    l1: { morning: "Tham gia Đoàn công tác của Phó Thủ tướng Chính dự Ngày hội Đại đoàn kết toàn dân tộc gắn với Ngày Văn hóa Việt Nam tại xã Quang Trung", afternoon: "Chủ trì họp Thường trực Tỉnh ủy, Hội nghị BTV Tỉnh ủy" },
    l2: { morning: "Đi công tác ngoài tỉnh", afternoon: "Họp Thường trực Tỉnh ủy; Hội nghị Ban Thường vụ Tỉnh ủy" },
    l3: { morning: "Tham gia Đoàn công tác của Phó Thủ tướng Chính dự Ngày hội Đại đoàn kết toàn dân tộc gắn với Ngày Văn hóa Việt Nam tại xã Quang Trung", afternoon: "Họp Thường trực Tỉnh ủy; Hội nghị Ban Thường vụ Tỉnh ủy" },
    l4: { morning: "Làm việc tại cơ quan", afternoon: "Họp Thường trực Tỉnh ủy; Hội nghị Ban Thường vụ Tỉnh ủy" },
  },
  { // Thứ Năm 19/11
    l1: { morning: "Làm việc tại cơ quan", afternoon: "Làm việc tại cơ quan" },
    l2: { morning: "Làm việc tại cơ quan", afternoon: "Đi công tác ngoài tỉnh" },
    l3: { morning: "", afternoon: "Dự Phiên họp UBND cho ý kiến các nội dung trình Kỳ họp HĐND tỉnh thường lệ cuối năm" },
    l4: { morning: "Làm việc tại cơ quan", afternoon: "Làm việc tại cơ quan" },
  },
  { // Thứ Sáu 20/11
    l1: { morning: "Thăm, chúc mừng Ngày Nhà giáo Việt Nam tại Trường phổ thông nội trú Tiểu học và Trung học cơ sở Đức Long", afternoon: "Làm việc tại cơ quan" },
    l2: { morning: "Dự Kỳ họp thứ 2, Quốc hội khóa XVI", afternoon: "Dự Kỳ họp thứ 2, Quốc hội khóa XVI" },
    l3: { morning: "Làm việc với Thanh tra Chính phủ tại địa phương", afternoon: "Làm việc tại cơ quan" },
    l4: { morning: "Thăm, chúc mừng Ngày Nhà giáo Việt Nam tại Trường THPT Trà Lĩnh", afternoon: "Làm việc tại cơ quan" },
  },
  { // Thứ Bảy 21/11
    l1: { morning: "Nghỉ", afternoon: "Nghỉ" },
    l2: { morning: "Dự Kỳ họp thứ 2, Quốc hội khóa XVI", afternoon: "Dự Kỳ họp thứ 2, Quốc hội khóa XVI" },
    l3: { morning: "Nghỉ", afternoon: "Nghỉ" },
    l4: { morning: "Nghỉ", afternoon: "Nghỉ" },
  },
  { // Chủ Nhật 22/11
    l1: { morning: "Nghỉ", afternoon: "Nghỉ" },
    l2: { morning: "Nghỉ", afternoon: "Nghỉ" },
    l3: { morning: "Nghỉ", afternoon: "Nghỉ" },
    l4: { morning: "Nghỉ", afternoon: "Nghỉ" },
  },
];

els.seedSampleBtn.addEventListener("click", () => {
  if (!confirm("Nạp dữ liệu mẫu của Tuần 47 (16/11 - 22/11/2026) vào tuần đang chọn? Nội dung hiện tại (chưa lưu) sẽ bị thay thế. Sau khi xem thử, nhớ bấm Lưu để áp dụng, hoặc điều hướng sang tuần khác để nhập dữ liệu thật.")) return;
  const monday = weekIdToMonday(currentWeekId);
  const newWeek = buildEmptyWeek(monday);
  newWeek.days.forEach((day, i) => {
    const sample = SAMPLE_WEEK_SESSIONS[i];
    if (!sample) return;
    day.sessions.morning = {};
    day.sessions.afternoon = {};
    for (const leaderId of Object.keys(sample)) {
      day.sessions.morning[leaderId] = sample[leaderId].morning;
      day.sessions.afternoon[leaderId] = sample[leaderId].afternoon;
    }
  });
  currentWeekData = newWeek;
  renderDaysEditor();
  banner(els.saveStatus, "Đã nạp dữ liệu mẫu. Xem thử rồi bấm “Lưu lịch công tác tuần này” để áp dụng.", "success");
});

// ---------------- Soạn / lưu lịch tuần ----------------

function renderDaysEditor() {
  if (!currentWeekData) return;
  els.daysEditor.innerHTML = currentWeekData.days.map((day, dayIdx) => {
    const blocks = leaders.map((l) => {
      const fields = SESSIONS.map((s) => `
        <div class="session-field">
          <label>${s.label}</label>
          <textarea
            data-day="${dayIdx}" data-leader="${l.id}" data-session="${s.key}"
            placeholder="Nội dung ${s.label.toLowerCase()}…"
          >${escapeHtml(day.sessions?.[s.key]?.[l.id] || "")}</textarea>
        </div>
      `).join("");
      return `
        <div class="leader-edit-block">
          <div class="lname">${escapeHtml(l.name)}</div>
          <div class="session-pair">${fields}</div>
        </div>`;
    }).join("");

    return `
      <div class="day-editor-card">
        <div class="day-editor-head">
          <span>${day.weekday}</span>
          <span>${formatDMY(day.date)}</span>
        </div>
        ${blocks}
      </div>`;
  }).join("");
}

function collectWeekDataFromForm() {
  const data = JSON.parse(JSON.stringify(currentWeekData));
  els.daysEditor.querySelectorAll("textarea").forEach((ta) => {
    const dayIdx = Number(ta.dataset.day);
    const leaderId = ta.dataset.leader;
    const sessionKey = ta.dataset.session;
    if (!data.days[dayIdx].sessions[sessionKey]) data.days[dayIdx].sessions[sessionKey] = {};
    data.days[dayIdx].sessions[sessionKey][leaderId] = ta.value;
  });
  return data;
}

els.saveWeekBtn.addEventListener("click", async () => {
  const data = collectWeekDataFromForm();
  data.updatedAt = serverTimestamp();
  data.updatedBy = auth.currentUser?.email || "unknown";
  els.saveWeekBtn.disabled = true;
  banner(els.saveStatus, "Đang lưu…", "info");
  try {
    await setDoc(doc(db, "weeks", currentWeekId), data);
    currentWeekData = data;
    banner(els.saveStatus, `Đã lưu lịch công tác tuần ${data.weekNumber} thành công — đã hiển thị trực tiếp cho mọi người.`, "success");
  } catch (e) {
    console.error(e);
    banner(els.saveStatus, "Lỗi khi lưu dữ liệu: " + e.message, "error");
  } finally {
    els.saveWeekBtn.disabled = false;
  }
});
