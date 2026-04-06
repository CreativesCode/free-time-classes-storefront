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

export function parseCVData(raw: string | null | undefined): TutorCVData {
  if (!raw) return { ...EMPTY_CV };
  try {
    const parsed = JSON.parse(raw);
    return {
      education: Array.isArray(parsed.education) ? parsed.education : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    };
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
