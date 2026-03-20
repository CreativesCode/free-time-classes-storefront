"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import { getAvatarColor } from "@/lib/utils";
import { useTranslations, useLocale } from "@/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "@/types/subject";
import {
  Search,
  Star,
  Filter,
  BookOpen,
  Clock,
  MapPin,
  ChevronDown,
  X,
} from "lucide-react";

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

interface EnrichedTutor extends TutorProfile {
  subjects: { id: number; name: string }[];
  coursesCount: number;
}

type SortOption = "relevance" | "rating_desc" | "price_asc" | "price_desc" | "experience_desc";

export default function TutorsPage() {
  const t = useTranslations("tutorsPage");
  const locale = useLocale();

  const [tutors, setTutors] = useState<EnrichedTutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    void getSubjects()
      .then(setSubjects)
      .catch(() => {});
  }, []);

  const loadTutors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data: profilesData, error: profilesError } = await supabase
        .from("tutor_profiles")
        .select(
          `
          *,
          user:users!tutor_profiles_id_fkey (
            id, username, email, profile_picture, country
          )
        `
        )
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (profilesError) throw profilesError;
      if (!profilesData) {
        setTutors([]);
        return;
      }

      const enriched: EnrichedTutor[] = await Promise.all(
        (profilesData as TutorProfile[]).map(async (tutor) => {
          const [subjectsResult, coursesResult] = await Promise.all([
            supabase
              .from("tutor_subjects")
              .select("subject:subjects(id, name)")
              .eq("tutor_id", tutor.id),
            supabase
              .from("courses")
              .select("id", { count: "exact", head: true })
              .eq("tutor_id", tutor.id)
              .eq("is_active", true),
          ]);

          const subjectsList = (subjectsResult.data ?? [])
            .map((row: Record<string, unknown>) => row.subject as { id: number; name: string } | null)
            .filter(Boolean) as { id: number; name: string }[];

          return {
            ...tutor,
            subjects: subjectsList,
            coursesCount: coursesResult.count ?? 0,
          };
        })
      );

      setTutors(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
      setTutors([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadTutors();
  }, [loadTutors]);

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
        result = result.filter((tutor) => (tutor.hourly_rate ?? 0) >= min);
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(max)) {
        result = result.filter((tutor) => (tutor.hourly_rate ?? Infinity) <= max);
      }
    }

    switch (sortBy) {
      case "rating_desc":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "price_asc":
        result.sort((a, b) => (a.hourly_rate ?? 0) - (b.hourly_rate ?? 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b.hourly_rate ?? 0) - (a.hourly_rate ?? 0));
        break;
      case "experience_desc":
        result.sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0));
        break;
    }

    return result;
  }, [tutors, debouncedSearch, selectedSubject, minRating, minPrice, maxPrice, sortBy]);

  const resolveAvatar = (pic: string | null | undefined) => {
    if (!pic) return null;
    return pic.startsWith("http") ? pic : getPublicUrl("avatars", pic);
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25;
    const stars: React.ReactNode[] = [];
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
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 to-gray-50">
      {/* Hero / Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-lg md:text-xl text-primary-100">
              {t("subtitle")}
            </p>

            <div className="relative max-w-xl mx-auto mt-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-12 pr-10 h-14 rounded-full bg-white text-gray-900 border-0 shadow-xl text-base placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="gap-2"
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
                className="text-red-600 hover:text-red-700 gap-1"
              >
                <X className="h-3.5 w-3.5" />
                {t("clearFilters")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t("sortBy")}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="relevance">{t("sortRelevance")}</option>
              <option value="rating_desc">{t("sortRatingDesc")}</option>
              <option value="price_asc">{t("sortPriceAsc")}</option>
              <option value="price_desc">{t("sortPriceDesc")}</option>
              <option value="experience_desc">{t("sortExperienceDesc")}</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filters */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            filtersOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <Card className="border-primary-100">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Subject filter */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t("subject")}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t("allSubjects")}</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Rating */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t("minRating")}
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t("anyRating")}</option>
                    <option value="4.5">4.5+ {t("stars")}</option>
                    <option value="4">4+ {t("stars")}</option>
                    <option value="3.5">3.5+ {t("stars")}</option>
                    <option value="3">3+ {t("stars")}</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {t("priceRange")}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("minPrice")}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("maxPrice")}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Sort (mobile duplicate) */}
                <div className="space-y-1.5 sm:hidden">
                  <label className="text-sm font-medium text-gray-700">
                    {t("sortBy")}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="relevance">{t("sortRelevance")}</option>
                    <option value="rating_desc">{t("sortRatingDesc")}</option>
                    <option value="price_asc">{t("sortPriceAsc")}</option>
                    <option value="price_desc">{t("sortPriceDesc")}</option>
                    <option value="experience_desc">{t("sortExperienceDesc")}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500">
            {t("resultsCount", { count: filteredTutors.length })}
          </p>
        )}

        {/* Content */}
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
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => void loadTutors()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredTutors.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">{t("noResults")}</p>
              <p className="text-gray-400 text-sm mt-1">{t("noResultsHint")}</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={clearFilters}
                >
                  {t("clearFilters")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => {
              const user = tutor.user;
              const avatarUrl = resolveAvatar(user?.profile_picture);
              const initials = (user?.username?.[0] ?? "T").toUpperCase();
              const rating = tutor.rating ?? 0;

              return (
                <Card
                  key={tutor.id}
                  className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border-gray-100"
                >
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600" />

                  <CardContent className="p-6 space-y-4">
                    {/* Avatar + basic info */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 ring-2 ring-primary-100 ring-offset-2 shrink-0">
                        {avatarUrl ? (
                          <AvatarImage
                            src={avatarUrl}
                            alt={user?.username ?? "Tutor"}
                          />
                        ) : null}
                        <AvatarFallback
                          className="text-white text-lg font-semibold"
                          style={{
                            backgroundColor: getAvatarColor(user?.username ?? ""),
                          }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg truncate text-gray-900">
                          {user?.username ?? "—"}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center">{renderStars(rating)}</div>
                          <span className="text-sm font-medium text-gray-700">
                            {rating.toFixed(1)}
                          </span>
                          {tutor.total_reviews ? (
                            <span className="text-xs text-gray-400">
                              ({t("reviewsCount", { count: tutor.total_reviews })})
                            </span>
                          ) : null}
                        </div>

                        {/* Country */}
                        {user?.country && (
                          <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{user.country}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subjects badges */}
                    {tutor.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.subjects.slice(0, 3).map((s) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className="text-xs bg-primary-50 text-primary-700 border-primary-100"
                          >
                            {s.name}
                          </Badge>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            +{tutor.subjects.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-1">
                      {tutor.experience_years != null && tutor.experience_years > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {t("yearsExperience", { count: tutor.experience_years })}
                          </span>
                        </div>
                      )}
                      {tutor.coursesCount > 0 && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span>{t("coursesCount", { count: tutor.coursesCount })}</span>
                        </div>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {tutor.hourly_rate != null ? (
                        <div>
                          <span className="text-2xl font-bold text-primary-700">
                            ${tutor.hourly_rate}
                          </span>
                          <span className="text-sm text-gray-400 ml-0.5">
                            {t("perHour")}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}

                      <Link href={`/${locale}/courses?tutor=${tutor.id}`}>
                        <Button
                          size="sm"
                          className="rounded-full px-5 gap-1.5 group-hover:shadow-md transition-shadow"
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
