import matchService from "../../service/match";
import { RENDER_SEAT_MAP, DEFAULT_SEAT_DRAW_PX } from "./util";

// 座位状态枚举
type SeatStatus = "UNSOLD" | "WAIT_PAY" | "SOLD";

// 座位接口定义
interface Seat {
  id: number; // 座位唯一ID
  x: number; // 座位X坐标
  y: number; // 座位Y坐标
  number: number; // 展示/业务用编号（如 seatRow*seatNo）
  /** 接口座位号，写入 selectedSeats 时使用 */
  seatNo?: number;
  /** 接口排号，写入 selectedSeats 时使用 */
  seatRow?: number;
  /** 区域号，优先 data.seatArea / data.areaId */
  seatArea?: number;
  comment: string; // 座位注释（如区域）
  selected?: boolean; // 是否被选中
  status?: SeatStatus; // 座位状态
  subArea?: string; // 子区域名称
  data?: any; // 座位数据数据字段
  /** 由 RENDER_SEAT_MAP 按接口布局生成的区域名 */
  apiArea?: string;
  /** 画布上绘制边长（逻辑像素）；未设时回落到页面 seatSize / DEFAULT_SEAT_DRAW_PX */
  seatDrawSize?: number;
}

/** 赠票座位不可选、与「不可选」同一套展示 */
function isGiftTicketSeat(seat: Seat): boolean {
  return seat.data?.ticketType === "GIFT_TICKET";
}

/**
 * 电影院选座角标：圆 + 对勾置于座位格子正中心，尺寸随 seatDrawSize（dot）缩放
 */
function drawCinemaSelectedOverlay(ctx: any, x: number, y: number, dot: number) {
  if (!(dot > 0)) {
    return;
  }
  ctx.save();

  const cx = x + dot / 2;
  const cy = y + dot / 2;
  const r = dot * 0.24;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#D32F2F";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(dot * 0.04, 0.35);
  ctx.stroke();

  const t = r * 0.58;
  ctx.beginPath();
  ctx.moveTo(cx - t * 0.42, cy + t * 0.02);
  ctx.lineTo(cx - t * 0.1, cy + t * 0.34);
  ctx.lineTo(cx + t * 0.42, cy - t * 0.32);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(dot * 0.055, r * 0.22);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.restore();
}

/** 选中列表写入 setData 时补齐 seatNo / seatRow / seatArea（来自接口 data） */
function withSeatAxisForSelection(seat: Seat): Seat {
  const d = seat.data || {};
  const sn = Number(d.seatNo);
  const sr = Number(d.seatRow);
  const rawArea = d.seatArea ?? d.areaId;
  const sa = Number(rawArea);
  return {
    ...seat,
    seatNo: Number.isFinite(sn) ? sn : 0,
    seatRow: Number.isFinite(sr) ? sr : 0,
    seatArea: Number.isFinite(sa) ? sa : 0,
  };
}

// 画布尺寸接口
interface CanvasSize {
  width: number; // 宽度
  height: number; // 高度
}

