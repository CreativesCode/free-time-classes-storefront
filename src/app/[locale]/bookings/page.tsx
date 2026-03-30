import BookingsClient from "./BookingsClient";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <BookingsClient locale={locale} />;
}
