/** Lead scoring — hàm thuần. Điểm theo mức đầu tư + khung thời gian dự kiến. */

export type InvestmentRange =
  | "under_100m" // < 100 triệu
  | "100m_500m" // 100 – 500 triệu
  | "500m_1b" // 500 triệu – 1 tỷ
  | "over_1b"; // > 1 tỷ

export type Timeframe =
  | "within_1m" // trong 1 tháng
  | "1_3m" // 1 – 3 tháng
  | "3_6m" // 3 – 6 tháng
  | "over_6m"; // trên 6 tháng

export type LeadTier = "hot" | "warm" | "cold";

export interface LeadAnswers {
  investmentRange: InvestmentRange;
  timeframe: Timeframe;
}

export interface LeadScore {
  points: number;
  tier: LeadTier;
}

const INVESTMENT_POINTS: Record<InvestmentRange, number> = {
  under_100m: 10,
  "100m_500m": 30,
  "500m_1b": 45,
  over_1b: 60,
};

// Càng định đầu tư sớm → lead càng nóng.
const TIMEFRAME_POINTS: Record<Timeframe, number> = {
  within_1m: 30,
  "1_3m": 20,
  "3_6m": 10,
  over_6m: 0,
};

/** Danh sách hợp lệ — nguồn sự thật duy nhất. */
export const INVESTMENT_RANGES = Object.keys(
  INVESTMENT_POINTS,
) as InvestmentRange[];
export const TIMEFRAMES = Object.keys(TIMEFRAME_POINTS) as Timeframe[];

/** Type guard: giá trị client gửi có phải mức đầu tư hợp lệ không. */
export function isInvestmentRange(value: unknown): value is InvestmentRange {
  return (
    typeof value === "string" &&
    (INVESTMENT_RANGES as string[]).includes(value)
  );
}

/** Type guard: giá trị client gửi có phải khung thời gian hợp lệ không. */
export function isTimeframe(value: unknown): value is Timeframe {
  return typeof value === "string" && (TIMEFRAMES as string[]).includes(value);
}

export function tierForPoints(points: number): LeadTier {
  if (points >= 70) return "hot";
  if (points >= 40) return "warm";
  return "cold";
}

export function scoreLead(answers: LeadAnswers): LeadScore {
  const points =
    (INVESTMENT_POINTS[answers.investmentRange] ?? 0) +
    (TIMEFRAME_POINTS[answers.timeframe] ?? 0);
  return { points, tier: tierForPoints(points) };
}
