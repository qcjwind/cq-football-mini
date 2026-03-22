export type SeatLayoutPage = {
  seats: any[];
};

/** 画布上座位方块边长（逻辑像素，与 seat-select 未设置 seatDrawSize 时回落值一致） */
export const DEFAULT_SEAT_DRAW_PX = 4;

/** 各区域渲染函数可选参数 */
export type RenderSeatLayoutOptions = {
  /** 本区域默认绘制边长；不设则用 DEFAULT_SEAT_DRAW_PX */
  seatDrawSize?: number;
};

function resolveSeatDrawSize(
  item: any,
  opts?: RenderSeatLayoutOptions,
): number {
  const fromItem = Number(item?.seatDrawSize);
  if (Number.isFinite(fromItem) && fromItem > 0) {
    return fromItem;
  }
  const fromOpts = Number(opts?.seatDrawSize);
  if (Number.isFinite(fromOpts) && fromOpts > 0) {
    return fromOpts;
  }
  return DEFAULT_SEAT_DRAW_PX;
}

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

/** 同一行内按 seatNo 数字从大到小排序（不修改原数组） */
function sortSeatsBySeatNoDesc(list: any[]): any[] {
  return [...list].sort((a, b) => {
    const na = Number(a.seatNo);
    const nb = Number(b.seatNo);
    const fa = Number.isFinite(na);
    const fb = Number.isFinite(nb);
    if (fa && fb) return nb - na;
    if (fa) return -1;
    if (fb) return 1;
    return 0;
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
  opts?: RenderSeatLayoutOptions,
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
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
  opts?: RenderSeatLayoutOptions,
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
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
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = rowKeysSeatRowDesc(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let x = 264.5;
  for (const rk of rowKeys) {
    let y = 274.5;

    const list = sortSeatsBySeatNoDesc(byRow[rk] || []);
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
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
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let x = 443.2;
  for (const rk of rowKeys) {
    let y = 274.5;

    const list = sortSeatsBySeatNoDesc(byRow[rk] || []);
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });
      y = y + 11;
    }
    x += 11;
  }
};

const renderOneFloorVIPAreaNW = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 444;

  for (const rk of rowKeys) {
    const list = byRow[rk] || [];
    let x = 195;
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });
      x += 5;
    }
    y = y + 8;
  }
};

const renderOneFloorVIPAreaSW = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 444;

  for (const rk of rowKeys) {
    const list = byRow[rk] || [];
    let x = 405;
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });
      x += 5;
    }
    y = y + 8;
  }
};

// 渲染2楼A区
export const renderF2ASeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 519;
  for (const rk of rowKeys) {
    let x = 344.5;
    const list = byRow[rk];
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });

      x += 5;
    }
    y = y + 6;
  }
};

// 二楼 B区（西北）
export const renderF2BNorthwestSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 523;
  for (const rk of rowKeys) {
    let x = 195;
    const list = byRow[rk];
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });

      /** 分界点，多加边距 */
      // 13排开始，座位号大于23的要加边距
      if ([13, 14, 15, 16].includes(+sr) && sn == 22) {
        x += 5;
      } else if (sn == 8) {
        x += 26;
      }
      x += 5;
    }
    y = y + 6;
  }
};

/** 二楼 B区（西南） */
export const renderF2BSouthwestSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 523;
  for (const rk of rowKeys) {
    let x = 423;
    const list = byRow[rk];
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });

      /** 分界点，多加边距 */
      if (
        ([10, 11, 12].includes(+sr) && sn == 36) ||
        ([13, 14, 15, 16].includes(+sr) && sn == 53)
      ) {
        x += 24;
      }
      x += 5;
    }
    y = y + 6;
  }
};

/** 二楼C区北 */
export const renderF2CNorthSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let x = 201;

  for (const rk of rowKeys) {
    const list = byRow[rk].sort((a, b) => a.seatNo - b.seatNo);
    let y = 303.5;
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });

      y = y - 5;
    }
    x += 12;
  }
};

/** 二楼C区南 */
export const renderF2SouthSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let x = 526;

  for (const rk of rowKeys) {
    const list = byRow[rk].sort((a, b) => a.seatNo - b.seatNo);
    let y = 303.5;
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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });

      y = y - 5;
    }
    x += 12;
  }
};

/** 三楼 A区（西） */
export const renderF3EastSeat = (
  byRow: Record<string, any[]>,
  page: SeatLayoutPage,
  areaKey: string,
  opts?: RenderSeatLayoutOptions,
) => {
  const rowKeys = Object.keys(byRow);

  let nid = page.seats.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  let y = 583;
  for (const rk of rowKeys) {
    let x = 193;
    const list = byRow[rk];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const sr = Number(item.seatRow);
      const sn = Number(item.seatNo);
      const number = Number.isFinite(sr) && Number.isFinite(sn) ? sr * sn : 0;
      nid += 1;

      /** 分界点，多加边距 */
      if ([17, 18, 19].includes(sr) && [9, 55].includes(sn)) {
        x += 30;
      }

      if ([22].includes(sr) && sn === 1) {
        x += 58;
      }
      if ([23].includes(sr) && sn === 1) {
        x += 68;
      }
      if ([24].includes(sr) && sn === 1) {
        x += 78;
      }

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
        seatDrawSize: resolveSeatDrawSize(item, opts),
      });
      x += 5;
    }
    y = y + 7;
  }
};

export const RENDER_SEAT_MAP: Record<
  string,
  (
    byRow: Record<string, any[]>,
    page: SeatLayoutPage,
    areaKey: string,
    opts?: RenderSeatLayoutOptions,
  ) => void
> = {
  "SVIP A区": renderSVIPASeat,
  "SVIP D区": renderSVIPDSeat,
  "SVIP B区": renderSVIPBSeat,
  "SVIP C区": renderSVIPCSeat,
  /** 示例：本区域单独更大像素可改为 `(b,p,k)=>renderOneFloorVIPAreaNW(b,p,k,{ seatDrawSize: 6 })` */
  "一楼VIP区（西北）": (b, p, k) =>
    renderOneFloorVIPAreaNW(b, p, k, { seatDrawSize: 2 }),
  "一楼VIP区（西南）": (b, p, k) =>
    renderOneFloorVIPAreaSW(b, p, k, { seatDrawSize: 2 }),
  "二楼 A区": (b, p, k) => renderF2ASeat(b, p, k, { seatDrawSize: 2 }),
  "二楼 B区（西北）": (b, p, k) =>
    renderF2BNorthwestSeat(b, p, k, { seatDrawSize: 2 }),
  "二楼 B区（西南）": (b, p, k) =>
    renderF2BSouthwestSeat(b, p, k, { seatDrawSize: 2 }),
  "二楼 C区（北）": (b, p, k) =>
    renderF2CNorthSeat(b, p, k, { seatDrawSize: 2 }),
  "二楼 C区（南）": (b, p, k) =>
    renderF2SouthSeat(b, p, k, { seatDrawSize: 2 }),
  "三楼 A区（西）": (b, p, k) => renderF3EastSeat(b, p, k, { seatDrawSize: 2 }),
};
