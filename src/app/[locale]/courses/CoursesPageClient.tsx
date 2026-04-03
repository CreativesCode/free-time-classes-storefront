"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  getCourseCoverPublicUrl,
  getPublicUrl,
} from "@/lib/supabase/storage";
import type { CourseFilters } from "@/lib/supabase/queries/courses";
import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import { getAvatarColor } from "@/lib/utils";
import { useTranslations, useLocale } from "@/i18n/translations";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CourseLevel = NonNullable<CourseFilters["level"]>;

const SCROLL_CHIPS =
  "flex min-w-0 w-full gap-1.5 md:gap-2 overflow-x-auto overscroll-x-contain py-0.5 ps-2.5 pe-2.5 scroll-pl-2.5 scroll-pr-2.5 md:pb-1 md:[scrollbar-width:thin] max-md:[scrollbar-width:none] max-md:[-ms-overflow-style:none] max-md:[&::-webkit-scrollbar]:hidden";

/** Level + price + rating: one wrapped row, compact */
const WRAP_CHIPS =
  "flex min-w-0 w-full flex-wrap items-center gap-1.5 md:gap-2 py-0.5";

function courseCoverGradient(id: string): string {
  const palettes = [
    "from-primary/90 via-violet-500/75 to-secondary/55",
    "from-secondary/85 via-primary/65 to-tertiary/50",
    "from-tertiary/75 via-primary/70 to-violet-500/55",
    "from-violet-600/85 via-fuchsia-500/65 to-primary/50",
    "from-indigo-600/80 via-primary/68 to-secondary/48",
    "from-fuchsia-600/75 via-secondary/60 to-primary/55",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 100000;
  }
  return palettes[h % palettes.length];
}

interface CoursesPageClientProps {
  initialSubjects: Subject[];
  initialCourses: CourseWithRelations[];
}

