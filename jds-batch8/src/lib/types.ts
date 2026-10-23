// Shape of one candidate's answers. The whole object is encrypted into the
// downloaded .md file; nothing here is ever stored in plaintext by the website.

export type Team = "internal" | "external";
export type TeamPreference = Team | "flexible";
export type CandidateStatus = "mahasiswa" | "fresh_graduate" | "working_professional";
export type WeeklyHours = "lt3" | "3to5" | "6to10" | "gt10";
export type RewardPlan = "yes" | "maybe" | "no";
export type LeadershipInterest = "lead_internal" | "lead_external" | "lead_either" | "member_only";
export type PlacementAnswer = "yes" | "conditional" | "no";

export interface PersonalBackground {
  fullName: string;
  university: string;
  major: string;
  graduationYear: string;
  status: CandidateStatus | "";
  currentJob: string;
  email: string;
  whatsapp: string;
  skills: string[];
  skillsOther: string;
  readiestSkill: string;
  weeklyHours: WeeklyHours | "";
  availableTimes: string;
  scheduleConstraints: string;
}

export interface TeamPreferenceAnswers {
  preference: TeamPreference | "";
  /** Only for "flexible": which case assessment the candidate chose to complete. */
  flexibleTrack: Team | "";
  reason: string;
  sharedContribution: string;
}

/** Section C for Internal: five questions on the Internal Team objective. */
export interface InternalAssessment {
  /** How the 300-participant target (200 offline / 100 online) will be reached. */
  strategy: string;
  /** How targets are divided and progress is measured each week. */
  tracking: string;
  /** Concrete support for the External Team to reach its KPI. */
  externalSupport: string;
  /** What to do when registrations fall short two weeks before closing. */
  recovery: string;
  /** Keeping 20 fresh graduates and 280 experienced professionals in balance. */
  composition: string;
}

/** Numbers are kept as strings while typing; validation turns them into integers. */
export interface PersonalKpi {
  total: string;
  offline: string;
  online: string;
}

/** Section C for External: five questions on the External Team objective. */
export interface ExternalAssessment {
  /** Companies the candidate plans to approach (a sourcing plan, not proof of access). */
  companies: string[];
  /** Positions or professional profiles to reach in those companies. */
  targetProfile: string;
  kpi: PersonalKpi;
  /** Why the KPI is realistic. */
  kpiReason: string;
  /** How prospects will be contacted. */
  approach: string;
  /** How prospects are converted into confirmed participants (follow-up). */
  conversion: string;
  /** How activity and obstacles are reported to the team. */
  reporting: string;
}

export interface FinalSection {
  reward: {
    plan: RewardPlan | "";
    nomineeName: string;
    nomineeBackground: string;
    nomineeReason: string;
    nomineeContext: string;
    transparencyAck: boolean;
  };
  leadership: {
    interest: LeadershipInterest | "";
    readiness: string;
    actions: [string, string, string];
  };
  accountability: string;
  finalCommitment: string;
  placement: {
    answer: PlacementAnswer | "";
    notes: string;
  };
  consent: boolean;
}

export interface Answers {
  personal: PersonalBackground;
  team: TeamPreferenceAnswers;
  internal: InternalAssessment;
  external: ExternalAssessment;
  final: FinalSection;
}

/** What is actually encrypted: answers for the completed track only, plus metadata. */
export interface SubmissionPayload {
  schema: "jds-b8-assessment";
  schemaVersion: 2;
  submissionId: string;
  submittedAt: string;
  track: Team;
  personal: PersonalBackground;
  team: TeamPreferenceAnswers;
  internal: InternalAssessment | null;
  external: ExternalAssessment | null;
  final: FinalSection;
  /** Answer-field paste/drop attempts that the website blocked (older files have none). */
  integrity?: Integrity;
}

export interface Integrity {
  pasteBlocked: number;
}
