import { describe, expect, it } from "vitest";
import { createInitialAnswers } from "../../src/lib/initial.ts";
import { buildPayload } from "../../src/lib/payload.ts";
import { checkKpi, containsContactDetails, stepsFor, validateAll, validateStep } from "../../src/lib/validation.ts";
import { completeExternalAnswers, completeInternalAnswers } from "../fixtures.ts";

describe("assessment path (branching)", () => {
  it("shows Internal, External or the chosen Flexible track — never both", () => {
    const a = createInitialAnswers();
    expect(stepsFor(a)).toEqual(["personal", "skills", "team", "reward-leadership", "commitment", "review"]);
    a.team.preference = "internal";
    expect(stepsFor(a).filter((s) => s.startsWith("internal-"))).toHaveLength(4);
    expect(stepsFor(a).some((s) => s.startsWith("external-"))).toBe(false);
    a.team.preference = "external";
    expect(stepsFor(a).filter((s) => s.startsWith("external-"))).toHaveLength(5);
    expect(stepsFor(a).some((s) => s.startsWith("internal-"))).toBe(false);
    a.team.preference = "flexible";
    expect(stepsFor(a).some((s) => s.startsWith("internal-") || s.startsWith("external-"))).toBe(false);
    expect(validateStep("team", a)["team.flexibleTrack"]).toBeTruthy();
    a.team.flexibleTrack = "external";
    expect(stepsFor(a)).toContain("external-kpi");
    expect(stepsFor(a)).not.toContain("internal-strategy");
  });

  it("accepts complete answer sets for both tracks", () => {
    expect(validateAll(completeInternalAnswers())).toEqual({});
    expect(validateAll(completeExternalAnswers())).toEqual({});
  });

  it("requires every mandatory field on an empty form", () => {
    const errors = validateStep("personal", createInitialAnswers());
    for (const key of ["fullName", "university", "major", "graduationYear", "status", "email", "whatsapp"]) expect(errors[`personal.${key}`]).toBeTruthy();
    expect(errors["personal.currentJob"]).toBeUndefined();
  });

  it("validates e-mail, WhatsApp and year formats", () => {
    const a = completeInternalAnswers();
    a.personal.email = "bukan-email";
    a.personal.whatsapp = "12ab";
    a.personal.graduationYear = "21";
    const errors = validateStep("personal", a);
    expect(errors["personal.email"]).toMatch(/tidak valid/);
    expect(errors["personal.whatsapp"]).toBeTruthy();
    expect(errors["personal.graduationYear"]).toBeTruthy();
  });

  it("requires concrete essays (minimum length)", () => {
    const a = completeInternalAnswers();
    a.internal.strategy.mainStrategy = "Promosi.";
    expect(validateStep("internal-strategy", a)["internal.strategy.mainStrategy"]).toMatch(/minimal/);
  });
});

describe("External KPI validation", () => {
  const kpi = () => completeExternalAnswers().external.kpi;

  it("passes a consistent KPI and estimates the weeks needed", () => {
    const check = checkKpi(kpi());
    expect(check.errors).toEqual({});
    expect(check.weeksNeeded).toBe(7); // 20 / (15 × 20%) = 6.67 → 7
  });

  it("requires offline + online = total", () => {
    const k = { ...kpi(), online: "5" };
    expect(checkKpi(k).errors["external.kpi.online"]).toMatch(/Offline \+ online/);
  });

  it("requires experienced + fresh graduate = total", () => {
    const k = { ...kpi(), freshGraduate: "5" };
    expect(checkKpi(k).errors["external.kpi.freshGraduate"]).toMatch(/Experienced \+ fresh graduate/);
  });

  it("does not count overlapping sub-categories as unique participants", () => {
    // networking overlaps with experienced: 18 + 2 = 20 total while networking 10 is fine
    expect(checkKpi({ ...kpi(), networking: "10" }).errors).toEqual({});
    expect(checkKpi({ ...kpi(), networking: "21" }).errors["external.kpi.networking"]).toBeTruthy();
    expect(checkKpi({ ...kpi(), operator: "10", seniorService: "10" }).errors["external.kpi.seniorService"]).toBeTruthy();
  });

  it("rejects non-numbers, zero total, totals above 300 and impossible conversion rates", () => {
    expect(checkKpi({ ...kpi(), total: "dua" }).errors["external.kpi.total"]).toBeTruthy();
    expect(checkKpi({ ...kpi(), total: "0", offline: "0", online: "0", experienced: "0", freshGraduate: "0", operator: "0", seniorService: "0", networking: "0" }).errors["external.kpi.total"]).toBeTruthy();
    expect(checkKpi({ ...kpi(), total: "301" }).errors["external.kpi.total"]).toMatch(/300/);
    expect(checkKpi({ ...kpi(), conversionRate: "150" }).errors["external.kpi.conversionRate"]).toBeTruthy();
    expect(checkKpi({ ...kpi(), weeklyProspects: "0" }).errors["external.kpi.weeklyProspects"]).toBeTruthy();
    expect(checkKpi({ ...kpi(), conversionRate: "12,5" }).errors).toEqual({});
  });

  it("warns (without blocking) about very high personal targets", () => {
    const k = { ...kpi(), total: "60", offline: "40", online: "20", experienced: "58" };
    const check = checkKpi(k);
    expect(check.errors).toEqual({});
    expect(check.warnings.join(" ")).toMatch(/realistis/);
  });
});

