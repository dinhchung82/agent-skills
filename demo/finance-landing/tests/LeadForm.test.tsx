import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadForm, defaultLabels } from "@/components/LeadForm";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("LeadForm", () => {
  it("renders the 5 visible fields", () => {
    render(<LeadForm labels={defaultLabels} />);
    expect(screen.getByLabelText(defaultLabels.name)).toBeInTheDocument();
    expect(screen.getByLabelText(defaultLabels.email)).toBeInTheDocument();
    expect(screen.getByLabelText(defaultLabels.phone)).toBeInTheDocument();
    expect(
      screen.getByLabelText(defaultLabels.investmentRange),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(defaultLabels.timeframe)).toBeInTheDocument();
    expect(screen.getByLabelText(defaultLabels.consent)).toBeInTheDocument();
  });

  it("hides the honeypot field from users", () => {
    const { container } = render(<LeadForm labels={defaultLabels} />);
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="company_website"]',
    );
    expect(honeypot).not.toBeNull();
    expect(honeypot!.tabIndex).toBe(-1);
    expect(honeypot!.getAttribute("aria-hidden")).toBe("true");
  });

  it("disables submit until consent is checked", async () => {
    const user = userEvent.setup();
    render(<LeadForm labels={defaultLabels} />);
    const button = screen.getByRole("button", { name: defaultLabels.submit });
    expect(button).toBeDisabled();
    await user.click(screen.getByLabelText(defaultLabels.consent));
    expect(button).toBeEnabled();
  });

  it("submits the expected payload and shows success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, points: 90, tier: "hot" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<LeadForm labels={defaultLabels} formToken="signed-token" />);

    await user.type(screen.getByLabelText(defaultLabels.name), "An Nguyen");
    await user.type(screen.getByLabelText(defaultLabels.email), "an@gmail.com");
    await user.type(screen.getByLabelText(defaultLabels.phone), "0912345678");
    await user.selectOptions(
      screen.getByLabelText(defaultLabels.investmentRange),
      "over_1b",
    );
    await user.selectOptions(
      screen.getByLabelText(defaultLabels.timeframe),
      "within_1m",
    );
    await user.click(screen.getByLabelText(defaultLabels.consent));
    await user.click(
      screen.getByRole("button", { name: defaultLabels.submit }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/lead");
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload).toMatchObject({
      name: "An Nguyen",
      email: "an@gmail.com",
      phone: "0912345678",
      investmentRange: "over_1b",
      timeframe: "within_1m",
      consent: true,
      company_website: "",
      formToken: "signed-token",
    });

    expect(
      await screen.findByText(defaultLabels.successMessage),
    ).toBeInTheDocument();
  });
});
