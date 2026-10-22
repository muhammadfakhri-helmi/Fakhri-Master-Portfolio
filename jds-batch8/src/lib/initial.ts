import type { Answers, Team } from "./types.ts";

export const MIN_COMPANIES = 3;
export const MAX_COMPANIES = 10;

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
    internal: { strategy: "", tracking: "", externalSupport: "", recovery: "", composition: "" },
    external: {
      companies: Array.from({ length: MIN_COMPANIES }, () => ""),
      targetProfile: "",
      kpi: { total: "", offline: "", online: "" },
      kpiReason: "",
      approach: "",
      conversion: "",
      reporting: "",
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
