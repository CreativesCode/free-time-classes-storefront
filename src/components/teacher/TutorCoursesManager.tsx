"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectMenu } from "@/components/ui/select-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  FT_BTN_OUTLINE,
  FT_BTN_PRIMARY,
  FT_FIELD,
  FT_LABEL,
  FT_SELECT_TRIGGER,
  FT_TEXTAREA,
} from "@/components/teacher/ftStyles";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/translations";
import {
  createCourse,
  deleteCourse,
  getCoursesByTutor,
  updateCourse,
} from "@/lib/supabase/queries/courses";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import {
  getCourseCoverPublicUrl,
  uploadCourseCover,
} from "@/lib/supabase/storage";
import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_COURSE_COVER_BYTES = 5 * 1024 * 1024;

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

type CourseLevel = "beginner" | "intermediate" | "advanced" | "";

interface TutorCoursesManagerProps {
  tutorId: string;
  initialCourses?: CourseWithRelations[];
  onCoursesUpdated?: (courses: CourseWithRelations[]) => void;
}

type CourseFormState = {
  title: string;
  description: string;
  subject_id: string;
  price: string;
  duration_minutes: string;
  max_students: string;
  level: CourseLevel;
  is_active: boolean;
};

function toCourseLevelOrNull(level: CourseLevel): "beginner" | "intermediate" | "advanced" | null {
  return level === "" ? null : level;
}

function courseFormToCourseInsertPayload(
  tutorId: string,
  form: CourseFormState
): Parameters<typeof createCourse>[0] {
  return {
    tutor_id: tutorId,
    title: form.title.trim(),
    description: form.description.trim(),
    subject_id: form.subject_id ? Number.parseInt(form.subject_id, 10) : null,
    price_per_session: Number.parseFloat(form.price),
    duration_minutes: Number.parseInt(form.duration_minutes, 10),
    max_students: Number.parseInt(form.max_students, 10),
    level: toCourseLevelOrNull(form.level),
    is_active: form.is_active,
  };
}

function courseFormToCourseUpdatePayload(
  form: CourseFormState
): Parameters<typeof updateCourse>[1] {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    subject_id: form.subject_id ? Number.parseInt(form.subject_id, 10) : null,
    price_per_session: Number.parseFloat(form.price),
    duration_minutes: Number.parseInt(form.duration_minutes, 10),
    max_students: Number.parseInt(form.max_students, 10),
    level: toCourseLevelOrNull(form.level),
    is_active: form.is_active,
  };
}

