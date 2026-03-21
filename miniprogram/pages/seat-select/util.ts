export type SeatLayoutPage = {
  seats: any[];
};

function normalizeStatus(
  saleStatus: string | undefined,
): "UNSOLD" | "WAIT_PAY" | "SOLD" {
  if (saleStatus === "SOLD" || saleStatus === "WAIT_PAY") return saleStatus;
  return "UNSOLD";
}

/** byRow 的 key 即 seatRow，按数字从大到小排序 */
function rowKeysSeatRowDesc(byRow: Record<string, any[]>): string[] {
  return Object.keys(byRow).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    const fa = Number.isFinite(na);
    const fb = Number.isFinite(nb);
    if (fa && fb) return nb - na;
    if (fa) return -1;
    if (fb) return 1;
    return b.localeCompare(a);
  });
}

/**
 * SVIP A 区：按行、按 seatNo（已排序）铺坐标。
 * - 第一排第一个元素在 (startX, startY)
 * - 同排后续座位 x 每次 + cellW
 * - 下一排：x 回到 startX，y = y - cellH + rowFloat
 */
export function renderSVIPASeat(
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
) {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 250;

  for (const rk of rowKeys) {
    const list = byRow[rk] || [];
    let x = 266;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const sr = Number(item.seatRow);
      const sn = Number(item.seatNo);
      const number = Number.isFinite(sr) && Number.isFinite(sn) ? sr * sn : 0;
      nid += 1;
      page.seats.push({
        id: nid,
        x,
        y,
        number,
        comment: ` ${areaKey} ${rk}排`,
        area: areaKey,
        selected: false,
        status: normalizeStatus(item.saleStatus),
        data: { ...item },
        apiArea: areaKey,
      });
      x += i === 4 ? 57 : 20;
    }
    y = y - 14;
  }
}

const renderSVIPDSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 384;

  for (const rk of rowKeys) {
    const list = byRow[rk] || [];
    let x = 330;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const sr = Number(item.seatRow);
      const sn = Number(item.seatNo);
      const number = Number.isFinite(sr) && Number.isFinite(sn) ? sr * sn : 0;
      nid += 1;
      page.seats.push({
        id: nid,
        x,
        y,
        number,
        comment: ` ${areaKey} ${rk}排`,
        area: areaKey,
        selected: false,
        status: normalizeStatus(item.saleStatus),
        data: { ...item },
        apiArea: areaKey,
      });
      x += 10;
    }
    y = y + 11;
  }
};

const renderSVIPBSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
) => {
  const rowKeys = rowKeysSeatRowDesc(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let x = 264.5;
  for (const rk of rowKeys) {
    let y = 274.5;

    const list = byRow[rk] || [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const sr = Number(item.seatRow);
      const sn = Number(item.seatNo);
      const number = Number.isFinite(sr) && Number.isFinite(sn) ? sr * sn : 0;
      nid += 1;
      page.seats.push({
        id: nid,
        x,
        y,
        number,
        comment: ` ${areaKey} ${rk}排`,
        area: areaKey,
        selected: false,
        status: normalizeStatus(item.saleStatus),
        data: { ...item },
        apiArea: areaKey,
      });
      y = y + 11;
    }
    x += 11;
  }
};

const renderSVIPCSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
) => {
    const rowKeys = Object.keys(byRow);

    let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
    let x = 443.2;
    for (const rk of rowKeys) {
      let y = 274.5;
  
      const list = byRow[rk] || [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const sr = Number(item.seatRow);
        const sn = Number(item.seatNo);
        const number = Number.isFinite(sr) && Number.isFinite(sn) ? sr * sn : 0;
        nid += 1;
        page.seats.push({
          id: nid,
          x,
          y,
          number,
          comment: ` ${areaKey} ${rk}排`,
          area: areaKey,
          selected: false,
          status: normalizeStatus(item.saleStatus),
          data: { ...item },
          apiArea: areaKey,
        });
        y = y + 11;
      }
      x += 11;
    }
}
export const RENDER_SEAT_MAP: Record<
  string,
  (byRow: Record<string, any[]>, page: SeatLayoutPage, areaKey: string) => void
> = {
  "SVIP A区": renderSVIPASeat,
  "SVIP D区": renderSVIPDSeat,
  "SVIP B区": renderSVIPBSeat,
  "SVIP C区": renderSVIPCSeat,

};
