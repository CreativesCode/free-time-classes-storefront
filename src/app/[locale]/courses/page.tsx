"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  getCoursesWithRelations,
  type CourseFilters,
} from "@/lib/supabase/queries/courses";
import { getSubjects } from "@/lib/supabase/queries/subjects";
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
import Link from "next/link";

type CourseLevel = NonNullable<CourseFilters["level"]>;

const SCROLL_CHIPS =
  "flex gap-2 md:gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

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

export default function CoursesPage() {
  const tCat = useTranslations("coursesCatalog");
  const tAvail = useTranslations("studentProfile.availabilities");
  const locale = useLocale();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
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
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }
    void loadSubjects();
  }, []);

  useEffect(() => {
    async function loadCourses() {
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

        const data = await getCoursesWithRelations(courseFilters);
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    void loadCourses();
  }, [debouncedQueryFilters]);

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
      "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all md:px-5 md:py-2.5",
      active
        ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]"
        : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest dark:bg-surface-container-high/80",
    ].join(" ");
  }

  return (
    <div className="min-h-screen bg-surface pb-28 text-on-background selection:bg-primary-container selection:text-on-primary-container dark:bg-background md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero — mobile / tablet / desktop copy */}
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

        {/* Sticky filter shell — alineado con Stitch (search + chips) */}
        <div className="sticky top-16 z-30 -mx-4 border-b border-outline-variant/15 bg-surface/85 px-4 py-4 backdrop-blur-md dark:bg-background/80 sm:-mx-6 sm:px-6 lg:top-20 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-4 md:gap-5">
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
                <Sparkles className="h-4 w-4 opacity-90" aria-hidden />
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

            <div className={SCROLL_CHIPS}>
              <span className="self-center pr-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant max-md:hidden">
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
              <span className="mx-1 hidden h-6 w-px shrink-0 bg-outline-variant/40 md:block" />
              <span className="self-center pr-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant max-md:hidden">
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
              <span className="mx-1 hidden h-6 w-px shrink-0 bg-outline-variant/40 md:block" />
              <span className="self-center pr-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant max-md:hidden">
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
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/60 p-4 dark:bg-surface-container-lowest/20 md:grid-cols-2 lg:grid-cols-4">
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
                  <select
                    value={queryFilters.sort}
                    onChange={(e) =>
                      setQueryFilters((p) => ({
                        ...p,
                        sort: e.target.value as CourseSort,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="created_desc">{tAvail("sortNewest")}</option>
                    <option value="price_asc">{tAvail("sortPriceAsc")}</option>
                    <option value="price_desc">{tAvail("sortPriceDesc")}</option>
                    <option value="duration_asc">
                      {tAvail("sortDurationAsc")}
                    </option>
                    <option value="duration_desc">
                      {tAvail("sortDurationDesc")}
                    </option>
                  </select>
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
                    const href = `/${locale}/courses/${course.id}`;

                    return (
                      <article
                        key={course.id}
                        className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-lumina-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lumina-lg max-md:active:scale-[0.98] md:max-lg:hover:scale-[1.02] md:max-lg:hover:translate-y-0"
                      >
                        <Link href={href} className="flex flex-1 flex-col">
                          <div
                            className={`relative h-56 overflow-hidden md:h-72 lg:h-56 bg-gradient-to-br ${grad}`}
                          >
                            <div
                              className="absolute inset-0 opacity-40 mix-blend-overlay"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                              }}
                            />
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

                            <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-on-surface-variant md:max-lg:mb-4 md:max-lg:text-base">
                              {course.description}
                            </p>
                            <p className="-mt-2 mb-6 hidden text-sm font-semibold text-on-surface-variant md:max-lg:block lg:hidden">
                              {course.duration_minutes ?? 0} {tAvail("minutes")}
                            </p>

                            <div className="mt-auto flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
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
                                <span className="truncate text-xs font-semibold text-on-surface-variant md:max-lg:text-sm md:max-lg:text-on-background">
                                  {tutor?.username ?? "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-on-surface-variant md:hidden">
                                <span className="text-[10px] font-bold">
                                  {course.duration_minutes ?? 0}{" "}
                                  {tAvail("minutes")}
                                </span>
                              </div>
                              <span className="hidden text-xs text-on-surface-variant lg:inline">
                                {levelLabel(course.level)}
                              </span>
                            </div>

                            <div className="mt-4 hidden md:max-lg:block">
                              <span className="inline-flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20">
                                {tCat("enrollNow")}
                              </span>
                            </div>

                            <div className="mt-4 hidden items-center justify-between border-t border-outline-variant/10 pt-4 lg:flex">
                              <span className="text-lumina-body-sm text-on-surface-variant">
                                {tCat("maxStudents", {
                                  count: course.max_students,
                                })}
                              </span>
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-on-primary shadow-md transition-transform group-hover:scale-110">
                                <Plus className="h-5 w-5" aria-hidden />
                                <span className="sr-only">{tCat("viewCourse")}</span>
                              </span>
                            </div>
                          </div>
                        </Link>
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
