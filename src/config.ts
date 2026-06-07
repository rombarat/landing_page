// ============================================================
//  עורכים כאן בלבד לכל גל השקה חדש (מחיר, דדליין, וואטסאפ).
//  הכל מוזרק לסקשנים מהקובץ הזה.
// ============================================================

export const config = {
  // הצעת ההשקה
  launchPrice: '500₪',
  deliveryDays: '3 ימי עסקים',

  // תאריך תפוגה — תאריך קבוע, לא ספירה לאחור שמתאפסת.
  // פורמט: 'YYYY-MM-DD'
  launchDeadline: '2026-06-25',

  // פרטי קשר
  whatsappNumber: '972525970972', // ללא + או רווחים, כולל קידומת מדינה
  whatsappPrefilledMessage: 'היי, ראיתי את ההצעה לדף נחיתה ואשמח לפרטים',
  email: 'rombarat3336@gmail.com',

  // פרטי בעל העסק (לפוטר ולחתימה)
  ownerName: 'רום באראט',
  ownerLocation: 'ישראל',
} as const

// פורמט תאריך בעברית: "25 ביוני 2026"
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

export function formatDeadlineHebrew(): string {
  const [y, m, d] = config.launchDeadline.split('-').map(Number)
  return `${d} ב${HEBREW_MONTHS[m - 1]} ${y}`
}

// פורמט קצר: "25.06.2026"
export function formatDeadlineShort(): string {
  const [y, m, d] = config.launchDeadline.split('-').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d)}.${pad(m)}.${y}`
}

export function whatsappLink(message?: string): string {
  const msg = encodeURIComponent(message ?? config.whatsappPrefilledMessage)
  return `https://wa.me/${config.whatsappNumber}?text=${msg}`
}
