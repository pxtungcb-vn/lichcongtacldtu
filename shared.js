// ============================================================================
// shared.js — Các hàm & hằng số dùng chung giữa trang hiển thị và trang nhập liệu
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const WEEKDAY_LABELS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

export const SESSIONS = [
  { key: "morning", label: "Sáng" },
  { key: "afternoon", label: "Chiều" },
];

// --- Tiện ích ngày/tuần (theo chuẩn ISO 8601, tuần bắt đầu từ Thứ Hai) ------

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromDateStr(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDMY(d) {
  if (typeof d === "string") d = fromDateStr(d);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Trả về Thứ Hai của tuần chứa ngày `date`
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Số tuần ISO 8601
export function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

// Tạo weekId dạng "2026-W47" cho một ngày bất kỳ trong tuần đó
export function getWeekId(date) {
  const year = getISOWeekYear(date);
  const week = getISOWeekNumber(date);
  return `${year}-W${pad2(week)}`;
}

// Tạo cấu trúc tuần rỗng (7 ngày x 2 buổi) bắt đầu từ ngày Thứ Hai `monday`
export function buildEmptyWeek(monday) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: toDateStr(d),
      weekday: WEEKDAY_LABELS[i],
      sessions: {
        morning: {},
        afternoon: {},
      },
    });
  }
  const weekNumber = getISOWeekNumber(monday);
  const weekYear = getISOWeekYear(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekNumber,
    year: weekYear,
    startDate: toDateStr(monday),
    endDate: toDateStr(sunday),
    days,
  };
}

export function weekIdToMonday(weekId) {
  // weekId: "YYYY-Www"
  const [yearStr, wStr] = weekId.split("-W");
  const year = Number(yearStr);
  const week = Number(wStr);
  // ISO: ngày 4/1 luôn thuộc tuần 1
  const jan4 = new Date(year, 0, 4);
  const mondayWeek1 = getMonday(jan4);
  const monday = new Date(mondayWeek1);
  monday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  return monday;
}

export function neighborWeekId(weekId, offsetWeeks) {
  const monday = weekIdToMonday(weekId);
  monday.setDate(monday.getDate() + offsetWeeks * 7);
  return getWeekId(monday);
}
