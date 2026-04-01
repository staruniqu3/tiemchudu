import { google } from "googleapis";

let cachedToken: { value: string; expiresAt: number } | null = null;

export function invalidateToken() {
  cachedToken = null;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 120000) {
    return cachedToken.value;
  }
  cachedToken = null;

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Google Sheets: missing Replit connector env vars");
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-sheet`,
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  );

  const data = await resp.json() as any;
  const item = data.items?.[0];
  const accessToken =
    item?.settings?.access_token ||
    item?.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error("Google Sheets: not connected");
  }

  const expiresAt = item?.settings?.expires_at
    ? new Date(item.settings.expires_at).getTime()
    : Date.now() + 3500 * 1000;

  cachedToken = { value: accessToken, expiresAt };
  return accessToken;
}

export async function getGoogleSheetsClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

// ─── Orders Sheet (old) ───────────────────────────────────────────────────────
export const ORDERS_SHEET_ID = "1byi1bcsjzjREU-7_1qdkHhtUXi4ts3FCNfZoyKI3OtQ";
export const ORDERS_SHEET_NAME = "Form Responses 1";

export interface SheetOrder {
  timestamp: string;
  name: string;
  phone: string;
  memberStatus: string;
  address: string;
  products: string;
  totalPrice: string;
  shippingMethod: string;
  notes: string;
}

export async function getMemberOrdersByPhone(phone: string): Promise<SheetOrder[]> {
  const sheets = await getGoogleSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: ORDERS_SHEET_ID,
    range: `${ORDERS_SHEET_NAME}!A:P`,
  });

  const rows = resp.data.values ?? [];
  if (rows.length < 2) return [];

  const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^0/, "84");
  const searchPhone = normalizePhone(phone);

  return rows
    .slice(1)
    .filter((row) => {
      const rowPhone = normalizePhone(row[2] ?? "");
      return rowPhone === searchPhone || (row[2] ?? "").trim() === phone.trim();
    })
    .map((row) => ({
      timestamp: row[0] ?? "",
      name: row[1] ?? "",
      phone: row[2] ?? "",
      memberStatus: row[3] ?? "",
      address: row[4] || row[7] || "",
      products: row[9] ?? "",
      totalPrice: row[10] ?? "",
      shippingMethod: row[14] ?? "",
      notes: row[15] ?? "",
    }));
}

// ─── Membership Sheet (new) ───────────────────────────────────────────────────
// Sheet1: STT | MÃ KH | TÊN KH | SĐT | NGÀY SINH | ĐỊA CHỈ | ĐIỂM | HẠNG |
//         ĐIỂM TÍCH LUỸ TRONG NĂM | QUY ĐỔI ĐIỂM | VOUCHERS ƯU ĐÃI |
//         VOUCHERS ĐÃ SỬ DỤNG | VOUCHER CÒN LẠI | FACEBOOK NAME | FB/IG LINK
// Sheet2: MÃ KH | MÃ VẬN ĐƠN | ĐƠN VỊ VC | TÌNH TRẠNG | CƯỚC PHÍ VC

export const MEMBERSHIP_SHEET_ID = "1bYqNlXEojkK0-y3a814lhs4mMPe3eQ5sg1db_vF2rFw";

export interface MemberProfile {
  stt: string;
  customerCode: string;
  name: string;
  phone: string;
  birthday: string;
  address: string;
  points: number;
  tier: string;
  yearPoints: number;
  redeemedPoints: number;
  vouchersGranted: number;
  vouchersUsed: number;
  vouchersRemaining: number;
  facebookName: string;
  facebookLink: string;
}

export interface MemberShipping {
  customerCode: string;
  trackingCode: string;
  carrier: string;
  status: string;
  shippingFee: string;
}

const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^0/, "84");

export async function getMemberProfile(phone: string): Promise<MemberProfile | null> {
  const sheets = await getGoogleSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: MEMBERSHIP_SHEET_ID,
    range: "Sheet1!A:O",
  });

  const rows = resp.data.values ?? [];
  if (rows.length < 2) return null;

  const searchPhone = normalizePhone(phone);

  const row = rows.slice(1).find((r) => {
    const rowPhone = normalizePhone(r[3] ?? "");
    return rowPhone === searchPhone || (r[3] ?? "").trim() === phone.trim();
  });

  if (!row) return null;

  return {
    stt: row[0] ?? "",
    customerCode: row[1] ?? "",
    name: row[2] ?? "",
    phone: row[3] ?? "",
    birthday: row[4] ?? "",
    address: row[5] ?? "",
    points: parseFloat(row[6] ?? "0") || 0,
    tier: row[7] ?? "Newcomers",
    yearPoints: parseFloat(row[8] ?? "0") || 0,
    redeemedPoints: parseFloat(row[9] ?? "0") || 0,
    vouchersGranted: parseInt(row[10] ?? "0") || 0,
    vouchersUsed: parseInt(row[11] ?? "0") || 0,
    vouchersRemaining: parseInt(row[12] ?? "0") || 0,
    facebookName: row[13] ?? "",
    facebookLink: row[14] ?? "",
  };
}

export interface AllShippingRow {
  customerCode: string;
  name: string;
  trackingCode: string;
  carrier: string;
  status: string;
  shippingFee: string;
}

export async function getAllShippingTracking(): Promise<AllShippingRow[]> {
  const sheets = await getGoogleSheetsClient();

  const [shippingResp, membersResp] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: MEMBERSHIP_SHEET_ID,
      range: "Sheet2!A:E",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: MEMBERSHIP_SHEET_ID,
      range: "Sheet1!B:C",
    }),
  ]);

  const shippingRows = shippingResp.data.values ?? [];
  const memberRows = membersResp.data.values ?? [];

  // Build code→name map from Sheet1 (col B=code, col C=name)
  const nameMap: Record<string, string> = {};
  memberRows.slice(1).forEach((r) => {
    if (r[0]) nameMap[r[0].trim()] = r[1] ?? "";
  });

  return shippingRows
    .slice(1)
    .filter((r) => r[1]) // must have tracking code
    .map((r) => ({
      customerCode: r[0] ?? "",
      name: nameMap[r[0]?.trim() ?? ""] ?? "",
      trackingCode: r[1] ?? "",
      carrier: r[2] ?? "",
      status: r[3] ?? "",
      shippingFee: r[4] ?? "",
    }));
}

export async function getAllMembers(): Promise<MemberProfile[]> {
  const sheets = await getGoogleSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: MEMBERSHIP_SHEET_ID,
    range: "Sheet1!A:O",
  });

  const rows = resp.data.values ?? [];
  if (rows.length < 2) return [];

  return rows.slice(1).filter((r) => r[2] || r[3]).map((row) => ({
    stt: row[0] ?? "",
    customerCode: row[1] ?? "",
    name: row[2] ?? "",
    phone: row[3] ?? "",
    birthday: row[4] ?? "",
    address: row[5] ?? "",
    points: parseFloat(row[6] ?? "0") || 0,
    tier: row[7] ?? "Newcomers",
    yearPoints: parseFloat(row[8] ?? "0") || 0,
    redeemedPoints: parseFloat(row[9] ?? "0") || 0,
    vouchersGranted: parseInt(row[10] ?? "0") || 0,
    vouchersUsed: parseInt(row[11] ?? "0") || 0,
    vouchersRemaining: parseInt(row[12] ?? "0") || 0,
    facebookName: row[13] ?? "",
    facebookLink: row[14] ?? "",
  }));
}

export async function getMemberShipping(customerCode: string): Promise<MemberShipping[]> {
  const sheets = await getGoogleSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: MEMBERSHIP_SHEET_ID,
    range: "Sheet2!A:E",
  });

  const rows = resp.data.values ?? [];
  if (rows.length < 2) return [];

  return rows
    .slice(1)
    .filter((r) => (r[0] ?? "").trim() === customerCode.trim() && r[1])
    .map((r) => ({
      customerCode: r[0] ?? "",
      trackingCode: r[1] ?? "",
      carrier: r[2] ?? "",
      status: r[3] ?? "",
      shippingFee: r[4] ?? "",
    }));
}
