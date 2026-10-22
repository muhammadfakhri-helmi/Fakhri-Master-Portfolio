import { describe, expect, it } from "vitest";
import { classify, computeScore, CRITERIA } from "../../src/lib/scoring.ts";

describe("reviewer scoring", () => {
  it("uses the agreed weights", () => {
    expect(CRITERIA.internal.map((c) => [c.label, c.weight])).toEqual([
      ["Recruitment Strategy & Target Achievement", 35],
      ["Execution Planning", 25],
      ["Problem Solving", 20],
      ["Collaboration & Accountability", 10],
      ["Realistic Commitment", 10],
    ]);
    expect(CRITERIA.external.map((c) => [c.label, c.weight])).toEqual([
      ["Target Company & Candidate Mapping", 30],
      ["Recruitment KPI Feasibility", 25],
      ["Outreach & Conversion Strategy", 20],
      ["Collaboration & Accountability", 15],
      ["Commitment", 10],
    ]);
    for (const list of Object.values(CRITERIA)) expect(list.reduce((s, c) => s + c.weight, 0)).toBe(100);
  });

  it("computes a weighted 0–100 score only when every criterion is scored", () => {
    expect(computeScore("internal", {}).score).toBeNull();
    expect(computeScore("internal", { strategy: 5, execution: 5 }).complete).toBe(false);
    expect(computeScore("internal", { strategy: 5, execution: 5, problemSolving: 5, collaboration: 5, commitment: 5 }).score).toBe(100);
    // 4/5×35 + 4/5×25 + 3/5×20 + 5/5×10 + 4/5×10 = 28 + 20 + 12 + 10 + 8 = 78
    const r = computeScore("internal", { strategy: 4, execution: 4, problemSolving: 3, collaboration: 5, commitment: 4 });
    expect(r.score).toBe(78);
    expect(r.classification?.label).toBe("Recommended");
    // 5×30 + 4×25 + 4×20 + 3×15 + 5×10 over 5 = 30 + 20 + 16 + 9 + 10 = 85
    expect(computeScore("external", { mapping: 5, kpiFeasibility: 4, outreach: 4, collaboration: 3, commitment: 5 }).classification?.label).toBe("Strong Candidate");
  });

  it("ignores invalid scores", () => {
    expect(computeScore("external", { mapping: 7, kpiFeasibility: 4, outreach: 4, collaboration: 3, commitment: 5 }).complete).toBe(false);
  });

  it("classifies with the agreed thresholds", () => {
    expect(classify(100).label).toBe("Strong Candidate");
    expect(classify(85).label).toBe("Strong Candidate");
    expect(classify(84.9).label).toBe("Recommended");
    expect(classify(75).label).toBe("Recommended");
    expect(classify(74.9).label).toBe("Consider / Interview");
    expect(classify(65).label).toBe("Consider / Interview");
    expect(classify(64.9).label).toBe("Further Evaluation");
  });
});
