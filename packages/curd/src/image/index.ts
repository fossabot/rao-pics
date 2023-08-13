import { z } from "zod";

import { CONSTANT } from "@acme/constant";
import { prisma, type Prisma } from "@acme/db";
import { hexToRgb } from "@acme/util";

import curd from "../..";
import { updateColors } from "./updateColors";
import { updateFolders } from "./updateFolders";
import { updateTags } from "./updateTags";

export const ImageInput = {
  create: z.object({
    libraryId: z.number(),
    path: z.string(),
    thumbnailPath: z.string(),
    name: z.string(),
    size: z.number(),
    createTime: z.date(),
    lastTime: z.date(),
    ext: z.enum(CONSTANT.EXT),
    width: z.number(),
    height: z.number(),
    duration: z.number().optional(),
    folders: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().optional(),
        }),
      )
      .optional(),
    tags: z.array(z.string()).optional(),
    /** @type 只会保存 9 种颜色 */
    colors: z.array(z.string().length(7).startsWith("#")).optional(),
  }),

  delete: z
    .object({
      id: z.number().optional(),
      path: z.string().optional(),
      libraryId: z.number().optional(),
      pathStartsWith: z.string().optional(),
    })
    .partial()
    .refine((obj) => !!obj.id || !!obj.path || !!obj.libraryId, "At least one of id, path, libraryId is required."),

  update: z.object({
    libraryId: z.number(),
    id: z.number(),
    path: z.string().optional(),
    thumbnailPath: z.string().optional(),
    name: z.string().optional(),
    size: z.number().optional(),
    createTime: z.date().optional(),
    lastTime: z.date().optional(),
    ext: z.enum(CONSTANT.EXT).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    folders: z
      .array(
        z.object({
          id: z.string(),
        }),
      )
      .optional(),
    tags: z.array(z.string()).optional(),
    /** @type 只会保存 9 种颜色 */
    colors: z.array(z.string().length(7).startsWith("#")).optional(),
  }),

  get: z
    .object({
      id: z.union([z.number(), z.array(z.number())]).optional(),
      path: z.string().optional(),
      libraryId: z.number().optional(),
      pathStartsWith: z.string().optional(),
    })
    .refine((object) => object.libraryId || object.id, {
      message: "id or libraryId is required.",
    }),
};

export const Image = {
  get: (obj: z.infer<(typeof ImageInput)["get"]>) => {
    const input = ImageInput.get.parse(obj);

    const { id, path } = input;

    const where: Prisma.ImageWhereInput = {};

    if (id) {
      where.id = {
        in: typeof input.id === "number" ? [input.id] : input.id,
      };
    }

    if (input.libraryId) {
      where.libraryId = input.libraryId;
    }

    if (path) {
      where.path = path;
    }

    if (input.pathStartsWith) {
      where.path = {
        startsWith: input.pathStartsWith,
      };
    }

    return prisma.image.findMany({
      where,
      include: {
        folders: true,
        tags: true,
        colors: true,
      },
    });
  },

  /**
   * 创建图片的同时创建文件夹、标签、颜色
   * 文件夹、颜色，可以通过 id 修改，但是标签只能创建，不能修改。
   */
  create: (obj: z.infer<(typeof ImageInput)["create"]>) => {
    const input = ImageInput.create.parse(obj);

    let folders: Prisma.FolderUncheckedCreateNestedManyWithoutImagesInput | undefined;
    let tags: Prisma.TagUncheckedCreateNestedManyWithoutImagesInput | undefined;
    let colors: Prisma.ColorUncheckedCreateNestedManyWithoutImagesInput | undefined;

    if (input.folders) {
      folders = {
        connectOrCreate: input.folders.map((folder) => ({
          where: { id: folder.id },
          create: {
            // 传入 id 时，使用 id 作为 folder 的 id，否则使用 name 作为 id
            id: folder.id,
            name: folder.name || folder.id,
            library: { connect: { id: input.libraryId } },
          },
        })),
      };
    }

    if (input.tags) {
      tags = {
        connectOrCreate: input.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag, library: { connect: { id: input.libraryId } } },
        })),
      };
    }

    if (input.colors) {
      colors = {
        connectOrCreate: [
          // 颜色 9 种，每种颜色的值为 100 的倍数，并且去重，将颜色总数减少 100 倍。
          ...new Set(input.colors.splice(0, 9).map((color) => hexToRgb(color))),
        ].map((color) => ({
          where: { rgb: color },
          create: { rgb: color },
        })),
      };
    }

    return prisma.image.create({
      data: {
        libraryId: input.libraryId,
        path: input.path,
        thumbnailPath: input.thumbnailPath,
        name: input.name,
        size: input.size,
        createTime: input.createTime,
        lastTime: input.lastTime,
        ext: input.ext,
        width: input.width,
        height: input.height,
        duration: input.duration,
        folders: folders,
        tags,
        colors,
      },
    });
  },

  delete: async (obj: z.infer<(typeof ImageInput)["delete"]>) => {
    const input = ImageInput.delete.parse(obj);

    if (input.pathStartsWith) {
      await prisma.image.deleteMany({ where: { path: { startsWith: input.pathStartsWith } } });
    } else {
      await prisma.image.deleteMany({ where: input });
    }

    return curd.color.clear();
  },

  update: async (obj: z.infer<(typeof ImageInput)["update"]>) => {
    try {
      const input = ImageInput.update.parse(obj);
      const oldImage = await curd.image.get({ id: input.id });

      // 更新 tag/folder/color 时，只有一种情况，删除/新增。不会修改到 tag/folder/color 本身。
      const updateArgs: Prisma.ImageUpdateArgs = {
        where: { id: input.id },
        data: {
          libraryId: input.libraryId,
          path: input.path,
          thumbnailPath: input.thumbnailPath,
          name: input.name,
          size: input.size,
          createTime: input.createTime,
          lastTime: input.lastTime,
          ext: input.ext,
          width: input.width,
          height: input.height,
          duration: input.duration,
        },
      };

      updateArgs.data["folders"] = input.folders ? updateFolders(input.folders, oldImage[0]?.folders || []) : undefined;

      updateArgs.data["tags"] = input.tags
        ? updateTags(
            input.tags,
            (oldImage[0]?.tags || []).map((item) => item.name),
          )
        : undefined;

      updateArgs.data["colors"] = input.colors
        ? updateColors(
            input.colors.map((item) => ({ rgb: hexToRgb(item) })),
            oldImage[0]?.colors || [],
          )
        : undefined;

      return await prisma.image.update(updateArgs);
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};
