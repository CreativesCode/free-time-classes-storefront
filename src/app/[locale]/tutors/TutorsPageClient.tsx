"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { useLocale, useTranslations } from "@/i18n/translations";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import type { Subject } from "@/types/subject";
import {
  BookOpen,
  ChevronDown,
  Clock,
  Filter,
  MapPin,
  Search,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

interface TutorUser {
  id: string;
  username: string;
  email: string;
  profile_picture: string | null;
  country: string | null;
}

interface TutorProfile {
  id: string;
  bio: string | null;
  experience_years: number | null;
  hourly_rate: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_active: boolean;
  user: TutorUser | null;
}

export interface EnrichedTutor extends TutorProfile {
  subjects: { id: number; name: string }[];
  coursesCount: number;
  /** Menor `price_per_session` entre cursos activos (para filtro si no hay `hourly_rate`). */
  min_course_price: number | null;
}

/** Valor numérico para filtrar/ordenar: tarifa hora del perfil, o si no, curso más barato (por sesión). */
function tutorListingPrice(tutor: EnrichedTutor): number | null {
  if (tutor.hourly_rate != null) return tutor.hourly_rate;
  return tutor.min_course_price ?? null;
}

type SortOption =
  | "relevance"
  | "rating_desc"
  | "price_asc"
  | "price_desc"
  | "experience_desc";

interface TutorsPageClientProps {
  initialTutors: EnrichedTutor[];
  initialSubjects: Subject[];
}

function resolveAvatarUrl(pic: string | null | undefined): string | null {
  if (pic == null || typeof pic !== "string") return null;
  const trimmed = pic.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return getPublicUrl("avatars", trimmed);
}

function TutorListAvatar({
  pic,
  displayName,
}: {
  pic: string | null | undefined;
  displayName: string;
}) {
  const [hideImage, setHideImage] = useState(false);
  const url = useMemo(() => resolveAvatarUrl(pic), [pic]);
  const initials = (displayName.trim()[0] ?? "T").toUpperCase();
  const remote = url != null && (url.startsWith("http://") || url.startsWith("https://"));

  return (
    <Avatar className="h-16 w-16 shrink-0 rounded-2xl ring-4 ring-white md:h-20 md:w-20">
      {url && !hideImage ? (
        <AvatarImage
          src={url}
          alt={displayName}
          referrerPolicy={remote ? "no-referrer" : undefined}
          onLoadingStatusChange={(status) => {
            if (status === "error") setHideImage(true);
          }}
        />
      ) : null}
      <AvatarFallback
        className="rounded-2xl text-lg font-semibold text-white"
        style={{ backgroundColor: getAvatarColor(displayName) }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export default function TutorsPageClient({
  initialTutors,
  initialSubjects,
}: TutorsPageClientProps) {
  const t = useTranslations("tutorsPage");
  const locale = useLocale();

  const [tutors] = useState<EnrichedTutor[]>(initialTutors);
  const [subjects] = useState<Subject[]>(initialSubjects);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tutorsSelectContent =
    "border-violet-200/80 bg-white text-slate-800 dark:border-violet-200/40 dark:bg-slate-950";
  const tutorsSelectItem =
    "focus:bg-violet-100/70 data-[state=checked]:bg-violet-100 data-[state=checked]:text-violet-950 dark:focus:bg-violet-900/30 dark:data-[state=checked]:bg-violet-900/40 dark:data-[state=checked]:text-violet-50";
  const tutorsFilterTrigger =
    "h-[42px] rounded-lg border-violet-100 bg-white text-slate-700 shadow-none hover:bg-violet-50/90 focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-violet-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-violet-950/50";

  const sortMenuOptions = useMemo(
    () => [
      { value: "relevance", label: t("sortRelevance") },
      { value: "rating_desc", label: t("sortRatingDesc") },
      { value: "price_asc", label: t("sortPriceAsc") },
      { value: "price_desc", label: t("sortPriceDesc") },
      { value: "experience_desc", label: t("sortExperienceDesc") },
    ],
    [t]
  );

  const subjectFilterOptions = useMemo(
    () => [
      { value: "", label: t("allSubjects") },
      ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [subjects, t]
  );

  const ratingFilterOptions = useMemo(
    () => [
      { value: "", label: t("anyRating") },
      { value: "4.5", label: `4.5+ ${t("stars")}` },
      { value: "4", label: `4+ ${t("stars")}` },
      { value: "3.5", label: `3.5+ ${t("stars")}` },
      { value: "3", label: `3+ ${t("stars")}` },
    ],
    [t]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const hasActiveFilters = selectedSubject || minRating || minPrice || maxPrice;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubject("");
    setMinRating("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("relevance");
  };

  const filteredTutors = useMemo(() => {
    let result = [...tutors];

    if (debouncedSearch.trim()) {
      const needle = debouncedSearch.toLowerCase();
      result = result.filter((tutor) => {
        const name = (tutor.user?.username ?? "").toLowerCase();
        const subjectNames = tutor.subjects.map((s) => s.name.toLowerCase()).join(" ");
        return name.includes(needle) || subjectNames.includes(needle);
      });
    }

    if (selectedSubject) {
      const subjectId = parseInt(selectedSubject, 10);
      result = result.filter((tutor) => tutor.subjects.some((s) => s.id === subjectId));
    }

    if (minRating) {
      const ratingThreshold = parseFloat(minRating);
      result = result.filter((tutor) => (tutor.rating ?? 0) >= ratingThreshold);
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!Number.isNaN(min)) {
        result = result.filter((tutor) => {
          const p = tutorListingPrice(tutor);
          return p != null && p >= min;
        });
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(max)) {
        result = result.filter((tutor) => {
          const p = tutorListingPrice(tutor);
          return p != null && p <= max;
        });
      }
    }

    const comparePriceAsc = (a: EnrichedTutor, b: EnrichedTutor) => {
      const pa = tutorListingPrice(a);
      const pb = tutorListingPrice(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    };

    switch (sortBy) {
      case "rating_desc":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "price_asc":
        result.sort(comparePriceAsc);
        break;
      case "price_desc":
        result.sort((a, b) => comparePriceAsc(b, a));
        break;
      case "experience_desc":
        result.sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0));
        break;
    }

    return result;
  }, [tutors, debouncedSearch, selectedSubject, minRating, minPrice, maxPrice, sortBy]);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25;
    const stars: ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />);
      } else if (i === full && hasHalf) {
        stars.push(
          <span key={i} className="relative inline-block h-4 w-4">
            <Star className="absolute h-4 w-4 text-gray-300" />
            <span className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </span>
          </span>
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#fdf7ff]">
      <section className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-700 via-violet-700 to-fuchsia-600 text-white">
        <div className="pointer-events-none absolute -left-28 top-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-violet-100 sm:text-base md:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl md:mt-10">
            <div className="relative rounded-full border border-white/20 bg-white/95 shadow-[0_25px_80px_-25px_rgba(76,29,149,0.8)]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-12 rounded-full border-0 bg-transparent pl-12 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 md:h-14 md:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="rounded-3xl border border-violet-100/80 bg-white/90 p-4 shadow-[0_20px_50px_-35px_rgba(112,42,225,0.6)] backdrop-blur md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="h-10 gap-2 rounded-full border-violet-200 bg-violet-50/70 px-4 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
              >
                <Filter className="h-4 w-4" />
                {t("filters")}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                />
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 rounded-full px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  {t("clearFilters")}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-500">{t("sortBy")}:</span>
              <SelectMenu
                fullWidth={false}
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
                options={sortMenuOptions}
                aria-label={t("sortBy")}
                triggerClassName="h-10 max-w-[min(100vw-8rem,16rem)] rounded-full border-violet-200 bg-white px-4 text-slate-700 shadow-none hover:bg-violet-50/80 focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-violet-700 dark:bg-slate-950 dark:text-slate-100"
                contentClassName={tutorsSelectContent}
                radioItemClassName={tutorsSelectItem}
              />
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${filtersOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <Card className="rounded-3xl border-violet-100/80 bg-white/95">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700" htmlFor="tutors-filter-subject">
                    {t("subject")}
                  </label>
                  <SelectMenu
                    id="tutors-filter-subject"
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    options={subjectFilterOptions}
                    aria-label={t("subject")}
                    triggerClassName={tutorsFilterTrigger}
                    contentClassName={tutorsSelectContent}
                    radioItemClassName={tutorsSelectItem}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700" htmlFor="tutors-filter-rating">
                    {t("minRating")}
                  </label>
                  <SelectMenu
                    id="tutors-filter-rating"
                    value={minRating}
                    onValueChange={setMinRating}
                    options={ratingFilterOptions}
                    aria-label={t("minRating")}
                    triggerClassName={tutorsFilterTrigger}
                    contentClassName={tutorsSelectContent}
                    radioItemClassName={tutorsSelectItem}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t("priceRange")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={t("minPrice")}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={t("maxPrice")}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{t("priceFilterHint")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!loading && !error && (
          <p className="text-sm text-slate-500">
            {t("resultsCount", { count: filteredTutors.length })}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />
            <p className="text-gray-500 text-sm">{t("loading")}</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12 text-center">
              <p className="text-red-600 font-medium">{t("loadError")}</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
            </CardContent>
          </Card>
        ) : filteredTutors.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">{t("noResults")}</p>
              <p className="text-gray-400 text-sm mt-1">{t("noResultsHint")}</p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-6" onClick={clearFilters}>
                  {t("clearFilters")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {filteredTutors.map((tutor) => {
              const user = tutor.user;
              const displayName = user?.username ?? "—";
              const rating = tutor.rating ?? 0;
              const showExperience =
                tutor.experience_years != null && tutor.experience_years > 0;
              const showCourses = tutor.coursesCount > 0;
              const showStatsRow = showExperience || showCourses;

              return (
                <Card
                  key={tutor.id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border-violet-100/80 bg-white shadow-[0_25px_60px_-45px_rgba(88,28,135,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(112,42,225,0.55)]"
                >
                  <div className="h-24 shrink-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 md:h-28" />
                  <CardContent className="-mt-12 flex flex-1 flex-col gap-4 p-4 md:-mt-[3.75rem] md:p-5 lg:-mt-16 lg:p-6">
                    <div className="flex items-start gap-4">
                      <TutorListAvatar pic={user?.profile_picture} displayName={displayName} />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-slate-900 md:text-xl mt-1">
                          {displayName}
                        </h3>
                        <div className="mt-3 flex items-center gap-1.5">
                          <div className="flex items-center">{renderStars(rating)}</div>
                          <span className="text-sm font-semibold text-slate-700">
                            {rating.toFixed(1)}
                          </span>
                          {tutor.total_reviews ? (
                            <span className="text-xs text-slate-400">
                              ({t("reviewsCount", { count: tutor.total_reviews })})
                            </span>
                          ) : null}
                        </div>
                        {user?.country && (
                          <div className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{user.country}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {tutor.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.subjects.slice(0, 3).map((s) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className="rounded-full border-violet-100 bg-violet-50 px-3 py-1 text-xs text-violet-700"
                          >
                            {s.name}
                          </Badge>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <Badge variant="outline" className="rounded-full text-xs text-slate-500">
                            +{tutor.subjects.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {showStatsRow ? (
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-violet-50/70 p-3 text-sm text-slate-700">
                        {showExperience ? (
                          <div
                            className={`flex items-center gap-1 ${showCourses ? "" : "col-span-2"}`}
                          >
                            <Clock className="h-4 w-4 text-violet-500" />
                            <span>{t("yearsExperience", { count: tutor.experience_years! })}</span>
                          </div>
                        ) : null}
                        {showCourses ? (
                          <div
                            className={`flex items-center gap-1 ${showExperience ? "justify-self-end" : "col-span-2"}`}
                          >
                            <BookOpen className="h-4 w-4 text-violet-500" />
                            <span>{t("coursesCount", { count: tutor.coursesCount })}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between border-t border-violet-100 pt-3">
                      {tutor.hourly_rate != null ? (
                        <div>
                          <span className="text-2xl font-extrabold tracking-tight text-violet-700">
                            ${tutor.hourly_rate}
                          </span>
                          <span className="ml-0.5 text-sm text-slate-400">{t("perHour")}</span>
                        </div>
                      ) : tutor.min_course_price != null ? (
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-slate-500">{t("priceFrom")}</span>
                          <div>
                            <span className="text-2xl font-extrabold tracking-tight text-violet-700">
                              ${tutor.min_course_price}
                            </span>
                            <span className="ml-0.5 text-sm text-slate-400">{t("perSession")}</span>
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                      <Link href={`/${locale}/tutors/${tutor.id}`}>
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-full bg-violet-600 px-5 text-white transition-colors hover:bg-violet-700"
                        >
                          {t("viewProfile")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
