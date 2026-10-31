import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
import { LandingPage } from "@/components/LandingPage";
expect.extend(toHaveNoViolations);

describe("landing page accessibility smoke tests", () => {
  it("renders the primary game heading and demo control", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { name: /play the game/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play demo/i })).toBeInTheDocument();
  });
  it("has no automated axe violations", async () => {
    const { container } = render(<LandingPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
