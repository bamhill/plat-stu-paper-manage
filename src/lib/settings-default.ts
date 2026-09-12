export interface AiPackageDefaults {
  includeEditorDecision: boolean;
  includeReviewerComments: boolean;
  includeRevisionHistory: boolean;
  includeSubmissionHistory: boolean;
  includeResponsibilityHistory: boolean;
  includeAttachments: boolean;
}

export interface AppSettings {
  fileRootDir: string;
  organizeByStudent: boolean;
  degreeTypes: string[];
  aiPackageDefaults: AiPackageDefaults;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fileRootDir: "data/files",
  organizeByStudent: true,
  degreeTypes: ["工学硕士", "工业工程专硕", "MBA全日制", "MEM非全", "MBA非全"],
  aiPackageDefaults: {
    includeEditorDecision: true,
    includeReviewerComments: true,
    includeRevisionHistory: true,
    includeSubmissionHistory: true,
    includeResponsibilityHistory: true,
    includeAttachments: true,
  },
};
