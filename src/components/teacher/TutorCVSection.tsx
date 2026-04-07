"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n/translations";
import { updateTutorProfile } from "@/lib/supabase/queries/tutors";
import type { TutorProfile } from "@/types/tutor";
import type {
  TutorCVData,
  CVEducation,
  CVCertification,
  CVExperience,
} from "@/types/tutor-cv";
import { parseCVData, stringifyCVData } from "@/types/tutor-cv";
import {
  Award,
  Briefcase,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface TutorCVSectionProps {
  tutorId: string;
  certifications: string | Record<string, unknown> | null | undefined;
  onTutorProfileUpdated?: (updates: Partial<TutorProfile>) => void;
}

type SectionKey = "education" | "certifications" | "experience";
type EditingState =
  | { section: SectionKey; id: string | null }
  | null;

export default function TutorCVSection({
  tutorId,
  certifications,
  onTutorProfileUpdated,
}: TutorCVSectionProps) {
  const t = useTranslations("teacherProfile.cv");
  const [cvData, setCvData] = useState<TutorCVData>(() =>
    parseCVData(certifications)
  );
  const [editing, setEditing] = useState<EditingState>(null);
  const [saving, setSaving] = useState(false);

  // --- Form drafts ---
  const [eduDraft, setEduDraft] = useState<CVEducation>({
    id: "",
    degree: "",
    institution: "",
    year: "",
  });
  const [certDraft, setCertDraft] = useState<CVCertification>({
    id: "",
    name: "",
    issuer: "",
    year: "",
  });
  const [expDraft, setExpDraft] = useState<CVExperience>({
    id: "",
    role: "",
    institution: "",
    period: "",
    description: "",
  });

  const persist = useCallback(
    async (next: TutorCVData) => {
      setSaving(true);
      try {
        const value = stringifyCVData(next);
        await updateTutorProfile(tutorId, { certifications: value });
        setCvData(next);
        onTutorProfileUpdated?.({ certifications: value });
        toast.success(t("saved"));
      } catch (err) {
        console.error("Error saving CV data:", err);
        toast.error(t("saveError"));
      } finally {
        setSaving(false);
      }
    },
    [tutorId, onTutorProfileUpdated, t]
  );

  // --- Education ---
  const startAddEducation = () => {
    setEduDraft({ id: "", degree: "", institution: "", year: "" });
    setEditing({ section: "education", id: null });
  };
  const startEditEducation = (item: CVEducation) => {
    setEduDraft({ ...item });
    setEditing({ section: "education", id: item.id });
  };
  const saveEducation = async () => {
    if (!eduDraft.degree.trim()) return;
    let next: TutorCVData;
    if (editing?.id) {
      next = {
        ...cvData,
        education: cvData.education.map((e) =>
          e.id === editing.id ? { ...eduDraft } : e
        ),
      };
    } else {
      next = {
        ...cvData,
        education: [
          ...cvData.education,
          { ...eduDraft, id: crypto.randomUUID() },
        ],
      };
    }
    await persist(next);
    setEditing(null);
  };
  const deleteEducation = async (id: string) => {
    const next = {
      ...cvData,
      education: cvData.education.filter((e) => e.id !== id),
    };
    await persist(next);
  };

  // --- Certifications ---
  const startAddCert = () => {
    setCertDraft({ id: "", name: "", issuer: "", year: "" });
    setEditing({ section: "certifications", id: null });
  };
  const startEditCert = (item: CVCertification) => {
    setCertDraft({ ...item });
    setEditing({ section: "certifications", id: item.id });
  };
  const saveCert = async () => {
    if (!certDraft.name.trim()) return;
    let next: TutorCVData;
    if (editing?.id) {
      next = {
        ...cvData,
        certifications: cvData.certifications.map((c) =>
          c.id === editing.id ? { ...certDraft } : c
        ),
      };
    } else {
      next = {
        ...cvData,
        certifications: [
          ...cvData.certifications,
          { ...certDraft, id: crypto.randomUUID() },
        ],
      };
    }
    await persist(next);
    setEditing(null);
  };
  const deleteCert = async (id: string) => {
    const next = {
      ...cvData,
      certifications: cvData.certifications.filter((c) => c.id !== id),
    };
    await persist(next);
  };

  // --- Experience ---
  const startAddExp = () => {
    setExpDraft({ id: "", role: "", institution: "", period: "", description: "" });
    setEditing({ section: "experience", id: null });
  };
  const startEditExp = (item: CVExperience) => {
    setExpDraft({ ...item });
    setEditing({ section: "experience", id: item.id });
  };
  const saveExp = async () => {
    if (!expDraft.role.trim()) return;
    let next: TutorCVData;
    if (editing?.id) {
      next = {
        ...cvData,
        experience: cvData.experience.map((x) =>
          x.id === editing.id ? { ...expDraft } : x
        ),
      };
    } else {
      next = {
        ...cvData,
        experience: [
          ...cvData.experience,
          { ...expDraft, id: crypto.randomUUID() },
        ],
      };
    }
    await persist(next);
    setEditing(null);
  };
  const deleteExp = async (id: string) => {
    const next = {
      ...cvData,
      experience: cvData.experience.filter((x) => x.id !== id),
    };
    await persist(next);
  };

  const cancelEditing = () => setEditing(null);

  const isEditing = (section: SectionKey) => editing?.section === section;

  return (
    <Card className="rounded-3xl border-violet-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-slate-900">{t("title")}</CardTitle>
        <CardDescription className="text-slate-500">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ─── Education ─── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                <GraduationCap className="h-4 w-4 text-violet-700" />
              </div>
              <h3 className="font-semibold text-slate-800">{t("education")}</h3>
            </div>
            {!isEditing("education") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startAddEducation}
                className="h-8 gap-1 rounded-full border-violet-200 text-xs text-violet-700 hover:bg-violet-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("add")}
              </Button>
            )}
          </div>

          {cvData.education.length === 0 && !isEditing("education") && (
            <p className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-6 text-center text-sm text-slate-500">
              {t("educationEmpty")}
            </p>
          )}

          <div className="space-y-2">
            {cvData.education.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-2xl border border-violet-100 bg-white px-4 py-3 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <GraduationCap className="hidden h-4 w-4 shrink-0 text-violet-400 sm:block" />
                  <span className="truncate text-sm text-slate-700">
                    <span className="font-medium text-slate-800">{item.degree}</span>
                    {item.institution && (
                      <span className="text-slate-400"> · {item.institution}</span>
                    )}
                    {item.year && (
                      <span className="text-slate-400"> · {item.year}</span>
                    )}
                  </span>
                </div>
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startEditEducation(item)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEducation(item.id)}
                    disabled={saving}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isEditing("education") && (
            <div className="mt-2 space-y-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("degree")} *</Label>
                  <Input
                    value={eduDraft.degree}
                    onChange={(e) =>
                      setEduDraft((d) => ({ ...d, degree: e.target.value }))
                    }
                    placeholder={t("degreePlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("institution")}</Label>
                  <Input
                    value={eduDraft.institution}
                    onChange={(e) =>
                      setEduDraft((d) => ({ ...d, institution: e.target.value }))
                    }
                    placeholder={t("institutionPlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("year")}</Label>
                  <Input
                    value={eduDraft.year}
                    onChange={(e) =>
                      setEduDraft((d) => ({ ...d, year: e.target.value }))
                    }
                    placeholder={t("yearPlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-8 gap-1 rounded-full text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveEducation}
                  disabled={saving || !eduDraft.degree.trim()}
                  className="h-8 gap-1 rounded-full bg-violet-700 text-xs hover:bg-violet-800"
                >
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          )}
        </section>

        <hr className="border-violet-100" />

        {/* ─── Certifications ─── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                <Award className="h-4 w-4 text-amber-700" />
              </div>
              <h3 className="font-semibold text-slate-800">
                {t("certifications")}
              </h3>
            </div>
            {!isEditing("certifications") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startAddCert}
                className="h-8 gap-1 rounded-full border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("add")}
              </Button>
            )}
          </div>

          {cvData.certifications.length === 0 && !isEditing("certifications") && (
            <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-6 text-center text-sm text-slate-500">
              {t("certificationsEmpty")}
            </p>
          )}

          <div className="space-y-2">
            {cvData.certifications.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-2xl border border-amber-100 bg-white px-4 py-3 transition-colors hover:border-amber-200 hover:bg-amber-50/30"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Award className="hidden h-4 w-4 shrink-0 text-amber-400 sm:block" />
                  <span className="truncate text-sm text-slate-700">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    {item.issuer && (
                      <span className="text-slate-400"> · {item.issuer}</span>
                    )}
                    {item.year && (
                      <span className="text-slate-400"> · {item.year}</span>
                    )}
                  </span>
                </div>
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startEditCert(item)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCert(item.id)}
                    disabled={saving}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isEditing("certifications") && (
            <div className="mt-2 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("certName")} *</Label>
                  <Input
                    value={certDraft.name}
                    onChange={(e) =>
                      setCertDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    placeholder={t("certNamePlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("certIssuer")}</Label>
                  <Input
                    value={certDraft.issuer}
                    onChange={(e) =>
                      setCertDraft((d) => ({ ...d, issuer: e.target.value }))
                    }
                    placeholder={t("certIssuerPlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("year")}</Label>
                  <Input
                    value={certDraft.year}
                    onChange={(e) =>
                      setCertDraft((d) => ({ ...d, year: e.target.value }))
                    }
                    placeholder={t("yearPlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-8 gap-1 rounded-full text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveCert}
                  disabled={saving || !certDraft.name.trim()}
                  className="h-8 gap-1 rounded-full bg-amber-600 text-xs hover:bg-amber-700"
                >
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          )}
        </section>

        <hr className="border-violet-100" />

        {/* ─── Experience ─── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                <Briefcase className="h-4 w-4 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-slate-800">
                {t("experience")}
              </h3>
            </div>
            {!isEditing("experience") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startAddExp}
                className="h-8 gap-1 rounded-full border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("add")}
              </Button>
            )}
          </div>

          {cvData.experience.length === 0 && !isEditing("experience") && (
            <p className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-6 text-center text-sm text-slate-500">
              {t("experienceEmpty")}
            </p>
          )}

          <div className="space-y-2">
            {cvData.experience.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-emerald-100 bg-white px-4 py-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Briefcase className="hidden h-4 w-4 shrink-0 text-emerald-400 sm:block" />
                    <span className="truncate text-sm text-slate-700">
                      <span className="font-medium text-slate-800">{item.role}</span>
                      {item.institution && (
                        <span className="text-slate-400"> · {item.institution}</span>
                      )}
                      {item.period && (
                        <span className="text-slate-400"> · {item.period}</span>
                      )}
                    </span>
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEditExp(item)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExp(item.id)}
                      disabled={saving}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="mt-1 pl-0 text-xs leading-relaxed text-slate-400 sm:pl-6">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {isEditing("experience") && (
            <div className="mt-2 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("role")} *</Label>
                  <Input
                    value={expDraft.role}
                    onChange={(e) =>
                      setExpDraft((d) => ({ ...d, role: e.target.value }))
                    }
                    placeholder={t("rolePlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("institution")}</Label>
                  <Input
                    value={expDraft.institution}
                    onChange={(e) =>
                      setExpDraft((d) => ({
                        ...d,
                        institution: e.target.value,
                      }))
                    }
                    placeholder={t("expInstitutionPlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("period")}</Label>
                  <Input
                    value={expDraft.period}
                    onChange={(e) =>
                      setExpDraft((d) => ({ ...d, period: e.target.value }))
                    }
                    placeholder={t("periodPlaceholder")}
                    className="h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("expDescription")}</Label>
                <Textarea
                  value={expDraft.description}
                  onChange={(e) =>
                    setExpDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder={t("expDescriptionPlaceholder")}
                  className="min-h-[60px] resize-y rounded-xl bg-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="h-8 gap-1 rounded-full text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveExp}
                  disabled={saving || !expDraft.role.trim()}
                  className="h-8 gap-1 rounded-full bg-emerald-600 text-xs hover:bg-emerald-700"
                >
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
