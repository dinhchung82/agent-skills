/** Lead scoring — hàm thuần. Điểm theo mức đầu tư + thưởng SĐT hợp lệ. */

export type InvestmentRange =
  | "under_100m" // < 100 triệu
  | "100m_500m" // 100 – 500 triệu
  | "500m_1b" // 500 triệu – 1 tỷ
  | "over_1b"; // > 1 tỷ

export type LeadTier = "hot" | "warm" | "cold";

export interface LeadAnswers {
  investmentRange: InvestmentRange;
  validPhone: boolean;
}

export interface LeadScore {
  points: number;
  tier: LeadTier;
}

const INVESTMENT_POINTS: Record<InvestmentRange, number> = {
  under_100m: 10,
  "100m_500m": 30,
  "500m_1b": 55,
  over_1b: 75,
};

const PHONE_BONUS = 15;

export function tierForPoints(points: number): LeadTier {
  if (points >= 70) return "hot";
  if (points >= 40) return "warm";
  return "cold";
}

export function scoreLead(answers: LeadAnswers): LeadScore {
  let points = INVESTMENT_POINTS[answers.investmentRange] ?? 0;
  if (answers.validPhone) points += PHONE_BONUS;
  return { points, tier: tierForPoints(points) };
}
