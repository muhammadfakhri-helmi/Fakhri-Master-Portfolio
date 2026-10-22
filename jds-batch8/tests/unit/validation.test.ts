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
    expect(stepsFor(a)).toEqual(["personal", "skills", "team", "internal-objective", "reward-leadership", "commitment", "review"]);
    a.team.preference = "external";
    expect(stepsFor(a)).toEqual(["personal", "skills", "team", "external-objective", "reward-leadership", "commitment", "review"]);
    a.team.preference = "flexible";
    expect(stepsFor(a).some((s) => s.startsWith("internal-") || s.startsWith("external-"))).toBe(false);
    expect(validateStep("team", a)["team.flexibleTrack"]).toBeTruthy();
    a.team.flexibleTrack = "external";
    expect(stepsFor(a)).toContain("external-objective");
    expect(stepsFor(a)).not.toContain("internal-objective");
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

  it("asks five short Internal questions, each needing a real (but short) answer", () => {
    const empty = validateStep("internal-objective", createInitialAnswers());
    expect(Object.keys(empty).sort()).toEqual(["internal.composition", "internal.externalSupport", "internal.recovery", "internal.strategy", "internal.tracking"]);
    const a = completeInternalAnswers();
    a.internal.strategy = "Promosi.";
    expect(validateStep("internal-objective", a)["internal.strategy"]).toMatch(/minimal 20/);
    a.internal.strategy = "Promosi lewat alumni dan LinkedIn.";
    expect(validateStep("internal-objective", a)).toEqual({});
  });
});

describe("External questions", () => {
  const kpi = () => completeExternalAnswers().external.kpi;

  it("asks for companies, target professionals, KPI and three outreach answers", () => {
    const empty = validateStep("external-objective", createInitialAnswers());
    for (const key of ["external.companies", "external.targetProfile", "external.kpi.total", "external.kpiReason", "external.approach", "external.conversion", "external.reporting"]) {
      expect(empty[key], key).toBeTruthy();
    }
  });

  it("requires offline + online = total and a total between 1 and 300", () => {
    expect(checkKpi(kpi()).errors).toEqual({});
    expect(checkKpi({ ...kpi(), online: "5" }).errors["external.kpi.online"]).toMatch(/Offline \+ online/);
    expect(checkKpi({ ...kpi(), total: "dua" }).errors["external.kpi.total"]).toBeTruthy();
    expect(checkKpi({ total: "0", offline: "0", online: "0" }).errors["external.kpi.total"]).toBeTruthy();
    expect(checkKpi({ ...kpi(), total: "301" }).errors["external.kpi.total"]).toMatch(/300/);
  });

  it("warns (without blocking) about very high personal targets", () => {
    const check = checkKpi({ total: "60", offline: "40", online: "20" });
    expect(check.errors).toEqual({});
    expect(check.warnings.join(" ")).toMatch(/realistis/);
  });

  it("needs at least three companies, ignores empty rows and flags duplicates", () => {
    const a = completeExternalAnswers();
    a.external.companies = ["Operator Satu", "Geo Dua", ""];
    expect(validateStep("external-objective", a)["external.companies"]).toMatch(/minimal 3/);
    a.external.companies = ["Operator Satu", "Geo Dua", "", "operator satu"];
    expect(validateStep("external-objective", a)["external.companies.3"]).toMatch(/sudah disebutkan/);
    a.external.companies = ["Operator Satu", "", "Geo Dua", "Service Tiga"];
    expect(validateStep("external-objective", a)).toEqual({});
    expect(buildPayload(a, "ABC123").external?.companies).toEqual(["Operator Satu", "Geo Dua", "Service Tiga"]);
  });

  it("blocks contact details of third parties", () => {
    const a = completeExternalAnswers();
    a.external.targetProfile = `Pak Budi ${["0", "812-3456-7890"].join("")}`;
    expect(validateStep("external-objective", a)["external.targetProfile"]).toMatch(/pihak ketiga/);
    expect(containsContactDetails(["seseorang", "kantor.co.id"].join("@"))).toBe(true);
    expect(containsContactDetails("pengalaman 3 tahun di 2 perusahaan")).toBe(false);
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
    a.internal.strategy = "draf lama yang tidak boleh terkirim";
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
