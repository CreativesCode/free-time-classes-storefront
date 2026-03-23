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
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n/translations";
import {
  createCourse,
  deleteCourse,
  getCoursesByTutor,
  updateCourse,
} from "@/lib/supabase/queries/courses";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

  const resetCreateForm = () => setCreateForm(emptyCourseForm);
  const resetEditForm = () => setEditForm(emptyCourseForm);

  const openEditForCourse = (course: CourseWithRelations) => {
    setError(null);
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
      await withTimeout(
        createCourse(courseFormToCourseInsertPayload(tutorId, createForm)),
        30000,
        t("timeoutError")
      );
      await refreshCourses();
      setCreateOpen(false);
      resetCreateForm();
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
      await withTimeout(
        updateCourse(editCourseId, courseFormToCourseUpdatePayload(editForm)),
        30000,
        t("timeoutError")
      );
      await refreshCourses();
      setEditOpen(false);
      setEditCourseId(null);
      resetEditForm();
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
      <section className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-20 h-48 w-48 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
              Curriculum Builder
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary-950 sm:text-3xl lg:text-4xl">
              Disena tu proximo curso
            </h2>
            <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
              Configura los detalles de tu clase y publica una experiencia premium
              para tus estudiantes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-gray-500">Cursos totales</p>
              <p className="mt-2 text-2xl font-bold text-primary-900">{courses.length}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-gray-500">Publicados</p>
              <p className="mt-2 text-2xl font-bold text-primary-900">{totalPublished}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-gray-500">Estado</p>
              <p className="mt-2 text-sm font-semibold text-primary-900">
                {isLoadingCatalog ? t("loading") : "Listo para crear"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="w-full border-violet-100 xl:col-span-8">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-primary-900">{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={isLoadingCatalog}
                className="w-full rounded-full sm:w-auto"
              >
                {t("createAction")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {isLoadingCatalog ? (
              <div className="flex h-24 items-center justify-center text-sm text-gray-600">
                {t("loading")}
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-8 text-center">
                <p className="text-sm text-gray-600">{t("noCourses")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <article
                    key={course.id}
                    className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="truncate text-base font-bold text-primary-950 sm:text-lg">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subjectNameById.get(course.subject_id ?? -1) ?? "—"} ·{" "}
                          {course.duration_minutes ?? 60} min · ${course.price_per_session} ·{" "}
                          {getLevelLabel(course.level)}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-700">
                          <Star className="h-4 w-4 text-primary-600" fill="currentColor" />
                          <span>{(course.rating ?? 0).toFixed(1)}</span>
                          <span className="text-gray-500">
                            ({course.total_reviews ?? 0} {t("reviewsLabel")})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            course.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-200"
                          }
                        >
                          {course.is_active ? t("active") : t("inactive")}
                        </Badge>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => openEditForCourse(course)}
                          className="rounded-full"
                        >
                          {t("edit")}
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          disabled={isSaving}
                          onClick={() => void handleDelete(course.id)}
                          className="rounded-full"
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="xl:col-span-4">
          <div className="sticky top-24 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-1">
            <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
              <div className="h-28 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 md:h-32" />
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                    Preview
                  </span>
                  <span className="text-lg font-bold text-primary-900">
                    ${createForm.price || "0"}
                  </span>
                </div>
                <h4 className="line-clamp-2 text-base font-bold text-primary-950">
                  {createForm.title.trim() || "Titulo de tu curso..."}
                </h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 text-primary-600" />
                    <span>{createForm.duration_minutes || "60"} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary-600" />
                    <span>{createForm.level ? getLevelLabel(createForm.level) : t("level.none")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary-600" />
                    <span>{createForm.max_students || "1"} estudiantes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-5 shadow-sm">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-900">
                <Sparkles className="h-4 w-4" />
                Consejo editorial
              </p>
              <p className="text-xs leading-relaxed text-gray-600">
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
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>

          <form
            className="flex max-h-[calc(100dvh-13rem)] flex-col gap-4 overflow-y-auto pr-1 sm:max-h-[calc(100dvh-16rem)]"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="course-title">{t("fieldTitle")}</Label>
              <Input
                id="course-title"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder={t("fieldTitlePlaceholder")}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-description">{t("fieldDescription")}</Label>
              <Textarea
                id="course-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder={t("fieldDescriptionPlaceholder")}
                className="min-h-[110px]"
                disabled={isSaving}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-subject">{t("fieldSubject")}</Label>
                <select
                  id="course-subject"
                  value={createForm.subject_id}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, subject_id: e.target.value }))
                  }
                  disabled={isSaving}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t("fieldSubjectSelect")}</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-level">{t("fieldLevel")}</Label>
                <select
                  id="course-level"
                  value={createForm.level}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      level: e.target.value as CourseLevel,
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t("level.none")}</option>
                  <option value="beginner">{t("level.beginner")}</option>
                  <option value="intermediate">
                    {t("level.intermediate")}
                  </option>
                  <option value="advanced">{t("level.advanced")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-price">{t("fieldPrice")}</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-duration">{t("fieldDurationMinutes")}</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-max">{t("fieldMaxStudents")}</Label>
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
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="course-active">{t("fieldStatus")}</Label>
                <p className="text-xs text-gray-500">
                  {createForm.is_active ? t("activeHint") : t("inactiveHint")}
                </p>
              </div>
              <Button
                type="button"
                variant={createForm.is_active ? "default" : "outline"}
                disabled={isSaving}
                onClick={() =>
                  setCreateForm((p) => ({ ...p, is_active: !p.is_active }))
                }
              >
                {createForm.is_active ? t("active") : t("inactive")}
              </Button>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter className="sticky bottom-0 z-10 -mx-1 mt-2 flex flex-col gap-2 border-t bg-background/95 px-1 pt-3 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:gap-0 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setError(null);
                }}
                disabled={isSaving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
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
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>

          <form
            className="flex max-h-[calc(100dvh-13rem)] flex-col gap-4 overflow-y-auto pr-1 sm:max-h-[calc(100dvh-16rem)]"
            onSubmit={(e) => {
              e.preventDefault();
              void handleUpdate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-course-title">{t("fieldTitle")}</Label>
              <Input
                id="edit-course-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course-description">
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
                className="min-h-[110px]"
                disabled={isSaving}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-course-subject">{t("fieldSubject")}</Label>
                <select
                  id="edit-course-subject"
                  value={editForm.subject_id}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, subject_id: e.target.value }))
                  }
                  disabled={isSaving}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t("fieldSubjectSelect")}</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-course-level">{t("fieldLevel")}</Label>
                <select
                  id="edit-course-level"
                  value={editForm.level}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      level: e.target.value as CourseLevel,
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t("level.none")}</option>
                  <option value="beginner">{t("level.beginner")}</option>
                  <option value="intermediate">
                    {t("level.intermediate")}
                  </option>
                  <option value="advanced">{t("level.advanced")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-course-price">{t("fieldPrice")}</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-course-duration">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-course-max">{t("fieldMaxStudents")}</Label>
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
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-course-active">{t("fieldStatus")}</Label>
                <p className="text-xs text-gray-500">
                  {editForm.is_active ? t("activeHint") : t("inactiveHint")}
                </p>
              </div>
              <Button
                type="button"
                variant={editForm.is_active ? "default" : "outline"}
                disabled={isSaving}
                onClick={() =>
                  setEditForm((p) => ({ ...p, is_active: !p.is_active }))
                }
              >
                {editForm.is_active ? t("active") : t("inactive")}
              </Button>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter className="sticky bottom-0 z-10 -mx-1 mt-2 flex flex-col gap-2 border-t bg-background/95 px-1 pt-3 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:gap-0 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setError(null);
                }}
                disabled={isSaving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("updating") : t("update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={publishedSuccessOpen} onOpenChange={setPublishedSuccessOpen}>
        <DialogContent className="max-w-md overflow-hidden border-violet-100 p-0">
          <div className="bg-gradient-to-br from-primary to-violet-500 p-8 text-white">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Curso publicado</h3>
            <p className="mt-2 text-sm text-violet-100">
              Tu curso ya esta disponible para tus estudiantes.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
              Comparte el curso y sigue creando nuevas experiencias de aprendizaje.
            </div>
            <DialogFooter className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPublishedSuccessOpen(false)}
                className="w-full rounded-full sm:w-auto"
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setPublishedSuccessOpen(false);
                  setCreateOpen(true);
                }}
                className="w-full rounded-full sm:w-auto"
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

