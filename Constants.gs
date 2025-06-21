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
  CASE_VALUE: 6
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
  PAYMENT_METHOD: 3
};

const LAWYER_COLUMNS = {
  EMAIL: 0,
  NAME: 1,
  RATE: 2,
  LAWYER_ID: 3
};

const SETTINGS_COLUMNS = {
  KEY: 0,
  VALUE: 1
};

const SETTINGS_KEYS = {
  BASE_PAYMENT_URL: "Blawby Payment URL",
  DEFAULT_CURRENCY: "Default Currency",
  TARGET_BALANCE_PERCENTAGE: "target_balance_percentage",
  MIN_TARGET_BALANCE: "min_target_balance",
  LOW_BALANCE_THRESHOLD: "Low Balance Threshold",
  EMAIL_NOTIFICATIONS: "Email Notifications",
  TEST_MODE: "Test Mode",
  FIRM_EMAIL: "Firm Email"
};

const DEFAULT_SETTINGS = {
  [SETTINGS_KEYS.BASE_PAYMENT_URL]: "https://app.blawby.com/northcarolinalegalservices/pay",
  [SETTINGS_KEYS.DEFAULT_CURRENCY]: "USD",
  [SETTINGS_KEYS.TARGET_BALANCE_PERCENTAGE]: "10",
  [SETTINGS_KEYS.MIN_TARGET_BALANCE]: "500",
  [SETTINGS_KEYS.LOW_BALANCE_THRESHOLD]: "1000",
  [SETTINGS_KEYS.EMAIL_NOTIFICATIONS]: "true",
  [SETTINGS_KEYS.TEST_MODE]: "false",
  [SETTINGS_KEYS.FIRM_EMAIL]: "admin@blawby.com"
}; 