const emptyCourseForm: CourseFormState = {
  title: "",
  description: "",
  subject_id: "",
  price: "0",
  duration_minutes: "60",
  max_students: "1",
  level: "",
  is_active: true,
};

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function TutorCoursesManager({
  tutorId,
  initialCourses,
  onCoursesUpdated,
}: TutorCoursesManagerProps) {
  const t = useTranslations("teacherProfile.coursesManager");

  const [courses, setCourses] = useState<CourseWithRelations[]>(initialCourses ?? []);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publishedSuccessOpen, setPublishedSuccessOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CourseFormState>(emptyCourseForm);
  const [editForm, setEditForm] = useState<CourseFormState>(emptyCourseForm);

  const [createCoverFile, setCreateCoverFile] = useState<File | null>(null);
  const [createCoverPreview, setCreateCoverPreview] = useState<string | null>(
    null
  );
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editRemoveCover, setEditRemoveCover] = useState(false);

  const createDialogBodyScrollRef = useRef<HTMLDivElement>(null);
  const editDialogBodyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCourses(initialCourses ?? []);
  }, [initialCourses]);

  useEffect(() => {
    let isMounted = true;

    async function loadSubjectsAndCoursesIfNeeded() {
      try {
        setIsLoadingCatalog(true);
        setError(null);

        const [subjectsData, coursesData] = await Promise.all([
          getSubjects(),
          initialCourses ? Promise.resolve(initialCourses) : getCoursesByTutor(tutorId),
        ]);

        if (!isMounted) return;

        setSubjects(subjectsData);
        setCourses(coursesData);
        onCoursesUpdated?.(coursesData);
      } catch (err) {
        console.error("Error loading tutor courses catalog:", err);
        if (!isMounted) return;
        setError(t("loadError"));
      } finally {
        if (!isMounted) return;
        setIsLoadingCatalog(false);
      }
    }

    void loadSubjectsAndCoursesIfNeeded();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorId]);

  const subjectNameById = useMemo(() => {
    return new Map(subjects.map((s) => [s.id, s.name]));
  }, [subjects]);

  const subjectSelectOptions = useMemo(
    () => [
      { value: "", label: t("fieldSubjectSelect") },
      ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [subjects, t]
  );

  const courseLevelSelectOptions = useMemo(
    () => [
      { value: "", label: t("level.none") },
      { value: "beginner", label: t("level.beginner") },
      { value: "intermediate", label: t("level.intermediate") },
      { value: "advanced", label: t("level.advanced") },
    ],
    [t]
  );

  const courseFormSelectTrigger = FT_SELECT_TRIGGER;

  const courseBeingEdited = useMemo(
    () => courses.find((c) => c.id === editCourseId) ?? null,
    [courses, editCourseId]
  );

  const editCoverDisplayUrl =
    editCoverPreview ??
    (!editRemoveCover
      ? getCourseCoverPublicUrl(courseBeingEdited?.cover_image)
      : null);

  const resetCreateForm = () => setCreateForm(emptyCourseForm);
  const resetEditForm = () => setEditForm(emptyCourseForm);

  const clearCreateCover = () => {
    setCreateCoverFile(null);
    setCreateCoverPreview((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
  };

  const resetEditCoverState = () => {
    setEditCoverFile(null);
    setEditCoverPreview((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
    setEditRemoveCover(false);
  };

  const onCreateCoverFileSelected = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("validationCoverNotImage"));
      return;
    }
    if (file.size > MAX_COURSE_COVER_BYTES) {
      setError(t("validationCoverTooLarge"));
      return;
    }
    setError(null);
    setCreateCoverFile(file);
    setCreateCoverPreview((prev) => {
      revokeBlobUrl(prev);
      return URL.createObjectURL(file);
    });
  };

  const onEditCoverFileSelected = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("validationCoverNotImage"));
      return;
    }
    if (file.size > MAX_COURSE_COVER_BYTES) {
      setError(t("validationCoverTooLarge"));
      return;
    }
    setError(null);
    setEditRemoveCover(false);
    setEditCoverFile(file);
    setEditCoverPreview((prev) => {
      revokeBlobUrl(prev);
      return URL.createObjectURL(file);
    });
  };

  const markEditCoverRemoved = () => {
    setEditCoverFile(null);
    setEditCoverPreview((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
    setEditRemoveCover(true);
  };

  const openEditForCourse = (course: CourseWithRelations) => {
    setError(null);
    resetEditCoverState();
    setEditCourseId(course.id);
    setEditForm({
      title: course.title ?? "",
      description: course.description ?? "",
      subject_id: course.subject_id ? String(course.subject_id) : "",
      price: String(course.price_per_session ?? 0),
      duration_minutes: String(course.duration_minutes ?? 60),
      max_students: String(course.max_students ?? 1),
      level: course.level ?? "",
      is_active: !!course.is_active,
    });
    setEditOpen(true);
  };

  const refreshCourses = async () => {
    const updated = await withTimeout(
      getCoursesByTutor(tutorId),
      30000,
      t("timeoutError")
    );
    setCourses(updated);
    onCoursesUpdated?.(updated);
  };

  const validateForm = (form: CourseFormState) => {
    if (!form.title.trim()) return t("validationTitleRequired");
    if (!form.description.trim()) return t("validationDescriptionRequired");
    if (!form.subject_id) return t("validationSubjectRequired");
    if (!Number.isFinite(Number.parseFloat(form.price)))
      return t("validationPriceInvalid");
    if (!Number.isFinite(Number.parseInt(form.duration_minutes, 10)))
      return t("validationDurationInvalid");
    if (Number.parseInt(form.duration_minutes, 10) < 30) {
      return t("validationDurationMinInvalid");
    }
    if (!Number.isFinite(Number.parseInt(form.max_students, 10)))
      return t("validationMaxStudentsInvalid");
    return null;
  };

  const handleCreate = async () => {
    setError(null);
    const validationError = validateForm(createForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const created = await withTimeout(
        createCourse(courseFormToCourseInsertPayload(tutorId, createForm)),
        30000,
        t("timeoutError")
      );
      if (createCoverFile) {
        const path = await withTimeout(
          uploadCourseCover(created.id, createCoverFile),
          30000,
          t("timeoutError")
        );
        await withTimeout(
          updateCourse(created.id, { cover_image: path }),
          30000,
          t("timeoutError")
        );
      }
      await refreshCourses();
      setCreateOpen(false);
      resetCreateForm();
      clearCreateCover();
      setPublishedSuccessOpen(true);
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (editCourseId === null) return;

    setError(null);
    const validationError = validateForm(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const baseUpdates = courseFormToCourseUpdatePayload(editForm);
      let updates = { ...baseUpdates };
      if (editRemoveCover) {
        updates = { ...updates, cover_image: null };
      } else if (editCoverFile) {
        const path = await withTimeout(
          uploadCourseCover(editCourseId, editCoverFile),
          30000,
          t("timeoutError")
        );
        updates = { ...updates, cover_image: path };
      }
      await withTimeout(updateCourse(editCourseId, updates), 30000, t("timeoutError"));
      await refreshCourses();
      setEditOpen(false);
      setEditCourseId(null);
      resetEditForm();
      resetEditCoverState();
    } catch (err) {
      console.error("Error updating course:", err);
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    setError(null);
    setIsSaving(true);
    try {
      await withTimeout(deleteCourse(courseId), 30000, t("timeoutError"));
      await refreshCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(err instanceof Error ? err.message : t("deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  const getLevelLabel = (level: CourseWithRelations["level"]) => {
    if (level === "beginner") return t("level.beginner");
    if (level === "intermediate") return t("level.intermediate");
    if (level === "advanced") return t("level.advanced");
    return t("level.none");
  };

  const totalPublished = courses.filter((course) => course.is_active).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-ft-2xl border border-ft-line bg-gradient-to-br from-ft-surface-2 via-ft-surface-1 to-ft-paper p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-ft-accent/15 blur-3xl" />
        <div className="absolute -left-16 -bottom-20 h-48 w-48 rounded-full bg-ft-accent-soft/30 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ft-accent-deep">
              {t("heroEyebrow")}
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-ft-ink sm:text-3xl lg:text-4xl">
              {t("heroTitle")}
            </h2>
            <p className="max-w-2xl text-sm text-ft-ink-2 sm:text-base">
              {t("heroDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-ft-base border border-ft-line bg-ft-paper/80 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-ft-ink-3">{t("statTotalCourses")}</p>
              <p className="mt-2 text-2xl font-bold text-ft-ink">{courses.length}</p>
            </div>
            <div className="rounded-ft-base border border-ft-line bg-ft-paper/80 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-ft-ink-3">{t("statPublished")}</p>
              <p className="mt-2 text-2xl font-bold text-ft-ink">{totalPublished}</p>
            </div>
            <div className="rounded-ft-base border border-ft-line bg-ft-paper/80 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-ft-ink-3">{t("statStatus")}</p>
              <p className="mt-2 text-sm font-semibold text-ft-ink">
                {isLoadingCatalog ? t("loading") : t("readyToCreate")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="w-full rounded-ft-2xl border-ft-line bg-ft-paper shadow-none xl:col-span-8">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-ft-ink">{t("title")}</CardTitle>
                <CardDescription className="text-ft-ink-3">{t("description")}</CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={isLoadingCatalog}
                className={cn(FT_BTN_PRIMARY, "w-full sm:w-auto")}
              >
                {t("createAction")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {isLoadingCatalog ? (
              <div className="flex h-24 items-center justify-center text-sm text-ft-ink-3">
                {t("loading")}
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-ft-base border border-dashed border-ft-line bg-ft-surface-1/50 p-8 text-center">
                <p className="text-sm text-ft-ink-3">{t("noCourses")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => {
                  const listCoverUrl = getCourseCoverPublicUrl(course.cover_image);
                  return (
                    <article
                      key={course.id}
                      className="overflow-hidden rounded-ft-lg border border-ft-line bg-ft-surface-1 shadow-none"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-36 w-full shrink-0 bg-gradient-to-br from-ft-accent to-ft-accent-deep sm:h-auto sm:min-h-[132px] sm:w-40 md:w-44">
                          {listCoverUrl ? (
                            <Image
                              src={listCoverUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 176px"
                            />
                          ) : (
                            <div className="flex h-full min-h-[9rem] items-center justify-center sm:min-h-[132px]">
                              <ImageIcon className="h-12 w-12 text-ft-paper/55" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1 space-y-2">
                              <h3 className="truncate text-base font-bold text-ft-ink sm:text-lg">
                                {course.title}
                              </h3>
                              <p className="text-sm text-ft-ink-3">
                                {subjectNameById.get(course.subject_id ?? -1) ?? "—"} ·{" "}
                                {course.duration_minutes ?? 60} min · ${course.price_per_session} ·{" "}
                                {getLevelLabel(course.level)}
                              </p>
                              <div className="mt-1 flex items-center gap-1 text-sm text-ft-ink-2">
                                <Star className="h-4 w-4 text-ft-accent" fill="currentColor" />
                                <span>{(course.rating ?? 0).toFixed(1)}</span>
                                <span className="text-ft-ink-3">
                                  ({course.total_reviews ?? 0} {t("reviewsLabel")})
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={
                                  course.is_active
                                    ? "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                    : "border-transparent bg-ft-surface-2 text-ft-ink-2 hover:bg-ft-surface-2"
                                }
                              >
                                {course.is_active ? t("active") : t("inactive")}
                              </Badge>

                              <Button
                                type="button"
                                variant="outline"
                                disabled={isSaving}
                                onClick={() => openEditForCourse(course)}
                                className={FT_BTN_OUTLINE}
                              >
                                {t("edit")}
                              </Button>

                              <Button
                                type="button"
                                variant="destructive"
                                disabled={isSaving}
                                onClick={() => void handleDelete(course.id)}
                                className="rounded-ft-md shadow-none"
                              >
                                {t("delete")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="xl:col-span-4">
          <div className="sticky top-24 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-1">
            <div className="overflow-hidden rounded-ft-lg border border-ft-line bg-ft-surface-1 shadow-none">
              <div className="relative h-28 bg-gradient-to-br from-ft-accent to-ft-accent-deep md:h-32">
                {createCoverPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={createCoverPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </>
                ) : null}
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-ft-xs bg-ft-accent-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ft-accent-deep">
                    Preview
                  </span>
                  <span className="text-lg font-bold text-ft-ink">
                    ${createForm.price || "0"}
                  </span>
                </div>
                <h4 className="line-clamp-2 text-base font-bold text-ft-ink">
                  {createForm.title.trim() || "Titulo de tu curso..."}
                </h4>
                <div className="space-y-2 text-xs text-ft-ink-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 text-ft-accent-deep" />
                    <span>{createForm.duration_minutes || "60"} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-ft-accent-deep" />
                    <span>{createForm.level ? getLevelLabel(createForm.level) : t("level.none")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-ft-accent-deep" />
                    <span>{createForm.max_students || "1"} estudiantes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-ft-lg border border-ft-line bg-ft-surface-1/60 p-5 shadow-none">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ft-ink">
                <Sparkles className="h-4 w-4 text-ft-accent-deep" />
                Consejo editorial
              </p>
              <p className="text-xs leading-relaxed text-ft-ink-3">
                Los cursos con una descripcion clara y objetivos concretos suelen
                convertir mejor.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Create */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setError(null);
            resetCreateForm();
            clearCreateCover();
          }
        }}
      >
        <DialogContent
          data-theme="freetime"
          className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden border-ft-line bg-ft-paper p-0 text-ft-ink sm:max-w-[650px] sm:rounded-ft-2xl"
        >
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.02em] text-ft-ink">{t("createTitle")}</DialogTitle>
            <DialogDescription className="text-ft-ink-3">{t("createDescription")}</DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreate();
            }}
          >
            <div
              ref={createDialogBodyScrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-visible px-4 pb-4 pt-1 sm:px-6"
            >
              <div className="space-y-2">
                <Label htmlFor="course-title" className={FT_LABEL}>{t("fieldTitle")}</Label>
                <Input
                  id="course-title"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder={t("fieldTitlePlaceholder")}
                  disabled={isSaving}
                  required
                  className={FT_FIELD}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-description" className={FT_LABEL}>{t("fieldDescription")}</Label>
                <Textarea
                  id="course-description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder={t("fieldDescriptionPlaceholder")}
                  className={cn(FT_TEXTAREA, "min-h-[110px]")}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-cover" className={FT_LABEL}>{t("fieldCoverImage")}</Label>
                <p className="text-xs text-ft-ink-3">{t("fieldCoverImageHint")}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    id="course-cover"
                    type="file"
                    accept="image/*"
                    disabled={isSaving}
                    className={cn(FT_FIELD, "cursor-pointer text-sm file:mr-3 file:text-ft-ink-2")}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      onCreateCoverFileSelected(file);
                    }}
                  />
                  {createCoverPreview ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={clearCreateCover}
                      className={FT_BTN_OUTLINE}
                    >
                      {t("removeCover")}
                    </Button>
                  ) : null}
                </div>
                {createCoverPreview ? (
                  <div className="relative mt-2 aspect-[16/9] max-h-36 w-full overflow-hidden rounded-ft border border-ft-line bg-ft-surface-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={createCoverPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-subject" className={FT_LABEL}>{t("fieldSubject")}</Label>
                  <SelectMenu
                    id="course-subject"
                    value={createForm.subject_id}
                    onValueChange={(subject_id) =>
                      setCreateForm((p) => ({ ...p, subject_id }))
                    }
                    options={subjectSelectOptions}
                    disabled={isSaving}
                    aria-label={t("fieldSubject")}
                    nestedScrollParentRef={createDialogBodyScrollRef}
                    triggerClassName={courseFormSelectTrigger}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-level" className={FT_LABEL}>{t("fieldLevel")}</Label>
                  <SelectMenu
                    id="course-level"
                    value={createForm.level}
                    onValueChange={(level) =>
                      setCreateForm((p) => ({
                        ...p,
                        level: level as CourseLevel,
                      }))
                    }
                    options={courseLevelSelectOptions}
                    disabled={isSaving}
                    aria-label={t("fieldLevel")}
                    nestedScrollParentRef={createDialogBodyScrollRef}
                    triggerClassName={courseFormSelectTrigger}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-price" className={FT_LABEL}>{t("fieldPrice")}</Label>
                  <Input
                    id="course-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.price}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, price: e.target.value }))
                    }
                    disabled={isSaving}
                    required
                    className={FT_FIELD}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-duration" className={FT_LABEL}>{t("fieldDurationMinutes")}</Label>
                  <Input
                    id="course-duration"
                    type="number"
                    step="1"
                    min="30"
                    value={createForm.duration_minutes}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        duration_minutes: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    required
                    className={FT_FIELD}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-max" className={FT_LABEL}>{t("fieldMaxStudents")}</Label>
                  <Input
                    id="course-max"
                    type="number"
                    step="1"
                    min="1"
                    value={createForm.max_students}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        max_students: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    required
                    className={FT_FIELD}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="course-active" className={FT_LABEL}>{t("fieldStatus")}</Label>
                  <p className="text-xs text-ft-ink-3">
                    {createForm.is_active ? t("activeHint") : t("inactiveHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setCreateForm((p) => ({ ...p, is_active: !p.is_active }))
                  }
                  className={createForm.is_active ? FT_BTN_PRIMARY : FT_BTN_OUTLINE}
                >
                  {createForm.is_active ? t("active") : t("inactive")}
                </Button>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t border-ft-line bg-ft-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setError(null);
                }}
                disabled={isSaving}
                className={FT_BTN_OUTLINE}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving} className={FT_BTN_PRIMARY}>
                {isSaving ? t("creating") : t("create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setError(null);
            setEditCourseId(null);
            resetEditForm();
            resetEditCoverState();
          }
        }}
      >
        <DialogContent
          data-theme="freetime"
          className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden border-ft-line bg-ft-paper p-0 text-ft-ink sm:max-w-[650px] sm:rounded-ft-2xl"
        >
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.02em] text-ft-ink">{t("editTitle")}</DialogTitle>
            <DialogDescription className="text-ft-ink-3">{t("editDescription")}</DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              void handleUpdate();
            }}
          >
            <div
              ref={editDialogBodyScrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-visible px-4 pb-4 pt-1 sm:px-6"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-course-title" className={FT_LABEL}>{t("fieldTitle")}</Label>
                <Input
                  id="edit-course-title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, title: e.target.value }))
                  }
                  disabled={isSaving}
                  required
                  className={FT_FIELD}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-course-description" className={FT_LABEL}>
                  {t("fieldDescription")}
                </Label>
                <Textarea
                  id="edit-course-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className={cn(FT_TEXTAREA, "min-h-[110px]")}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-course-cover" className={FT_LABEL}>{t("fieldCoverImage")}</Label>
                <p className="text-xs text-ft-ink-3">{t("fieldCoverImageHint")}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    id="edit-course-cover"
                    type="file"
                    accept="image/*"
                    disabled={isSaving}
                    className={cn(FT_FIELD, "cursor-pointer text-sm file:mr-3 file:text-ft-ink-2")}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      onEditCoverFileSelected(file);
                    }}
                  />
                  {editCoverDisplayUrl && !editRemoveCover ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={markEditCoverRemoved}
                      className={FT_BTN_OUTLINE}
                    >
                      {t("removeCover")}
                    </Button>
                  ) : null}
                </div>
                {editRemoveCover ? (
                  <p className="text-xs text-amber-700">{t("coverWillBeRemoved")}</p>
                ) : null}
                {editCoverDisplayUrl ? (
                  <div className="relative mt-2 aspect-[16/9] max-h-36 w-full overflow-hidden rounded-ft border border-ft-line bg-ft-surface-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editCoverDisplayUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex aspect-[16/9] max-h-36 w-full items-center justify-center rounded-ft border border-dashed border-ft-line bg-ft-surface-1/50 text-ft-ink-3">
                    <ImageIcon className="h-10 w-10" aria-hidden />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-course-subject" className={FT_LABEL}>{t("fieldSubject")}</Label>
                  <SelectMenu
                    id="edit-course-subject"
                    value={editForm.subject_id}
                    onValueChange={(subject_id) =>
                      setEditForm((p) => ({ ...p, subject_id }))
                    }
                    options={subjectSelectOptions}
                    disabled={isSaving}
                    aria-label={t("fieldSubject")}
                    nestedScrollParentRef={editDialogBodyScrollRef}
                    triggerClassName={courseFormSelectTrigger}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-course-level" className={FT_LABEL}>{t("fieldLevel")}</Label>
                  <SelectMenu
                    id="edit-course-level"
                    value={editForm.level}
                    onValueChange={(level) =>
                      setEditForm((p) => ({
                        ...p,
                        level: level as CourseLevel,
                      }))
                    }
                    options={courseLevelSelectOptions}
                    disabled={isSaving}
                    aria-label={t("fieldLevel")}
                    nestedScrollParentRef={editDialogBodyScrollRef}
                    triggerClassName={courseFormSelectTrigger}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-course-price" className={FT_LABEL}>{t("fieldPrice")}</Label>
                  <Input
                    id="edit-course-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, price: e.target.value }))
                    }
                    disabled={isSaving}
                    required
                    className={FT_FIELD}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-course-duration" className={FT_LABEL}>
                    {t("fieldDurationMinutes")}
                  </Label>
                  <Input
                    id="edit-course-duration"
                    type="number"
                    step="1"
                    min="30"
                    value={editForm.duration_minutes}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        duration_minutes: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    required
                    className={FT_FIELD}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-course-max" className={FT_LABEL}>{t("fieldMaxStudents")}</Label>
                  <Input
                    id="edit-course-max"
                    type="number"
                    step="1"
                    min="1"
                    value={editForm.max_students}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        max_students: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    required
                    className={FT_FIELD}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-course-active" className={FT_LABEL}>{t("fieldStatus")}</Label>
                  <p className="text-xs text-ft-ink-3">
                    {editForm.is_active ? t("activeHint") : t("inactiveHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setEditForm((p) => ({ ...p, is_active: !p.is_active }))
                  }
                  className={editForm.is_active ? FT_BTN_PRIMARY : FT_BTN_OUTLINE}
                >
                  {editForm.is_active ? t("active") : t("inactive")}
                </Button>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <DialogFooter className="mt-2 flex shrink-0 flex-col gap-2 border-t border-ft-line bg-ft-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setError(null);
                }}
                disabled={isSaving}
                className={FT_BTN_OUTLINE}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving} className={FT_BTN_PRIMARY}>
                {isSaving ? t("updating") : t("update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={publishedSuccessOpen} onOpenChange={setPublishedSuccessOpen}>
        <DialogContent
          data-theme="freetime"
          className="max-w-md overflow-hidden border-ft-line bg-ft-paper p-0 sm:rounded-ft-2xl"
        >
          <div className="bg-gradient-to-br from-ft-accent to-ft-accent-deep p-8 text-ft-paper">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ft-paper/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Curso publicado</h3>
            <p className="mt-2 text-sm text-ft-paper/80">
              Tu curso ya esta disponible para tus estudiantes.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="rounded-ft bg-ft-surface-1 p-4 text-sm text-ft-ink-2">
              Comparte el curso y sigue creando nuevas experiencias de aprendizaje.
            </div>
            <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPublishedSuccessOpen(false)}
                className={cn(FT_BTN_OUTLINE, "w-full sm:w-auto")}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setPublishedSuccessOpen(false);
                  setCreateOpen(true);
                }}
                className={cn(FT_BTN_PRIMARY, "w-full sm:w-auto")}
              >
                Crear otro
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

