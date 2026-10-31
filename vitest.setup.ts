import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { logger } from "@/lib/logger";

vi.spyOn(logger, "debug").mockImplementation(() => {});
vi.spyOn(logger, "info").mockImplementation(() => {});
vi.spyOn(logger, "warn").mockImplementation(() => {});
