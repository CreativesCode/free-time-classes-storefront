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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary-800">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {isLoadingCatalog
              ? t("loading")
              : courses.length > 0
                ? `${courses.length} ${t("coursesFound")}`
                : t("noCourses")}
          </p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={isLoadingCatalog}
          >
            {t("createAction")}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {isLoadingCatalog ? (
          <div className="h-24 flex items-center justify-center text-sm text-gray-600">
            {t("loading")}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-600">{t("noCourses")}</p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{course.title}</h3>
                  <p className="text-sm text-gray-600">
                    {subjectNameById.get(course.subject_id ?? -1) ?? "—"} ·{" "}
                    {course.duration_minutes ?? 60} min · ${course.price_per_session} ·{" "}
                    {course.level === "beginner"
                      ? t("level.beginner")
                      : course.level === "intermediate"
                        ? t("level.intermediate")
                        : course.level === "advanced"
                          ? t("level.advanced")
                          : t("level.none")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      course.is_active
                        ? "bg-accent-500 text-white"
                        : "bg-gray-500 text-white"
                    }
                  >
                    {course.is_active ? t("active") : t("inactive")}
                  </Badge>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => openEditForCourse(course)}
                  >
                    {t("edit")}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSaving}
                    onClick={() => void handleDelete(course.id)}
                  >
                    {t("delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

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
            className="space-y-4"
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
                  min="30"
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

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
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
            className="space-y-4"
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
                  min="30"
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

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
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
    </Card>
  );
}

