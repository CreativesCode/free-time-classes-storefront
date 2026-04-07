export interface CVEducation {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface CVCertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface CVExperience {
  id: string;
  role: string;
  institution: string;
  period: string;
  description: string;
}

export interface TutorCVData {
  education: CVEducation[];
  certifications: CVCertification[];
  experience: CVExperience[];
}

export const EMPTY_CV: TutorCVData = {
  education: [],
  certifications: [],
  experience: [],
};

function cvFromParsedObject(parsed: Record<string, unknown>): TutorCVData {
  return {
    education: Array.isArray(parsed.education) ? (parsed.education as CVEducation[]) : [],
    certifications: Array.isArray(parsed.certifications)
      ? (parsed.certifications as CVCertification[])
      : [],
    experience: Array.isArray(parsed.experience) ? (parsed.experience as CVExperience[]) : [],
  };
}

/** Accepts JSON string, plain legacy text, or JSONB object from PostgREST. */
export function parseCVData(raw: string | Record<string, unknown> | null | undefined): TutorCVData {
  if (!raw) return { ...EMPTY_CV };
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return cvFromParsedObject(raw as Record<string, unknown>);
  }
  if (typeof raw !== "string") return { ...EMPTY_CV };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return cvFromParsedObject(parsed);
  } catch {
    // Legacy plain-text certifications: migrate into a single certification entry
    if (raw.trim()) {
      return {
        ...EMPTY_CV,
        certifications: [
          {
            id: crypto.randomUUID(),
            name: raw.trim(),
            issuer: "",
            year: "",
          },
        ],
      };
    }
    return { ...EMPTY_CV };
  }
}

export function stringifyCVData(cv: TutorCVData): string {
  return JSON.stringify(cv);
}
