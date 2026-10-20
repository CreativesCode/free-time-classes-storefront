import { revalidatePath, revalidateTag } from "next/cache";

// Tags used by the unstable_cache wrappers of the catalog pages.
const CATALOG_TAGS = ["courses", "tutors", "subjects", "home"];

// ISR detail pages fetch without tags, so they are revalidated by path.
const CATALOG_DETAIL_PATHS = ["/[locale]/courses/[id]", "/[locale]/tutors/[id]"];

/** Server-side: refresh every cached catalog page after a catalog change. */
export function revalidateCatalog(): void {
  for (const tag of CATALOG_TAGS) revalidateTag(tag);
  for (const path of CATALOG_DETAIL_PATHS) revalidatePath(path, "page");
}
