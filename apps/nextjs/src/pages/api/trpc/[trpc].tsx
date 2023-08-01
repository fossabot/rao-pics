import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "@acme/api";

// export API handler
export default createNextApiHandler({
  router: appRouter,
});