export default function CoursesPageClient({
  initialSubjects,
  initialCourses,
}: CoursesPageClientProps) {
  const tCat = useTranslations("coursesCatalog");
  const tAvail = useTranslations("studentProfile.availabilities");
  const locale = useLocale();

  const [subjects] = useState<Subject[]>(initialSubjects);
  const [courses, setCourses] = useState<CourseWithRelations[]>(initialCourses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  type CourseSort = NonNullable<CourseFilters["sort"]>;

  const [queryFilters, setQueryFilters] = useState<{
    search: string;
    subject_id: string;
    level: CourseLevel | "";
    minPrice: string;
    maxPrice: string;
    minDuration: string;
    maxDuration: string;
    sort: CourseSort;
    priceFreeOnly: boolean;
    highRatingOnly: boolean;
  }>({
    search: "",
    subject_id: "",
    level: "",
    minPrice: "",
    maxPrice: "",
    minDuration: "",
    maxDuration: "",
    sort: "created_desc",
    priceFreeOnly: false,
    highRatingOnly: false,
  });

  const [debouncedQueryFilters, setDebouncedQueryFilters] =
    useState(queryFilters);
  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQueryFilters(queryFilters),
      400
    );
    return () => window.clearTimeout(t);
  }, [queryFilters]);

  const [tutorSearch, setTutorSearch] = useState("");
  const [debouncedTutorSearch, setDebouncedTutorSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedTutorSearch(tutorSearch),
      300
    );
    return () => window.clearTimeout(t);
  }, [tutorSearch]);

  useEffect(() => {
    async function loadCourses() {
      const hasServerFilters =
        !!debouncedQueryFilters.subject_id ||
        !!debouncedQueryFilters.level ||
        !!debouncedQueryFilters.search.trim() ||
        !!debouncedQueryFilters.minPrice.trim() ||
        !!debouncedQueryFilters.maxPrice.trim() ||
        !!debouncedQueryFilters.minDuration.trim() ||
        !!debouncedQueryFilters.maxDuration.trim() ||
        debouncedQueryFilters.priceFreeOnly ||
        debouncedQueryFilters.highRatingOnly ||
        debouncedQueryFilters.sort !== "created_desc" ||
        debouncedTutorSearch.trim().length > 0;

      if (!hasServerFilters) {
        setCourses(initialCourses);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const courseFilters: CourseFilters = {
          is_active: true,
        };

        if (debouncedQueryFilters.subject_id) {
          courseFilters.subject_id = parseInt(
            debouncedQueryFilters.subject_id,
            10
          );
        }

        if (debouncedQueryFilters.level) {
          courseFilters.level =
            debouncedQueryFilters.level as CourseFilters["level"];
        }

        if (debouncedQueryFilters.search.trim()) {
          courseFilters.search = debouncedQueryFilters.search.trim();
        }

        if (debouncedQueryFilters.priceFreeOnly) {
          courseFilters.min_price_per_session = 0;
          courseFilters.max_price_per_session = 0;
        } else {
          const minPriceNum =
            debouncedQueryFilters.minPrice.trim() === ""
              ? undefined
              : Number(debouncedQueryFilters.minPrice);
          if (minPriceNum !== undefined && !Number.isNaN(minPriceNum)) {
            courseFilters.min_price_per_session = minPriceNum;
          }

          const maxPriceNum =
            debouncedQueryFilters.maxPrice.trim() === ""
              ? undefined
              : Number(debouncedQueryFilters.maxPrice);
          if (maxPriceNum !== undefined && !Number.isNaN(maxPriceNum)) {
            courseFilters.max_price_per_session = maxPriceNum;
          }
        }

        const minDurationNum =
          debouncedQueryFilters.minDuration.trim() === ""
            ? undefined
            : Number(debouncedQueryFilters.minDuration);
        if (minDurationNum !== undefined && !Number.isNaN(minDurationNum)) {
          courseFilters.min_duration_minutes = minDurationNum;
        }

        const maxDurationNum =
          debouncedQueryFilters.maxDuration.trim() === ""
            ? undefined
            : Number(debouncedQueryFilters.maxDuration);
        if (maxDurationNum !== undefined && !Number.isNaN(maxDurationNum)) {
          courseFilters.max_duration_minutes = maxDurationNum;
        }

        if (debouncedQueryFilters.highRatingOnly) {
          courseFilters.min_rating = 4.5;
        }

        courseFilters.sort = debouncedQueryFilters.sort;

        async function loadViaCatalog(filters: CourseFilters) {
          const res = await fetch("/api/catalog/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filters }),
          });
          if (!res.ok) {
            const errBody = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(errBody?.error ?? res.statusText);
          }
          return (await res.json()) as CourseWithRelations[];
        }

        let data = await loadViaCatalog(courseFilters);

        if (data.length === 0) {
          const relaxedFilters: CourseFilters = { ...courseFilters };
          delete relaxedFilters.is_active;
          data = await loadViaCatalog(relaxedFilters);
        }

        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    void loadCourses();
  }, [debouncedQueryFilters, debouncedTutorSearch, initialCourses]);

  const displayedCourses = useMemo(() => {
    const needle = debouncedTutorSearch.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) =>
      (course.tutor?.username ?? "").toLowerCase().includes(needle)
    );
  }, [courses, debouncedTutorSearch]);

  const levelLabel = useMemo(() => {
    return (level: CourseWithRelations["level"] | null | undefined) => {
      if (level === "advanced") return tCat("levelAdvanced");
      if (level === "intermediate") return tCat("levelIntermediate");
      if (level === "beginner") return tCat("levelBeginner");
      return level ?? "";
    };
  }, [tCat]);

  const sortOptions = useMemo(
    () =>
      (
        [
          ["created_desc", tAvail("sortNewest")],
          ["price_asc", tAvail("sortPriceAsc")],
          ["price_desc", tAvail("sortPriceDesc")],
          ["duration_asc", tAvail("sortDurationAsc")],
          ["duration_desc", tAvail("sortDurationDesc")],
        ] as const
      ).map(([value, label]) => ({ value, label })),
    [tAvail]
  );

  const currentSortLabel = useMemo(() => {
    return (
      sortOptions.find((o) => o.value === queryFilters.sort)?.label ??
      sortOptions[0]?.label ??
      ""
    );
  }, [sortOptions, queryFilters.sort]);

  function resetFilters() {
    setQueryFilters({
      search: "",
      subject_id: "",
      level: "",
      minPrice: "",
      maxPrice: "",
      minDuration: "",
      maxDuration: "",
      sort: "created_desc",
      priceFreeOnly: false,
      highRatingOnly: false,
    });
    setTutorSearch("");
  }

  function chipBase(active: boolean) {
    return [
      "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all md:px-3.5 md:py-1.5",
      active
        ? "bg-primary text-on-primary shadow-md shadow-primary/15"
        : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest dark:bg-surface-container-high/80",
    ].join(" ");
  }

  return (
    <div className="min-h-screen bg-surface pb-28 text-on-background selection:bg-primary-container selection:text-on-primary-container dark:bg-background md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-8 md:pt-10 lg:pt-12">
          <h1 className="font-extrabold tracking-tight text-on-background">
            <span className="block text-lumina-h1 md:hidden">
              {tCat("heroMobileTitle")}
            </span>
            <span className="hidden text-4xl md:block md:max-lg:text-5xl lg:hidden">
              {tCat("heroTabletTitle")}
            </span>
            <span className="hidden lg:block lg:text-5xl">
              {tCat("heroDesktopTitle")}
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-lumina-body-lg text-on-surface-variant md:max-lg:max-w-xl lg:text-lg">
            <span className="md:hidden">{tCat("heroMobileSubtitle")}</span>
            <span className="hidden md:max-lg:block">{tCat("heroTabletSubtitle")}</span>
            <span className="hidden lg:block">{tCat("heroDesktopSubtitle")}</span>
          </p>
        </header>

        <div className="sticky top-16 z-30 -mx-4 min-w-0 border-b border-outline-variant/15 bg-surface/85 px-4 py-3 backdrop-blur-md dark:bg-background/80 sm:-mx-6 sm:px-6 lg:top-20 lg:-mx-8 lg:px-8">
          <div className="flex min-w-0 flex-col gap-2 md:gap-2.5">
            <div className="relative w-full max-w-3xl">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <Input
                className="h-12 rounded-md border-0 bg-surface-container-lowest py-3 pl-12 pr-4 text-on-surface shadow-lumina-xs ring-1 ring-outline-variant/20 placeholder:text-on-surface-variant/60 focus-visible:ring-2 focus-visible:ring-primary/40 md:h-14 max-md:rounded-2xl max-md:py-5"
                placeholder={tCat("searchPlaceholder")}
                value={queryFilters.search}
                onChange={(e) =>
                  setQueryFilters((p) => ({ ...p, search: e.target.value }))
                }
              />
            </div>

            <div className={SCROLL_CHIPS}>
              <button
                type="button"
                className={chipBase(queryFilters.subject_id === "")}
                onClick={() =>
                  setQueryFilters((p) => ({ ...p, subject_id: "" }))
                }
              >
                <Sparkles className="h-3.5 w-3.5 opacity-90" aria-hidden />
                {tCat("chipAllSubjects")}
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={chipBase(
                    queryFilters.subject_id === String(s.id)
                  )}
                  onClick={() =>
                    setQueryFilters((p) => ({
                      ...p,
                      subject_id: String(s.id),
                    }))
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className={WRAP_CHIPS}>
              <span className="self-center pr-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant max-md:hidden md:text-[11px]">
                {tCat("filterLevel")}
              </span>
              <button
                type="button"
                className={chipBase(queryFilters.level === "")}
                onClick={() => setQueryFilters((p) => ({ ...p, level: "" }))}
              >
                {tCat("chipLevelAny")}
              </button>
              {(["beginner", "intermediate", "advanced"] as const).map(
                (lev) => (
                  <button
                    key={lev}
                    type="button"
                    className={chipBase(queryFilters.level === lev)}
                    onClick={() =>
                      setQueryFilters((p) => ({ ...p, level: lev }))
                    }
                  >
                    {levelLabel(lev)}
                  </button>
                )
              )}
              <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-outline-variant/40 md:block" />
              <span className="self-center pr-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant max-md:hidden md:text-[11px]">
                {tCat("filterPrice")}
              </span>
              <button
                type="button"
                className={chipBase(!queryFilters.priceFreeOnly)}
                onClick={() =>
                  setQueryFilters((p) => ({ ...p, priceFreeOnly: false }))
                }
              >
                {tCat("chipPriceAny")}
              </button>
              <button
                type="button"
                className={chipBase(queryFilters.priceFreeOnly)}
                onClick={() =>
                  setQueryFilters((p) => ({ ...p, priceFreeOnly: true }))
                }
              >
                {tCat("chipPriceFree")}
              </button>
              <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-outline-variant/40 md:block" />
              <span className="self-center pr-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant max-md:hidden md:text-[11px]">
                {tCat("filterRating")}
              </span>
              <button
                type="button"
                className={chipBase(!queryFilters.highRatingOnly)}
                onClick={() =>
                  setQueryFilters((p) => ({ ...p, highRatingOnly: false }))
                }
              >
                {tCat("chipRatingAny")}
              </button>
              <button
                type="button"
                className={chipBase(queryFilters.highRatingOnly)}
                onClick={() =>
                  setQueryFilters((p) => ({ ...p, highRatingOnly: true }))
                }
              >
                {tCat("chipRating45")}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-outline-variant/40 bg-surface-container-lowest/80"
                onClick={() => setShowAdvanced((s) => !s)}
              >
                <Filter className="mr-2 h-4 w-4" aria-hidden />
                {showAdvanced
                  ? tCat("advancedFiltersHide")
                  : tCat("advancedFilters")}
                {showAdvanced ? (
                  <ChevronUp className="ml-2 h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" aria-hidden />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-on-surface-variant hover:text-primary"
                onClick={resetFilters}
              >
                {tCat("clearAll")}
              </Button>
            </div>

            {showAdvanced ? (
              <div className="grid grid-cols-1 gap-4 rounded border border-outline-variant/20 bg-surface-container-lowest/60 p-4 dark:bg-surface-container-lowest/20 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-lumina-body-sm font-medium text-on-surface-variant">
                    {tAvail("tutorNamePlaceholder")}
                  </label>
                  <Input
                    value={tutorSearch}
                    onChange={(e) => setTutorSearch(e.target.value)}
                    className="rounded-md border-outline-variant/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lumina-body-sm font-medium text-on-surface-variant">
                    {tAvail("priceMinPlaceholder")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    disabled={queryFilters.priceFreeOnly}
                    value={queryFilters.minPrice}
                    onChange={(e) =>
                      setQueryFilters((p) => ({
                        ...p,
                        minPrice: e.target.value,
                      }))
                    }
                    className="rounded-md border-outline-variant/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lumina-body-sm font-medium text-on-surface-variant">
                    {tAvail("priceMaxPlaceholder")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    disabled={queryFilters.priceFreeOnly}
                    value={queryFilters.maxPrice}
                    onChange={(e) =>
                      setQueryFilters((p) => ({
                        ...p,
                        maxPrice: e.target.value,
                      }))
                    }
                    className="rounded-md border-outline-variant/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lumina-body-sm font-medium text-on-surface-variant">
                    {tAvail("durationMinPlaceholder")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={queryFilters.minDuration}
                    onChange={(e) =>
                      setQueryFilters((p) => ({
                        ...p,
                        minDuration: e.target.value,
                      }))
                    }
                    className="rounded-md border-outline-variant/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lumina-body-sm font-medium text-on-surface-variant">
                    {tAvail("durationMaxPlaceholder")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={queryFilters.maxDuration}
                    onChange={(e) =>
                      setQueryFilters((p) => ({
                        ...p,
                        maxDuration: e.target.value,
                      }))
                    }
                    className="rounded-md border-outline-variant/30"
                  />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-2">
                  <label className="text-lumina-body-sm font-medium text-on-surface-variant">
                    {tCat("sortLabel")}
                  </label>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        aria-haspopup="menu"
                        className="h-10 w-full justify-between rounded-lg border-outline-variant/30 bg-surface-container-lowest px-3 text-left text-sm font-normal text-on-surface shadow-sm hover:bg-surface-container-high dark:bg-surface-container-lowest dark:hover:bg-surface-container-high/80"
                      >
                        <span className="truncate">{currentSortLabel}</span>
                        <ChevronDown
                          className="h-4 w-4 shrink-0 opacity-70"
                          aria-hidden
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      sideOffset={6}
                      className="z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-lg border border-outline-variant/25 bg-surface-container-lowest p-0 text-on-surface shadow-lg dark:border-outline-variant/30 dark:bg-surface-container-high"
                    >
                      <div className="max-h-72 overflow-y-auto">
                        <DropdownMenuRadioGroup
                          value={queryFilters.sort}
                          onValueChange={(v) =>
                            setQueryFilters((p) => ({
                              ...p,
                              sort: v as CourseSort,
                            }))
                          }
                        >
                          {sortOptions.map(({ value, label }) => (
                            <DropdownMenuRadioItem
                              key={value}
                              value={value}
                              className="cursor-pointer rounded-none py-2 pl-8 pr-3 text-sm text-on-surface focus:bg-primary/10 focus:text-on-surface data-[state=checked]:bg-primary/15 data-[state=checked]:font-semibold"
                            >
                              {label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div
                className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent"
                role="status"
                aria-label={tAvail("loadingResults")}
              />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/30 bg-error-container/10 px-6 py-10 text-center text-error">
              {error}
            </div>
          ) : (
            <>
              <p className="text-lumina-body text-on-surface-variant">
                {tCat("resultsLabel", {
                  count: displayedCourses.length,
                })}
              </p>

              {displayedCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/50 px-6 py-16 text-center dark:bg-surface-container-lowest/10">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-primary">
                    <Search className="h-8 w-8" aria-hidden />
                  </div>
                  <h2 className="text-lumina-h3 font-bold text-on-surface">
                    {tCat("emptyTitle")}
                  </h2>
                  <p className="mt-2 max-w-md text-lumina-body text-on-surface-variant">
                    {tCat("emptyDescription")}
                  </p>
                  <Button className="mt-6 rounded-full" onClick={resetFilters}>
                    {tCat("clearAll")}
                  </Button>
                </div>
              ) : (
                <section className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                  {displayedCourses.map((course) => {
                    const tutor = course.tutor;
                    const rawProfilePicture = tutor?.profile_picture;
                    const profilePicture =
                      rawProfilePicture && typeof rawProfilePicture === "string"
                        ? rawProfilePicture.startsWith("http")
                          ? rawProfilePicture
                          : getPublicUrl("avatars", rawProfilePicture)
                        : null;
                    const firstChar =
                      tutor?.username?.[0]?.toUpperCase() ?? "U";
                    const rating = course.rating ?? 0;
                    const reviews = course.total_reviews ?? 0;
                    const bestseller = rating >= 4.5 && reviews >= 3;
                    const popular = rating >= 4 && !bestseller;
                    const grad = courseCoverGradient(course.id);
                    const coverUrl = getCourseCoverPublicUrl(course.cover_image);
                    const href = `/${locale}/courses/${course.id}`;
                    const bookHref = `${href}?book=1`;

                    return (
                      <article
                        key={course.id}
                        className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-lumina-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lumina-lg max-md:active:scale-[0.98] md:max-lg:hover:scale-[1.02] md:max-lg:hover:translate-y-0"
                      >
                        <Link href={href} className="flex min-h-0 flex-1 flex-col">
                          <div
                            className={`relative h-56 overflow-hidden md:h-72 lg:h-56 ${
                              coverUrl ? "" : `bg-gradient-to-br ${grad}`
                            }`}
                          >
                            {coverUrl ? (
                              <>
                                <Image
                                  src={coverUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div
                                  className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
                                  aria-hidden
                                />
                              </>
                            ) : (
                            <div
                              className="absolute inset-0 opacity-40 mix-blend-overlay"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                              }}
                            />
                            )}
                            {bestseller ? (
                              <span className="absolute bottom-4 left-4 rounded-md bg-tertiary-container px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-on-tertiary-container shadow-md lg:bottom-auto lg:left-4 lg:top-4 lg:rounded-full lg:text-xs">
                                {tCat("bestseller")}
                              </span>
                            ) : null}
                            {popular && !bestseller ? (
                              <span className="absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-on-background shadow-sm backdrop-blur-md lg:bottom-auto lg:left-4 lg:top-4 lg:rounded-full lg:text-xs dark:bg-zinc-900/80 dark:text-white">
                                {tCat("popular")}
                              </span>
                            ) : null}
                            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1 shadow-sm backdrop-blur-md dark:bg-zinc-900/85 lg:hidden">
                              <Star
                                className="h-3.5 w-3.5 fill-amber-500 text-amber-500"
                                aria-hidden
                              />
                              <span className="text-xs font-bold text-on-background dark:text-white">
                                {rating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-6 md:max-lg:p-8">
                            <div className="mb-3 hidden items-start justify-between gap-3 lg:flex">
                              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                {(course.subject?.name ?? "—").slice(0, 32)}
                              </span>
                              <div className="flex items-center gap-1 font-bold text-secondary">
                                <Star
                                  className="h-4 w-4 fill-secondary text-secondary"
                                  aria-hidden
                                />
                                <span className="text-sm">
                                  {rating.toFixed(1)}
                                </span>
                              </div>
                            </div>

                            <div className="mb-2 flex items-start justify-between gap-3 lg:mb-3">
                              <h2 className="text-xl font-bold leading-tight text-on-surface md:max-lg:text-2xl">
                                {course.title}
                              </h2>
                              <span className="shrink-0 text-lg font-extrabold text-primary md:max-lg:text-xl">
                                ${Number(course.price_per_session).toFixed(0)}
                              </span>
                            </div>

                            <div className="mb-3 flex min-w-0 items-center gap-2.5 lg:mb-4">
                              <Avatar className="h-8 w-8 shrink-0 border border-primary/20 md:max-lg:h-9 md:max-lg:w-9">
                                {profilePicture ? (
                                  <AvatarImage
                                    src={profilePicture}
                                    alt={tutor?.username ?? "Tutor"}
                                  />
                                ) : null}
                                <AvatarFallback
                                  className="text-xs text-white"
                                  style={{
                                    backgroundColor: getAvatarColor(
                                      tutor?.username ?? ""
                                    ),
                                  }}
                                >
                                  {firstChar}
                                </AvatarFallback>
                              </Avatar>
                              <span className="min-w-0 truncate text-sm font-semibold text-on-surface">
                                {tutor?.username ?? "—"}
                              </span>
                            </div>

                            <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-on-surface-variant md:max-lg:mb-4 md:max-lg:text-base">
                              {course.description}
                            </p>
                            <p className="-mt-2 mb-6 hidden text-sm font-semibold text-on-surface-variant md:max-lg:block lg:hidden">
                              {course.duration_minutes ?? 0} {tAvail("minutes")}
                            </p>

                            <div className="mt-auto flex w-full items-center justify-end gap-2">
                              <span className="mr-auto text-[10px] font-bold text-on-surface-variant md:hidden">
                                {course.duration_minutes ?? 0}{" "}
                                {tAvail("minutes")}
                              </span>
                              <span className="hidden shrink-0 text-xs font-medium text-on-surface-variant lg:inline-flex">
                                {levelLabel(course.level)}
                              </span>
                            </div>
                          </div>
                        </Link>

                        <div className="flex flex-col px-6 pb-6 pt-0 md:max-lg:px-8 md:max-lg:pb-8">
                          <Link
                            href={bookHref}
                            className="mt-4 hidden md:max-lg:block"
                          >
                            <span className="inline-flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20">
                              {tCat("enrollNow")}
                            </span>
                          </Link>

                          <div className="mt-4 hidden items-center justify-between border-t border-outline-variant/10 pt-4 lg:flex">
                            <span className="text-lumina-body-sm text-on-surface-variant">
                              {tCat("maxStudents", {
                                count: course.max_students,
                              })}
                            </span>
                            <Link
                              href={bookHref}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-md transition-transform group-hover:scale-110"
                            >
                              <Plus className="h-5 w-5" aria-hidden />
                              <span className="sr-only">
                                {tCat("goBookCourse")}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </>
          )}
        </div>

        {!loading && !error && displayedCourses.length > 0 ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/25 bg-surface/90 px-4 pb-4 pt-3 backdrop-blur md:hidden">
            <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Cursos
                </p>
                <p className="text-lg font-black text-on-surface">{displayedCourses.length}</p>
              </div>
              <Button
                size="sm"
                className="rounded-full px-5"
                onClick={() => setShowAdvanced((s) => !s)}
              >
                <Filter className="mr-2 h-4 w-4" aria-hidden />
                {tCat("advancedFilters")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
