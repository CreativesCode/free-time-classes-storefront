import {
  getCoursesWithRelations,
  type CourseFilters,
} from "@/lib/supabase/queries/courses";
import { createCatalogServerClient } from "@/lib/supabase/server-public";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public catalog: courses with tutor/subject embeds using the catalog Supabase
 * client (service role when configured) so nested `users` rows are not stripped by RLS.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const filters = (body as { filters?: CourseFilters }).filters;
  if (!filters || typeof filters !== "object") {
    return NextResponse.json({ error: "Missing filters object" }, { status: 400 });
  }

  try {
    const catalog = createCatalogServerClient();
    const data = await getCoursesWithRelations(filters, catalog);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Catalog query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
