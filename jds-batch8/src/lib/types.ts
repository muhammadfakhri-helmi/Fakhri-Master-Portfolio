// Shape of one candidate's answers. The whole object is encrypted into the
// downloaded .md file; nothing here is ever stored in plaintext by the website.

export type Team = "internal" | "external";
export type TeamPreference = Team | "flexible";
export type CandidateStatus = "mahasiswa" | "fresh_graduate" | "working_professional";
export type WeeklyHours = "lt3" | "3to5" | "6to10" | "gt10";
export type CompanyIndustry = "operator_oil_gas" | "geothermal" | "service_company" | "engineering" | "other";
export type ApproachChannel = "linkedin" | "referral" | "personal_network" | "community" | "other";
export type RelationshipStatus = "professional_contact" | "indirect_connection" | "no_connection" | "identifying";
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

export interface InternalDeliverable {
  title: string;
  deadline: string;
  indicator: string;
  impact: string;
}

export interface InternalAssessment {
  strategy: {
    mainStrategy: string;
    operatorPlan: string;
    seniorServicePlan: string;
    freshGraduatePlan: string;
    networkingPlan: string;
    firstThreeSteps: string;
  };
  execution: {
    priorities: string;
    externalSupport: string;
    effectivenessMeasure: string;
    workloadSplit: string;
  };
  recovery: {
    priorities: string;
    outreachChanges: string;
    externalCoordination: string;
    recoveryKpi: string;
    risks: string;
  };
  deliverables: InternalDeliverable[];
}

export interface TargetCompany {
  name: string;
  industry: CompanyIndustry | "";
  industryOther: string;
  targetProfile: string;
  reason: string;
  approach: ApproachChannel | "";
  approachOther: string;
}

export interface ProspectTarget {
  name: string;
  profile: string;
  companyOrIndustry: string;
  experience: string;
  relevance: string;
  relationship: RelationshipStatus | "";
  approachPlan: string;
}

/** Numbers are kept as strings while typing; validation turns them into integers. */
export interface PersonalKpi {
  total: string;
  offline: string;
  online: string;
  experienced: string;
  freshGraduate: string;
  operator: string;
  seniorService: string;
  networking: string;
  weeklyProspects: string;
  conversionRate: string;
  prospectSources: string;
  halfKpiPlan: string;
  accountableCommitment: string;
}

export interface ExternalAssessment {
  companies: TargetCompany[];
  prospects: ProspectTarget[];
  kpi: PersonalKpi;
  outreachMessage: string;
  first30: {
    targetCompanies: string;
    prospectCount: string;
    weeklyActivities: string;
    followUp: string;
    conversionTarget: string;
    reporting: string;
  };
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
}
