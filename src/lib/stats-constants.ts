/** 成长轨迹 / 能力雷达共用维度（与 CRM mock 一致） */
export const GROWTH_DIMENSIONS = [
  "逻辑自洽",
  "情绪共鸣",
  "执行力",
  "结构化表达",
  "OPC理念理解",
] as const;

export function pseudoScore(
  seed: number,
  offset = 0,
  min = 60,
  max = 95,
): number {
  const n = Math.abs((seed * 9301 + offset * 49297) % 100000);
  return min + (n % (max - min + 1));
}

export function buildOverallScore(homeworkId: number): number {
  return pseudoScore(homeworkId, 99, 70, 92);
}

export function buildDimensionScores(
  homeworkId: number,
): Record<string, number> {
  const scores: Record<string, number> = {};
  GROWTH_DIMENSIONS.forEach((dim, i) => {
    scores[dim] = pseudoScore(homeworkId, i + 1);
  });
  return scores;
}

export const SUGGESTION_TEMPLATES: Record<string, string> = {
  逻辑自洽: "建议在作业中补充更清晰的因果链与论据，让观点前后一致、可验证。",
  情绪共鸣: "建议加入更具画面感的故事或细节，增强与读者的情感连接。",
  执行力: "建议将想法落实为可执行的小步骤或里程碑，体现落地能力。",
  结构化表达: "建议使用分段、小标题或列表，让内容层次更分明。",
  "OPC理念理解": "建议结合 OPC 手册中的核心理念，明确你的个人定位与交付价值。",
};
