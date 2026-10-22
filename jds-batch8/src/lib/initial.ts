import type { Answers, InternalDeliverable, ProspectTarget, Team, TargetCompany } from "./types.ts";

export const emptyCompany = (): TargetCompany => ({
  name: "",
  industry: "",
  industryOther: "",
  targetProfile: "",
  reason: "",
  approach: "",
  approachOther: "",
});

export const emptyProspect = (): ProspectTarget => ({
  name: "",
  profile: "",
  companyOrIndustry: "",
  experience: "",
  relevance: "",
  relationship: "",
  approachPlan: "",
});

export const emptyDeliverable = (): InternalDeliverable => ({ title: "", deadline: "", indicator: "", impact: "" });

export const MIN_COMPANIES = 5;
export const MAX_COMPANIES = 15;
export const MIN_PROSPECTS = 3;
export const MAX_PROSPECTS = 20;
export const MIN_DELIVERABLES = 2;
export const MAX_DELIVERABLES = 5;

export function createInitialAnswers(): Answers {
  return {
    personal: {
      fullName: "",
      university: "",
      major: "",
      graduationYear: "",
      status: "",
      currentJob: "",
      email: "",
      whatsapp: "",
      skills: [],
      skillsOther: "",
      readiestSkill: "",
      weeklyHours: "",
      availableTimes: "",
      scheduleConstraints: "",
    },
    team: { preference: "", flexibleTrack: "", reason: "", sharedContribution: "" },
    internal: {
      strategy: {
        mainStrategy: "",
        operatorPlan: "",
        seniorServicePlan: "",
        freshGraduatePlan: "",
        networkingPlan: "",
        firstThreeSteps: "",
      },
      execution: { priorities: "", externalSupport: "", effectivenessMeasure: "", workloadSplit: "" },
      recovery: { priorities: "", outreachChanges: "", externalCoordination: "", recoveryKpi: "", risks: "" },
      deliverables: [emptyDeliverable(), emptyDeliverable()],
    },
    external: {
      companies: Array.from({ length: MIN_COMPANIES }, emptyCompany),
      prospects: Array.from({ length: MIN_PROSPECTS }, emptyProspect),
      kpi: {
        total: "",
        offline: "",
        online: "",
        experienced: "",
        freshGraduate: "",
        operator: "",
        seniorService: "",
        networking: "",
        weeklyProspects: "",
        conversionRate: "",
        prospectSources: "",
        halfKpiPlan: "",
        accountableCommitment: "",
      },
      outreachMessage: "",
      first30: {
        targetCompanies: "",
        prospectCount: "",
        weeklyActivities: "",
        followUp: "",
        conversionTarget: "",
        reporting: "",
      },
    },
    final: {
      reward: {
        plan: "",
        nomineeName: "",
        nomineeBackground: "",
        nomineeReason: "",
        nomineeContext: "",
        transparencyAck: false,
      },
      leadership: { interest: "", readiness: "", actions: ["", "", ""] },
      accountability: "",
      finalCommitment: "",
      placement: { answer: "", notes: "" },
      consent: false,
    },
  };
}

/** The case assessment the candidate completes (Section C), or null before Section B is answered. */
export function assessmentTrack(answers: Answers): Team | null {
  const { preference, flexibleTrack } = answers.team;
  if (preference === "internal" || preference === "external") return preference;
  if (preference === "flexible" && flexibleTrack) return flexibleTrack;
  return null;
}