Page({
  data: {
    selectedSeats: [] as Seat[], // 已选中的座位
    selectedSeatsText: "", // 已选中座位的文本描述
    /** 与 initCanvas 中 canvasWidth 一致，须与 WXML 展示宽高一致，否则 tap/触摸坐标与绘制错位 */
    canvasWidth: 375,
    canvasHeight: 1334, // 画布高度
    showCanvas: false, // 是否显示canvas
    totalPrice: 0, // 订单金额
  },

  // 画布相关属性
  canvas: null as any, // 画布实例
  ctx: null as any, // 2D上下文
  canvasSize: { width: 750, height: 1334 } as CanvasSize, // 画布尺寸
  /** 无 seatDrawSize 的座位使用的默认绘制边长（逻辑像素），与 util DEFAULT_SEAT_DRAW_PX 一致 */
  seatSize: DEFAULT_SEAT_DRAW_PX,
  bgImage: null as any, // 背景图片
  /** seat1 可选 / seat2 已售 / seat3 不可选（WAIT_PAY 等） */
  seatImages: null as null | {
    available: any;
    sold: any;
    disabled: any;
  },
  seats: [] as Seat[], // 座位数据
  scale: 1, // 基础缩放比例（设计稿750px转换为屏幕宽度）

  // 缩放相关属性
  currentScale: 1, // 当前缩放比例
  minScale: 0.5, // 最小缩放比例
  /** 点击画布放大到点/座位时的目标比例（与原先逻辑一致） */
  maxScale: 10,
  /** 双指捏合缩放上限（可高于 maxScale，仅手势） */
  pinchMaxScale: 18,
  offsetX: 0, // X轴偏移量
  offsetY: 0, // Y轴偏移量

  // 触摸事件相关属性
  lastTouchDistance: 0, // 上一次触摸距离（用于双指缩放）
  lastTouchCenter: { x: 0, y: 0 }, // 上一次触摸中心点
  pinchCenter: { x: 0, y: 0 }, // 缩放手势中心点
  isPinching: false, // 是否正在进行双指缩放
  isDragging: false, // 是否正在进行单指拖动
  lastTouchPosition: { x: 0, y: 0 }, // 上一次触摸位置
  hasMoved: false, // 是否发生了移动（用于区分点击和拖动）

  // 其他属性
  renderTimer: null as any, // 渲染定时器（用于节流）
  lastTapTime: 0, // 上一次点击时间（用于双击检测）
  initialScale: 1, // 初始缩放比例
  initialOffsetX: 0, // 初始X轴偏移
  initialOffsetY: 0, // 初始Y轴偏移

  // 匹配ID
  matchId: null as number | null,
  skuId: null as string | null,

  /** 接口座位：外层 key=area，内层 key=seatRow，value=该行下座位 item 数组 */
  areaSeatMap: {} as Record<string, Record<string, any[]>>,

  /** #seatCanvas 在视口中的位置与展示尺寸（px），touch 用 clientX/Y 换算到与 canvasSize 一致 */
  seatCanvasViewport: null as null | {
    left: number;
    top: number;
    width: number;
    height: number;
  },

  /**
   * 页面加载时初始化
   */
  onLoad(options: any) {
    this.initCanvas();

    const matchId = 14; // options.id ?? 15;
    this.skuId = options.skuId ?? "";
    if (matchId) {
      this.matchId = matchId;
      this.getSeatInfo(matchId);
    }
  },

  /**
   * 初始化画布
   */
  async initCanvas() {
    // 先获取图片信息获取尺寸
    wx.getImageInfo({
      src: "/assets/seat.jpg",
      success: (res: any) => {
        const imgWidth = res.width;
        const imgHeight = res.height;
        const imgRatio = imgWidth / imgHeight;

        const systemInfo = wx.getSystemInfoSync();
        const screenWidth = systemInfo.windowWidth;
        const dpr = systemInfo.pixelRatio;

        const canvasWidth = screenWidth;
        const canvasHeight = screenWidth / imgRatio;

        // 设置数据，让 canvas 显示出来（展示宽高必须与 buffer/ctx 逻辑尺寸一致）
        this.setData({
          canvasWidth,
          canvasHeight,
          showCanvas: true,
        });

        // 延迟获取 canvas 节点，确保 DOM 已更新
        setTimeout(() => {
          const query = wx.createSelectorQuery();
          query
            .select("#seatCanvas")
            .fields({ node: true, size: true })
            .exec((res: any) => {
              if (!res || !res[0]) {
                console.error("Canvas 获取失败");
                return;
              }

              const canvas = res[0].node;
              const ctx = canvas.getContext("2d");

              this.canvas = canvas;
              this.ctx = ctx;

              // 加载背景图片
              const img = canvas.createImage();
              img.src = "/assets/seat.jpg";
              img.onload = () => {
                this.bgImage = img;

                // 设置 canvas 实际宽高
                canvas.width = canvasWidth * dpr;
                canvas.height = canvasHeight * dpr;
                ctx.scale(dpr, dpr);

                this.canvasSize = { width: canvasWidth, height: canvasHeight };
                this.scale = canvasWidth / 750;

                // 同步 canvas 在页面中的展示盒，供触摸坐标换算（避免 Y 与 detail 偏差）
                this.refreshSeatCanvasViewport();

                // 记录初始状态
                this.initialScale = this.currentScale;
                this.initialOffsetX = this.offsetX;
                this.initialOffsetY = this.offsetY;

                this.initSeats();
                this.loadSeatImages(canvas, () => {
                  this.render();
                });
              };
              img.onerror = (err: any) => {
                console.error("背景图片加载失败", err);
                this.initSeats();
                this.loadSeatImages(canvas, () => {
                  this.render();
                });
              };
            });
        }, 0);
      },
      fail: (err: any) => {
        console.error("获取图片信息失败", err);
      },
    });
  },

  /**
   * 初始化座位数据
   */
  initSeats() {
    // 座位完全由 getSeatInfo + RENDER_SEAT_MAP 根据接口数据生成，不使用 seat_pos
    if (this.seats && this.seats.length > 0) {
      return;
    }
    this.seats = [];
  },

  /**
   * 加载座位贴图（须与 canvas 同源 createImage）
   */
  loadSeatImages(canvas: any, onReady: () => void) {
    const specs = [
      { key: "available" as const, src: "/assets/seat1.png" },
      { key: "sold" as const, src: "/assets/seat2.png" },
      { key: "disabled" as const, src: "/assets/seat3.png" },
    ];
    const images: { available: any; sold: any; disabled: any } = {
      available: null,
      sold: null,
      disabled: null,
    };
    let pending = specs.length;
    const done = () => {
      pending -= 1;
      if (pending === 0) {
        this.seatImages = images;
        onReady();
      }
    };
    specs.forEach(({ key, src }) => {
      const im = canvas.createImage();
      im.onload = done;
      im.onerror = (err: any) => {
        console.error("座位图加载失败:", src, err);
        images[key] = null;
        done();
      };
      im.src = src;
      images[key] = im;
    });
  },

  /**
   * 渲染画布
   */
  render() {
    if (!this.ctx) return;

    const { width, height } = this.canvasSize;

    // 清空画布
    this.ctx.clearRect(0, 0, width, height);

    // 保存当前状态
    this.ctx.save();

    // 应用变换（偏移和缩放）
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.currentScale, this.currentScale);

    // 绘制背景图片
    if (this.bgImage) {
      this.ctx.drawImage(this.bgImage, 0, 0, width, height);
    }

    // 绘制座位
    this.drawSeats();

    // 恢复之前的状态
    this.ctx.restore();
  },

  /**
   * 绘制座位
   */
  drawSeats() {
    const { ctx, scale, seatSize, seats, seatImages } = this;

    seats.forEach((seat: Seat) => {
      const dot = seat.seatDrawSize ?? seatSize;
      const x = seat.x * scale - dot / 2;
      const y = seat.y * scale - dot / 2;

      let tile: any = null;
      if (seat.status === "SOLD") {
        tile = seatImages?.sold;
      } else if (seat.status === "WAIT_PAY" || isGiftTicketSeat(seat)) {
        tile = seatImages?.disabled;
      } else {
        tile = seatImages?.available;
      }

      const canDraw =
        tile &&
        typeof tile.width === "number" &&
        tile.width > 0 &&
        typeof tile.height === "number" &&
        tile.height > 0;

      if (canDraw) {
        ctx.drawImage(tile, x, y, dot, dot);
      } else {
        if (seat.status === "SOLD") {
          ctx.fillStyle = "#F44336";
        } else if (seat.status === "WAIT_PAY" || isGiftTicketSeat(seat)) {
          ctx.fillStyle = "#FFEB3B";
        } else if (seat.selected && seat.status === "UNSOLD") {
          ctx.fillStyle = "#4CAF50";
        } else {
          ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillRect(x, y, dot, dot);
      }

      if (
        seat.selected &&
        seat.status === "UNSOLD" &&
        !isGiftTicketSeat(seat)
      ) {
        drawCinemaSelectedOverlay(ctx, x, y, dot);
      }
    });
  },

  /**
   * 将点击/触摸转为与 ctx 绘制一致的 canvas 逻辑坐标（与 canvasSize 一致，单位 px）。
   * 部分机型/基础库下 canvas bindtap 的 detail.x/y（尤其 Y）与 2D 绘制坐标不一致，
   * 优先用 changedTouches + boundingClientRect 换算，并按展示区域与逻辑尺寸比例映射。
   */
  getCanvasLocalXYFromPointerEvent(
    e: any,
    callback: (x: number, y: number) => void,
  ) {
    const logicalW = this.canvasSize.width;
    const logicalH = this.canvasSize.height;
    const detail = e.detail || {};
    const fallback = () => {
      callback(Number(detail.x) || 0, Number(detail.y) || 0);
    };

    if (!(logicalW > 0 && logicalH > 0)) {
      fallback();
      return;
    }

    const touch =
      (e.changedTouches && e.changedTouches[0]) ||
      (e.touches && e.touches[0]);

    wx.createSelectorQuery()
      .in(this)
      .select("#seatCanvas")
      .boundingClientRect()
      .exec((res: any) => {
        const rect = res && res[0];
        if (rect && rect.width > 0 && rect.height > 0) {
          this.seatCanvasViewport = rect;
        }
        if (
          rect &&
          rect.width > 0 &&
          rect.height > 0 &&
          touch &&
          typeof touch.clientX === "number" &&
          typeof touch.clientY === "number"
        ) {
          const x =
            ((touch.clientX - rect.left) * logicalW) / rect.width;
          const y =
            ((touch.clientY - rect.top) * logicalH) / rect.height;
          callback(x, y);
          return;
        }
        // 无触摸点（如开发者工具鼠标）时仍用 detail，并按展示盒与逻辑尺寸对齐
        if (
          rect &&
          rect.width > 0 &&
          rect.height > 0 &&
          typeof detail.x === "number" &&
          typeof detail.y === "number"
        ) {
          callback(
            (detail.x * logicalW) / rect.width,
            (detail.y * logicalH) / rect.height,
          );
          return;
        }
        fallback();
      });
  },

  /** 查询并缓存 #seatCanvas 的 boundingClientRect（页面滚动/布局变化后需更新） */
  refreshSeatCanvasViewport() {
    wx.createSelectorQuery()
      .in(this)
      .select("#seatCanvas")
      .boundingClientRect()
      .exec((res: any) => {
        const rect = res && res[0];
        if (rect && rect.width > 0 && rect.height > 0) {
          this.seatCanvasViewport = rect;
        }
      });
  },

  /** 将触摸点转为与绘制一致的 canvas 逻辑坐标 */
  touchPointToCanvasLocal(touch: any): { x: number; y: number } {
    const rect = this.seatCanvasViewport;
    const lw = this.canvasSize.width;
    const lh = this.canvasSize.height;
    if (
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      lw > 0 &&
      lh > 0 &&
      typeof touch.clientX === "number" &&
      typeof touch.clientY === "number"
    ) {
      return {
        x: ((touch.clientX - rect.left) * lw) / rect.width,
        y: ((touch.clientY - rect.top) * lh) / rect.height,
      };
    }
    return { x: Number(touch.x) || 0, y: Number(touch.y) || 0 };
  },

  /**
   * 画布点击事件
   */
  onCanvasTap(e: any) {
    // 如果正在缩放或拖动，不处理点击
    if (this.isPinching || this.hasMoved) return;

    // 双击检测
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;
    this.lastTapTime = now;

    if (timeDiff < 300) {
      this.resetZoom();
      return;
    }

    this.getCanvasLocalXYFromPointerEvent(e, (x, y) => {
      const { scale, seatSize, seats, currentScale, offsetX, offsetY } = this;

      // 转换坐标到世界坐标系（与 render 中 translate/scale 一致）
      const transformedX = (x - offsetX) / currentScale;
      const transformedY = (y - offsetY) / currentScale;

      let clickedSeat = null;

      // 检测是否点击到座位（热区与单座 seatDrawSize 一致）
      for (let i = 0; i < seats.length; i++) {
        const seat = seats[i];
        const seatX = seat.x * scale;
        const seatY = seat.y * scale;

        const dot = seat.seatDrawSize ?? seatSize;
        const halfSize = dot / 2 + 2;

        if (
          transformedX >= seatX - halfSize &&
          transformedX <= seatX + halfSize &&
          transformedY >= seatY - halfSize &&
          transformedY <= seatY + halfSize
        ) {
          clickedSeat = seat;
          break;
        }
      }

      // 根据缩放比例执行不同操作
      if (currentScale < 1.5) {
        if (clickedSeat) {
          this.zoomToSeat(clickedSeat);
        } else {
          this.zoomToPoint(transformedX, transformedY);
        }
      } else {
        if (clickedSeat) {
          if (
            clickedSeat.status === "WAIT_PAY" ||
            clickedSeat.status === "SOLD" ||
            isGiftTicketSeat(clickedSeat)
          ) {
            return;
          }
          if (clickedSeat.status === "UNSOLD") {
            clickedSeat.selected = !clickedSeat.selected;
            this.updateSelectedSeats();
          }
        }
      }
    });
  },

  /**
   * 重置缩放到初始状态
   */
  resetZoom() {
    this.animateZoom(
      this.initialScale,
      this.initialOffsetX,
      this.initialOffsetY,
    );
  },

  /**
   * 放大到指定点
   */
  zoomToPoint(pointX: number, pointY: number) {
    const targetScale = this.maxScale;

    const centerX = this.canvasSize.width / 2;
    const centerY = this.canvasSize.height / 2;

    // 计算目标偏移量，使点击点居中
    const targetOffsetX = centerX - pointX * targetScale;
    const targetOffsetY = centerY - pointY * targetScale;

    this.animateZoom(targetScale, targetOffsetX, targetOffsetY);
  },

  /**
   * 放大到指定座位
   */
  zoomToSeat(seat: Seat) {
    const targetScale = this.maxScale;
    const seatX = seat.x * this.scale;
    const seatY = seat.y * this.scale;

    const centerX = this.canvasSize.width / 2;
    const centerY = this.canvasSize.height / 2;

    // 计算目标偏移量，使座位居中
    const targetOffsetX = centerX - seatX * targetScale;
    const targetOffsetY = centerY - seatY * targetScale;

    this.animateZoom(targetScale, targetOffsetX, targetOffsetY);
  },

  /**
   * 动画缩放
   */
  animateZoom(
    targetScale: number,
    targetOffsetX: number,
    targetOffsetY: number,
  ) {
    const startScale = this.currentScale;
    const startOffsetX = this.offsetX;
    const startOffsetY = this.offsetY;

    const duration = 300; // 动画持续时间（毫秒）
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 使用缓动函数使动画更自然
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // 计算当前状态
      this.currentScale =
        startScale + (targetScale - startScale) * easeProgress;
      this.offsetX =
        startOffsetX + (targetOffsetX - startOffsetX) * easeProgress;
      this.offsetY =
        startOffsetY + (targetOffsetY - startOffsetY) * easeProgress;

      // 重新渲染
      this.render();

      // 继续动画
      if (progress < 1) {
        setTimeout(animate, 16);
      }
    };

    setTimeout(animate, 16);
  },

  /**
   * 更新选中座位
   */
  updateSelectedSeats() {
    // 过滤出选中的座位，并写入 seatNo / seatRow / seatArea 供页面与下单使用
    const selectedSeats = this.seats
      .filter((seat: Seat) => seat.selected && !isGiftTicketSeat(seat))
      .map((seat: Seat) => withSeatAxisForSelection(seat));
    // 生成选中座位的文本描述
    const selectedSeatsText = selectedSeats
      .map((seat: Seat) => `${seat.comment} ${seat.number}号`)
      .join("、");
    // 计算订单金额
    const totalPrice = selectedSeats.reduce(
      (acc, cur) => acc + (cur.data?.price || 0),
      0,
    );

    // 更新数据
    this.setData({
      totalPrice,
      selectedSeats,
      selectedSeatsText,
    });

    // 清除之前的渲染定时器
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
    // 重新渲染
    this.render();
  },

  /**
   * 移除选中的座位
   */
  removeSeat(e: any) {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      const selectedSeats = this.data.selectedSeats;
      if (selectedSeats[index]) {
        const seatId = selectedSeats[index].id;
        // 找到对应座位并取消选中
        const seat = this.seats.find((s: Seat) => s.id === seatId);
        if (seat) {
          seat.selected = false;
          this.updateSelectedSeats();
        }
      }
    }
  },

  /**
   * 触摸开始事件
   */
  onTouchStart(e: any) {
    this.refreshSeatCanvasViewport();
    const touches = e.touches;
    if (touches.length === 2) {
      // 双指触摸，开始缩放
      this.isPinching = true;
      this.isDragging = false;
      this.hasMoved = false;
      const touch1 = touches[0];
      const touch2 = touches[1];

      // 计算初始距离和中心点
      this.lastTouchDistance = this.getDistance(touch1, touch2);
      this.lastTouchCenter = this.getCenter(touch1, touch2);

      // 计算世界坐标系中的中心点
      const worldCenterX =
        (this.lastTouchCenter.x - this.offsetX) / this.currentScale;
      const worldCenterY =
        (this.lastTouchCenter.y - this.offsetY) / this.currentScale;

      this.pinchCenter = { x: worldCenterX, y: worldCenterY };
    } else if (touches.length === 1) {
      // 单指触摸，开始拖动
      this.isDragging = true;
      this.isPinching = false;
      const p0 = this.touchPointToCanvasLocal(touches[0]);
      this.lastTouchPosition = { x: p0.x, y: p0.y };
      this.hasMoved = false;
    }
  },

  /**
   * 触摸移动事件
   */
  onTouchMove(e: any) {
    if (this.isPinching && e.touches.length === 2) {
      // 双指移动，处理缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // 计算当前距离和中心点
      const currentDistance = this.getDistance(touch1, touch2);
      const currentCenter = this.getCenter(touch1, touch2);

      // 计算缩放比例
      const distanceRatio = currentDistance / this.lastTouchDistance;
      let newScale = this.currentScale * distanceRatio;

      // 限制缩放范围
      newScale = Math.max(
        this.minScale,
        Math.min(this.pinchMaxScale, newScale),
      );

      // 计算偏移量
      const scaleRatio = newScale / this.currentScale;

      this.offsetX =
        currentCenter.x - (currentCenter.x - this.offsetX) * scaleRatio;
      this.offsetY =
        currentCenter.y - (currentCenter.y - this.offsetY) * scaleRatio;

      // 更新状态
      this.currentScale = newScale;
      this.lastTouchDistance = currentDistance;
      this.lastTouchCenter = currentCenter;

      this.hasMoved = true;

      // 节流渲染
      this.throttledRender();
    } else if (this.isDragging && e.touches.length === 1) {
      // 单指移动，处理拖动
      const touch = e.touches[0];
      const p = this.touchPointToCanvasLocal(touch);
      const deltaX = p.x - this.lastTouchPosition.x;
      const deltaY = p.y - this.lastTouchPosition.y;

      // 计算移动距离
      const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 移动超过5像素才算拖动
      if (moveDistance > 5) {
        this.hasMoved = true;
      }

      if (this.hasMoved) {
        // 更新偏移量
        this.offsetX += deltaX;
        this.offsetY += deltaY;

        this.lastTouchPosition = { x: p.x, y: p.y };

        // 节流渲染
        this.throttledRender();
      }
    }
  },

  /**
   * 触摸结束事件
   */
  onTouchEnd(e: any) {
    if (e.touches.length < 2) {
      // 少于两指，结束缩放
      this.isPinching = false;
      this.pinchCenter = { x: 0, y: 0 };
    }

    if (e.touches.length === 0) {
      // 没有手指，结束拖动
      this.isDragging = false;
      // 延迟重置hasMoved，避免触发点击事件
      setTimeout(() => {
        this.hasMoved = false;
      }, 50);
    }
  },

  /**
   * 计算两点距离
   */
  getDistance(touch1: any, touch2: any) {
    const p1 = this.touchPointToCanvasLocal(touch1);
    const p2 = this.touchPointToCanvasLocal(touch2);
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 计算两点中心点
   */
  getCenter(touch1: any, touch2: any) {
    const p1 = this.touchPointToCanvasLocal(touch1);
    const p2 = this.touchPointToCanvasLocal(touch2);
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  },

  /**
   * 节流渲染
   */
  throttledRender() {
    if (this.renderTimer) {
      return;
    }

    this.renderTimer = setTimeout(() => {
      this.render();
      this.renderTimer = null;
    }, 16); // 约60fps
  },

  /** 查询座位信息 */
  async getSeatInfo(matchId: any) {
    const { code, data } = await matchService.getPlaceSeatInfo(matchId);
    if (code !== 200 || !data || data.length === 0) {
      this.seats = [];
      if (this.ctx) {
        this.render();
      }
      return;
    }

    const areaSeatMap: Record<string, Record<string, any[]>> = {};
    data.forEach((item: any) => {
      const areaKey = item.area != null ? String(item.area) : "";
      const rowKey =
        item.seatRow != null && item.seatRow !== "" ? String(item.seatRow) : "";
      if (!areaSeatMap[areaKey]) {
        areaSeatMap[areaKey] = {};
      }
      if (!areaSeatMap[areaKey][rowKey]) {
        areaSeatMap[areaKey][rowKey] = [];
      }
      areaSeatMap[areaKey][rowKey].push(item);
    });
    // 同一行内按 seatNo 升序
    Object.keys(areaSeatMap).forEach((ak) => {
      const byRow = areaSeatMap[ak];
      Object.keys(byRow).forEach((rk) => {
        byRow[rk].sort((a: any, b: any) => {
          const na = Number(a.seatNo);
          const nb = Number(b.seatNo);
          return (
            (Number.isFinite(na) ? na : 0) - (Number.isFinite(nb) ? nb : 0)
          );
        });
      });
    });
    this.areaSeatMap = areaSeatMap;
    console.log('this.areaSeatMap', this.areaSeatMap);
    
    // 仅按 RENDER_SEAT_MAP 注册的区域与布局函数生成画布座位（不读 seat_pos）
    this.seats = [];
    Object.keys(RENDER_SEAT_MAP).forEach((ak) => {
      if (areaSeatMap[ak]) {
        RENDER_SEAT_MAP[ak](areaSeatMap[ak], this, ak);
      }
    });

    if (this.ctx) {
      this.render();
    }
  },

  /** 确认选座 */
  buyTicket() {
    console.log(this.data.selectedSeats);
    if (!this.data.selectedSeats.length) {
      wx.showToast({
        title: "请选择座位",
        icon: "none",
      });
      return;
    } else {
      const totalPrice = this.data.selectedSeats.reduce(
        (acc, cur: any) => acc + (cur.data?.price ?? 0),
        0,
      );
      const buyIds = this.data.selectedSeats
        .map((item: any) => item.data?.bid)
        ?.join(",");
      wx.redirectTo({
        url: `/pages/order-confirm/order-confirm?matchId=${this.matchId}&buyIds=${buyIds}&price=${totalPrice}&needIdForTicket=Y&skuId=${this.skuId}`,
      });
    }
  },
});
