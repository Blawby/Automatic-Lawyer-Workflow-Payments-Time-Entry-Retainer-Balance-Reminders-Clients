// ========== CONSTANTS ==========
const SHEET_NAMES = {
  PAYMENTS: "Payments",
  CLIENTS: "Clients",
  TIME_LOGS: "TimeLogs",
  LAWYERS: "Lawyers",
  SETTINGS: "Settings",
  LOW_BALANCE: "LowBalanceWarnings",
  MATTERS: "Matters"
};

const CLIENT_COLUMNS = {
  EMAIL: 0,
  NAME: 1,
  TARGET_BALANCE: 2,
  TOTAL_PAID: 3,
  TOTAL_HOURS: 4,
  TOTAL_USED: 5,
  BALANCE: 6,
  TOP_UP: 7,
  PAYMENT_LINK: 8,
  CLIENT_ID: 9
};

const MATTER_COLUMNS = {
  MATTER_ID: 0,
  CLIENT_EMAIL: 1,
  CLIENT_NAME: 2,
  DESCRIPTION: 3,
  DATE_CREATED: 4,
  STATUS: 5,
  CASE_VALUE: 6,
  PRACTICE_AREA: 7,
  ASSIGNED_LAWYER: 8,
  ASSIGNED_LAWYER_EMAIL: 9
};

const TIME_LOG_COLUMNS = {
  DATE: 0,
  CLIENT_EMAIL: 1,
  MATTER_ID: 2,
  LAWYER_ID: 3,
  HOURS: 4
};

const PAYMENT_COLUMNS = {
  DATE: 0,
  CLIENT_EMAIL: 1,
  AMOUNT: 2,
  PAYMENT_METHOD: 3,
  PAYMENT_ID: 4
};

const LAWYER_COLUMNS = {
  EMAIL: 0,
  NAME: 1,
  RATE: 2,
  LAWYER_ID: 3,
  PRACTICE_AREAS: 4
};

const SETTINGS_COLUMNS = {
  KEY: 0,
  VALUE: 1
};

const SETTINGS_KEYS = {
  BASE_PAYMENT_URL: "Blawby Payment URL",
  DEFAULT_CURRENCY: "Default Currency",
  LOW_BALANCE_THRESHOLD: "Low Balance Threshold"
};

const SETTINGS_DEFAULTS = {
  [SETTINGS_KEYS.BASE_PAYMENT_URL]: "https://app.blawby.com/pay",
  [SETTINGS_KEYS.DEFAULT_CURRENCY]: "USD",
  [SETTINGS_KEYS.LOW_BALANCE_THRESHOLD]: "500"
};

// ========== ACTION TYPES ==========
const ACTION_TYPES = {
  SEND_EMAIL: "send_email",
  ASSIGN_MATTER: "assign_matter",
  SUBMIT_ASSIGNMENT: "submit_assignment",
  ADD_TIME_ENTRY: "add_time_entry",
  SUBMIT_TIME_ENTRY: "submit_time_entry",
  NUDGE_LAWYER: "nudge_lawyer"
};

// ========== EMAIL TYPES ==========
const EMAIL_TYPES = {
  LOW_BALANCE: "low_balance",
  SERVICE_RESUMED: "service_resumed",
  DAILY_DIGEST: "daily_digest",
  MATTER_ASSIGNED: "matter_assigned",
  LAWYER_NUDGE: "lawyer_nudge"
};

// ========== MATTER STATUS ==========
const MATTER_STATUS = {
  ACTIVE: "Active",
  CLOSED: "Closed",
  PENDING: "Pending"
};

// ========== WEB APP CONFIG ==========
const SCRIPT_BASE_URL = "https://script.google.com/macros/s/AKfycbxiztbOp4fNyuL0DzCK00SQa3gFmGYN-CUX8HYcHcUoBIMJhncasQg-0Beu38I5d8Pf/exec";

// ========== COMMON LABELS ==========
const LABELS = {
  CLIENT: "Client",
  MATTER: "Matter",
  LAWYER: "Lawyer",
  BALANCE: "Balance",
  TOP_UP: "Top-up",
  TIME_ENTRY: "Time Entry",
  ASSIGNMENT: "Assignment"
}; 