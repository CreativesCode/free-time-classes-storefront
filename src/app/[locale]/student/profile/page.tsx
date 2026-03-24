import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StudentProfileLegacyRedirect({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const q = await searchParams;
  const tab = typeof q.tab === "string" ? q.tab : undefined;
  const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : "";
  redirect(`/${locale}/student-profile${suffix}`);
}
