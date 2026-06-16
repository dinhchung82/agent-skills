"use client";

import { useState } from "react";

export interface LeadFormLabels {
  name: string;
  email: string;
  phone: string;
  investmentRange: string;
  investmentOptions: { value: string; label: string }[];
  timeframe: string;
  timeframeOptions: { value: string; label: string }[];
  consent: string;
  submit: string;
  submitting: string;
  successMessage: string;
  errorMessage: string;
}

export const defaultLabels: LeadFormLabels = {
  name: "Họ tên",
  email: "Email",
  phone: "Số điện thoại",
  investmentRange: "Mức đầu tư dự kiến",
  investmentOptions: [
    { value: "under_100m", label: "Dưới 100 triệu" },
    { value: "100m_500m", label: "100 – 500 triệu" },
    { value: "500m_1b", label: "500 triệu – 1 tỷ" },
    { value: "over_1b", label: "Trên 1 tỷ" },
  ],
  timeframe: "Dự kiến đầu tư trong",
  timeframeOptions: [
    { value: "within_1m", label: "Trong 1 tháng" },
    { value: "1_3m", label: "1 – 3 tháng" },
    { value: "3_6m", label: "3 – 6 tháng" },
    { value: "over_6m", label: "Trên 6 tháng" },
  ],
  consent: "Tôi đồng ý được liên hệ và xử lý thông tin của tôi",
  submit: "Đăng ký tư vấn",
  submitting: "Đang gửi...",
  successMessage: "Cảm ơn bạn! Chúng tôi sẽ liên hệ trong thời gian sớm nhất.",
  errorMessage: "Gửi không thành công. Vui lòng kiểm tra lại thông tin.",
};

type Status = "idle" | "submitting" | "success" | "error";

export function LeadForm({
  labels = defaultLabels,
  formToken = "",
}: {
  labels?: LeadFormLabels;
  formToken?: string;
}) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      investmentRange: String(data.get("investmentRange") ?? ""),
      timeframe: String(data.get("timeframe") ?? ""),
      consent,
      company_website: String(data.get("company_website") ?? ""),
      formToken,
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="name">{labels.name}</label>
        <input id="name" name="name" type="text" required className="border p-2 rounded" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email">{labels.email}</label>
        <input id="email" name="email" type="email" required className="border p-2 rounded" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone">{labels.phone}</label>
        <input id="phone" name="phone" type="tel" required className="border p-2 rounded" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="investmentRange">{labels.investmentRange}</label>
        <select id="investmentRange" name="investmentRange" required className="border p-2 rounded" defaultValue="">
          <option value="" disabled>
            —
          </option>
          {labels.investmentOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="timeframe">{labels.timeframe}</label>
        <select id="timeframe" name="timeframe" required className="border p-2 rounded" defaultValue="">
          <option value="" disabled>
            —
          </option>
          {labels.timeframeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Honeypot: ẩn khỏi người dùng thật, bot có xu hướng điền vào. */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
      />

      <div className="flex items-start gap-2">
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <label htmlFor="consent">{labels.consent}</label>
      </div>

      <button
        type="submit"
        disabled={!consent || status === "submitting"}
        className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {status === "submitting" ? labels.submitting : labels.submit}
      </button>

      {status === "success" && (
        <p role="status" className="text-green-600">
          {labels.successMessage}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-red-600">
          {labels.errorMessage}
        </p>
      )}
    </form>
  );
}
