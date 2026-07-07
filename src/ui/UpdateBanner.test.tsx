// @vitest-environment jsdom
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const checkMock = vi.fn();
vi.mock("@tauri-apps/plugin-updater", () => ({ check: (...args: unknown[]) => checkMock(...args) }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: vi.fn() }));

import { UpdateBanner } from "./UpdateBanner";

afterEach(() => {
  cleanup();
  checkMock.mockReset();
});

test("renders nothing when no update is available", async () => {
  checkMock.mockResolvedValue(null);
  const { container } = render(<UpdateBanner />);
  await waitFor(() => expect(checkMock).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});

test("renders nothing when the check fails (offline)", async () => {
  checkMock.mockRejectedValue(new Error("no network"));
  const { container } = render(<UpdateBanner />);
  await waitFor(() => expect(checkMock).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});

test("offers the update with notes, and Later dismisses it", async () => {
  checkMock.mockResolvedValue({ version: "0.9.9", body: "Fixes and polish." });
  render(<UpdateBanner />);
  expect(await screen.findByText(/v0\.9\.9 is available/)).toBeInTheDocument();
  expect(screen.getByText("Fixes and polish.")).toBeInTheDocument();
  expect(screen.getByText(/songs and saved projects are untouched/)).toBeInTheDocument();
  fireEvent.click(screen.getByText("Later"));
  expect(screen.queryByText(/is available/)).not.toBeInTheDocument();
});

test("a failed download shows the manual fallback and a retry", async () => {
  checkMock.mockResolvedValue({
    version: "0.9.9",
    body: "",
    downloadAndInstall: vi.fn().mockRejectedValue(new Error("boom")),
  });
  render(<UpdateBanner />);
  fireEvent.click(await screen.findByText("Update now"));
  expect(await screen.findByText(/couldn't be downloaded/)).toBeInTheDocument();
  expect(screen.getByText(/releases/)).toBeInTheDocument();
  expect(screen.getByText("Try again")).toBeInTheDocument();
});
