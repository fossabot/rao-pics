import * as fs from "fs";

import { prisma, type Library, type Prisma } from "@acme/db";

import { type EagleEmit } from ".";
import { SUPPORT_EXT, type Metadata } from "./types";

export const handleImage = async (images: string[], library: Library, emit?: EagleEmit) => {
  for (const [index, image] of images.entries()) {
    const metadata = JSON.parse(fs.readFileSync(image, "utf-8")) as Metadata;
    await transformImage(metadata, library);

    emit &&
      emit({
        type: "image",
        current: index + 1,
        count: images.length,
      });
  }

  // 清除已经删除，sqlite中还存在的图片。
  await prisma.image.deleteMany({
    where: {
      AND: [
        {
          id: {
            notIn: images.map((image) => {
              const info = image.match(/(\d|[a-zA-Z])+\.info/g);
              return info?.[0].replace(".info", "") || "";
            }),
          },
        },
        { libraryId: library.id },
      ],
    },
  });
};

export const transformImage = async (metadata: Metadata, library: Library) => {
  if (!SUPPORT_EXT.includes(metadata.ext)) return null;

  const imageInput: Prisma.ImageCreateInput = {
    ...metadata,
    tags: JSON.stringify(metadata.tags),
    palettes: JSON.stringify(metadata.palettes),
    library: { connect: { id: library.id } },
    btime: new Date(metadata.btime),
    mtime: new Date(metadata.mtime),
    modificationTime: new Date(metadata.modificationTime),
    lastModified: new Date(metadata.lastModified),
    deletedTime: metadata.deletedTime ? new Date(metadata.deletedTime) : undefined,
    folders: { connect: metadata.folders?.map((id) => ({ id })) },
  };

  const res = await prisma.image.upsert({
    where: { id: metadata.id },
    update: imageInput,
    create: imageInput,
  });

  return res;
};
