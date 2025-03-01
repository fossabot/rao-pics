import { type LibraryAdd } from "@acme/api";

export type HandleDirectoryReturn = Required<LibraryAdd & { id: number; count: number }> | null;
