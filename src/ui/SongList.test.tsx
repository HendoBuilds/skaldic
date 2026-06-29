// @vitest-environment jsdom
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SongList } from "./SongList";

// Unmount each render so trees from earlier tests don't accumulate in the document.
afterEach(cleanup);

test("renders songs and fires onRemove with the right name", () => {
  const onRemove = vi.fn();
  render(<SongList songs={["Alpha", "Beta"]} onRemove={onRemove} />);
  expect(screen.getByText("Alpha")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Remove Beta"));
  expect(onRemove).toHaveBeenCalledWith("Beta");
});

test("shows an empty state with no songs", () => {
  render(<SongList songs={[]} onRemove={() => {}} />);
  expect(screen.getByText(/songbook is empty/i)).toBeInTheDocument();
});

test("filters the list by the search query (case-insensitive)", () => {
  render(
    <SongList songs={["Greensleeves", "Mama I'm Coming Home", "Through the Fire"]} onRemove={() => {}} />,
  );
  const search = screen.getByLabelText("Search your songs");
  fireEvent.change(search, { target: { value: "mama" } });
  expect(screen.getByText("Mama I'm Coming Home")).toBeInTheDocument();
  expect(screen.queryByText("Greensleeves")).not.toBeInTheDocument();
  // a query with no matches shows the no-match message
  fireEvent.change(search, { target: { value: "zzz" } });
  expect(screen.getByText(/no songs match/i)).toBeInTheDocument();
});