describe("dynamic forms", () => {
  it("needs at least five target companies and three prospects", () => {
    const a = completeExternalAnswers();
    a.external.companies.pop();
    expect(validateStep("external-companies", a)["external.companies"]).toMatch(/minimal 5/);
    a.external.prospects.pop();
    expect(validateStep("external-prospects", a)["external.prospects"]).toMatch(/minimal 3/);
  });

  it("keeps the prospect name optional but blocks third-party contact details", () => {
    const a = completeExternalAnswers();
    a.external.prospects[1]!.name = "";
    expect(validateStep("external-prospects", a)).toEqual({});
    a.external.prospects[1]!.approachPlan = `Hubungi langsung di ${["0", "812-3456-7890"].join("")} minggu depan`;
    expect(validateStep("external-prospects", a)["external.prospects.1.approachPlan"]).toMatch(/pihak ketiga/);
    expect(containsContactDetails(["seseorang", "kantor.co.id"].join("@"))).toBe(true);
    expect(containsContactDetails("pengalaman 3 tahun di 2 perusahaan")).toBe(false);
  });

  it("flags duplicate company names", () => {
    const a = completeExternalAnswers();
    a.external.companies[4]!.name = "operator satu";
    expect(validateStep("external-companies", a)["external.companies.4.name"]).toMatch(/sudah ada/);
  });
});

describe("Section D conditional questions", () => {
  it("keeps the nomination reward optional", () => {
    const a = completeInternalAnswers();
    for (const plan of ["no", "maybe"] as const) {
      a.final.reward.plan = plan;
      expect(validateStep("reward-leadership", a)).toEqual({});
    }
    a.final.reward.plan = "";
    expect(validateStep("reward-leadership", a)["final.reward.plan"]).toBeTruthy();
  });

  it("asks nominee details only for 'yes' (name optional, transparency required)", () => {
    const a = completeInternalAnswers();
    a.final.reward.plan = "yes";
    const errors = validateStep("reward-leadership", a);
    expect(errors["final.reward.nomineeBackground"]).toBeTruthy();
    expect(errors["final.reward.nomineeReason"]).toBeTruthy();
    expect(errors["final.reward.transparencyAck"]).toBeTruthy();
    expect(errors["final.reward.nomineeName"]).toBeUndefined();
    Object.assign(a.final.reward, {
      nomineeBackground: "Reservoir engineer 4 tahun",
      nomineeReason: "Aktif berbagi ilmu dan relevan dengan target experienced.",
      transparencyAck: true,
    });
    expect(validateStep("reward-leadership", a)).toEqual({});
  });

  it("asks coordinator questions only when the candidate is interested", () => {
    const a = completeInternalAnswers();
    a.final.leadership.interest = "member_only";
    expect(validateStep("reward-leadership", a)).toEqual({});
    a.final.leadership.interest = "lead_external";
    const errors = validateStep("reward-leadership", a);
    expect(errors["final.leadership.readiness"]).toBeTruthy();
    expect(Object.keys(errors).filter((k) => k.startsWith("final.leadership.actions"))).toHaveLength(3);
  });

  it("requires data-processing consent", () => {
    const a = completeInternalAnswers();
    a.final.consent = false;
    expect(validateStep("commitment", a)["final.consent"]).toBeTruthy();
  });
});

describe("payload", () => {
  it("contains only the completed track and drops stale conditional answers", () => {
    const a = completeExternalAnswers();
    a.internal.strategy.mainStrategy = "draf lama yang tidak boleh terkirim";
    a.final.reward = { plan: "maybe", nomineeName: "Nama Lama", nomineeBackground: "x", nomineeReason: "y", nomineeContext: "z", transparencyAck: true };
    a.final.leadership = { interest: "member_only", readiness: "teks lama", actions: ["a", "b", "c"] };
    const p = buildPayload(a, "ABC123");
    expect(p.internal).toBeNull();
    expect(JSON.stringify(p)).not.toContain("draf lama");
    expect(p.final.reward).toMatchObject({ plan: "maybe", nomineeName: "" });
    expect(p.final.leadership).toMatchObject({ interest: "member_only", readiness: "" });
  });

  it("records the Flexible candidate's chosen track", () => {
    const a = completeInternalAnswers();
    a.team.preference = "flexible";
    a.team.flexibleTrack = "internal";
    const p = buildPayload(a, "ABC123");
    expect(p.track).toBe("internal");
    expect(p.team).toMatchObject({ preference: "flexible", flexibleTrack: "internal" });
  });
});
