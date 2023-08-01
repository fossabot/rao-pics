import curd, { ZodInput } from "@acme/curd";

import { t } from "../trpc";

export const config = t.router({
  get: t.procedure.query(() => {
    return curd.config.get();
  }),

  update: t.procedure.input(ZodInput.config.update).mutation(({ input }) => curd.config.update(input)),
});
