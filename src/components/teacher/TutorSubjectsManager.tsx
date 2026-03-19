"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/translations";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import {
  addTutorSubject,
  getTutorSubjectDetails,
  removeTutorSubject,
} from "@/lib/supabase/queries/tutors";
import type { Subject } from "@/types/subject";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/i18n/translations";
import { Trash2 } from "lucide-react";

interface TutorSubjectsManagerProps {
  tutorId: string;
  initialSubjects: Subject[];
  onSubjectsUpdated: (subjects: Subject[]) => void;
}

export default function TutorSubjectsManager({
  tutorId,
  initialSubjects,
  onSubjectsUpdated,
}: TutorSubjectsManagerProps) {
  const t = useTranslations("teacherProfile.subjectsManager");
  const locale = useLocale();
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(
    () => new Set(initialSubjects.map((subject) => subject.id))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  useEffect(() => {
    setSelectedSubjectIds(new Set(initialSubjects.map((subject) => subject.id)));
  }, [initialSubjects]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const subjects = await getSubjects();
        setAllSubjects(subjects);
      } catch (err) {
        console.error("Error loading subjects catalog:", err);
        setError(t("loadCatalogError"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadSubjects();
  }, [t]);

  const selectedCount = selectedSubjectIds.size;
  const hasSubjects = allSubjects.length > 0;

  const selectedSubjects = useMemo(
    () =>
      allSubjects.filter((subject) => selectedSubjectIds.has(subject.id)).slice(0, 8),
    [allSubjects, selectedSubjectIds]
  );

  const toggleSubject = async (subjectId: number) => {
    if (isSaving) {
      return;
    }

    const wasSelected = selectedSubjectIds.has(subjectId);

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (wasSelected) {
        await removeTutorSubject(tutorId, subjectId);
      } else {
        await addTutorSubject(tutorId, subjectId);
      }

      const updated = await getTutorSubjectDetails(tutorId);
      setSelectedSubjectIds(new Set(updated.map((subject) => subject.id)));
      onSubjectsUpdated(updated);
      setSuccessMessage(t("saved"));
    } catch (err) {
      console.error("Error updating tutor subjects:", err);
      setError(t("updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubject = async () => {
    const normalizedName = newSubjectName.trim();

    if (!normalizedName) {
      setError(t("emptyNameError"));
      return;
    }

    const alreadyExists = allSubjects.some(
      (subject) => subject.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (alreadyExists) {
      setError(t("duplicateNameError"));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/${locale}/api/subjects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId, name: normalizedName }),
      });

      const json = (await res.json()) as { error?: string; createdSubjectId?: number };

      if (!res.ok) {
        throw new Error(json.error || t("createError"));
      }

      const [updatedCatalog, updatedSelectedSubjects] = await Promise.all([
        getSubjects(),
        getTutorSubjectDetails(tutorId),
      ]);

      setAllSubjects(updatedCatalog);
      setSelectedSubjectIds(
        new Set(updatedSelectedSubjects.map((subject) => subject.id))
      );
      onSubjectsUpdated(updatedSelectedSubjects);
      setNewSubjectName("");
      setSuccessMessage(t("createdAndSelected"));
    } catch (err) {
      console.error("Error creating subject:", err);
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (isSaving) {
      return;
    }
    setSubjectToDelete(subject);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/${locale}/api/subjects/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: subjectToDelete.id }),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || t("deleteError"));
      }

      const [updatedCatalog, updatedSelectedSubjects] = await Promise.all([
        getSubjects(),
        getTutorSubjectDetails(tutorId),
      ]);

      setAllSubjects(updatedCatalog);
      setSelectedSubjectIds(
        new Set(updatedSelectedSubjects.map((updatedSubject) => updatedSubject.id))
      );
      onSubjectsUpdated(updatedSelectedSubjects);
      setSuccessMessage(t("deleted"));
      setSubjectToDelete(null);
    } catch (err) {
      console.error("Error deleting subject:", err);
      setError(err instanceof Error ? err.message : t("deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary-800">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {t("description")} {selectedCount > 0 ? `(${selectedCount})` : ""}
        </p>

        {isLoading ? (
          <p className="text-sm text-gray-600">{t("loading")}</p>
        ) : !hasSubjects ? (
          <p className="text-sm text-gray-600">{t("emptyCatalog")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allSubjects.map((subject) => {
              const isSelected = selectedSubjectIds.has(subject.id);

              return (
                <div
                  key={subject.id}
                  className="inline-flex items-center rounded-md border bg-white"
                >
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-2 px-3 rounded-r-none border-r"
                    disabled={isSaving}
                    onClick={() => {
                      void toggleSubject(subject.id);
                    }}
                  >
                    {subject.name}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-l-none text-destructive hover:text-destructive"
                    disabled={isSaving}
                    title={t("deleteAction")}
                    aria-label={t("deleteAction")}
                    onClick={() => {
                      void handleDeleteSubject(subject);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("createLabel")}</p>
          <div className="flex gap-2">
            <Input
              value={newSubjectName}
              onChange={(event) => setNewSubjectName(event.target.value)}
              placeholder={t("createPlaceholder")}
              disabled={isSaving}
            />
            <Button type="button" disabled={isSaving} onClick={handleCreateSubject}>
              {isSaving ? t("creating") : t("createAction")}
            </Button>
          </div>
        </div>

        {selectedSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("selectedLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <Badge key={subject.id} variant="secondary">
                  {subject.name}
                </Badge>
              ))}
              {selectedCount > selectedSubjects.length && (
                <Badge variant="outline">
                  +{selectedCount - selectedSubjects.length} {t("more")}
                </Badge>
              )}
            </div>
          </div>
        )}

        {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>

      <Dialog
        open={!!subjectToDelete}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setSubjectToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {subjectToDelete
                ? t("deleteConfirm", { subject: subjectToDelete.name })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => setSubjectToDelete(null)}
            >
              {t("deleteDialogCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSaving}
              onClick={() => {
                void confirmDeleteSubject();
              }}
            >
              {isSaving ? t("deleting") : t("deleteDialogConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
