import { logger } from "@eagleuse/utils";
import { readFileSync, writeFileSync } from "fs-extra";
import _ from "lodash";

// 触发 eagleuse.db 让fs.watch能监听到
export const trigger = _.debounce(() => {
  const file = process.env.LIBRARY + "/eagleuse.db";
  const content = readFileSync(file);
  writeFileSync(file, content);
  logger.info("Trigger file update");
}, 10000);