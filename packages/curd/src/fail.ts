import { z } from "zod";

import { prisma } from "@acme/db";

export const FailInput = {
  create: z.object({
    libraryId: z.number(),
    path: z.string(),
    type: z.enum(["trash", "json-error", "ext"]),
  }),

  delete: z
    .object({
      libraryId: z.number().optional(),
      path: z.string().optional(),
    })
    .partial()
    .refine((input) => input.libraryId || input.path, "Either libraryId or path must be provided"),

  get: z.object({
    libraryId: z.number(),
    path: z.string().optional(),
  }),
};

export const Fail = {
  get: async (obj: z.infer<(typeof FailInput)["get"]>) => {
    const input = FailInput.get.parse(obj);

    return await prisma.fail.findMany({
      where: {
        libraryId: input.libraryId,
        path: input.path,
      },
    });
  },

  create: async (obj: z.infer<(typeof FailInput)["create"]>) => {
    const input = FailInput.create.parse(obj);
    return await prisma.fail.create({
      data: input,
    });
  },

  delete: async (obj: z.infer<(typeof FailInput)["delete"]>) => {
    const input = FailInput.delete.parse(obj);

    return await prisma.fail.deleteMany({ where: input });
  },
};
