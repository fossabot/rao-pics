import { type Config, type Image } from "@acme/db";

/**
 * 获取图片的 url，如果访问页面使用的ip，就使用ip，否则使用site
 * @param config
 * @returns
 */
export const getAssetUrl = (config: Config | null | undefined) => {
  if (!config) return null;

  const { ip, site, assetsPort } = config;

  // 本地访问直接使用ip
  if (window.location.hostname === ip) return `http://${ip}:${assetsPort}`;

  return site || `http://${ip}:${assetsPort}`;
};

export const getImgUrl = (prefix: string, img: Image, original = false) => {
  let p = img.thumbnailPath || img.path;

  if (original) {
    p = img.path;
  }

  return `${prefix}/${img.libraryId}/${p}`;
};

export const transformByteToUnit = (bytes = 0, decimals = 2) => {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const getGridOption = (responsive: { [key in string]: boolean }) => {
  let res = "";
  for (const k in responsive) {
    if (responsive[k]) res = k;
    else break;
  }

  const grid = GridScreens[res as keyof typeof GridScreens];

  return {
    responsiveKey: res,
    gridOption: grid,
  };
};

/**
 * {screen: [列表可以切换的列数和 GridScreensConfig 对应]}
 *
 * @ps 当前设备 iphone SE width:375px 匹配 xs，切换列数为 grid-cols-1 和 grid-cols-2
 *     当切换到 1，也就是 index=1
 *
 * @result GridScreens[xs][1] => grid-cols-1
 *         GridScreensConfig[xs][1] => { body: true, gap: "gap-4", p: "p-4" }
 * */
export const GridScreens = {
  // 0-375: xs
  xs: ["grid-cols-1", "grid-cols-2"],
  // 376-640: sm
  sm: ["grid-cols-1", "grid-cols-2", "grid-cols-3"],
  // 641-768: md
  md: ["grid-cols-3", "grid-cols-2", "grid-cols-1"],
  // 769-1024: lg
  lg: ["grid-cols-3", "grid-cols-4", "grid-cols-6"],
  // 1025-1280: xl
  xl: ["grid-cols-3", "grid-cols-4", "grid-cols-6"],
  // 1281-1536: 2xl
  xxl: ["grid-cols-6", "grid-cols-8", "grid-cols-12"],
};

export const GridScreensConfig: Record<string, Record<string, { body: boolean; gap: string; p: string }>> = {
  xxl: {
    "6": { body: true, gap: "gap-4", p: "p-4" },
    "8": { body: false, gap: "gap-4", p: "p-4" },
    "12": { body: false, gap: "gap-3", p: "p-3" },
  },
  xl: {
    "3": { body: true, gap: "gap-4", p: "p-4" },
    "4": { body: true, gap: "gap-3", p: "p-3" },
    "6": { body: false, gap: "gap-3", p: "p-3" },
  },
  lg: {
    "3": { body: true, gap: "gap-3", p: "p-3" },
    "4": { body: true, gap: "gap-2", p: "p-2" },
    "6": { body: false, gap: "gap-3", p: "p-3" },
  },
  md: {
    "1": { body: true, gap: "gap-4", p: "p-4" },
    "2": { body: true, gap: "gap-3", p: "p-3" },
    "3": { body: false, gap: "gap-3", p: "p-3" },
  },
  sm: {
    "1": { body: true, gap: "gap-4", p: "p-4" },
    "2": { body: true, gap: "gap-3", p: "p-2" },
    "3": { body: false, gap: "gap-2", p: "p-2" },
  },
  xs: {
    "1": { body: true, gap: "gap-4", p: "p-4" },
    "2": { body: false, gap: "gap-3", p: "p-2" },
  },
};
