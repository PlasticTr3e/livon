"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { CctvCamera } from "@/lib/cctv/cameras";
import { CctvCameraGrid } from "./CctvCameraGrid";

const fieldClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-base text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-gray-700 dark:bg-[#111827] dark:text-white sm:text-sm";

export function CctvBrowser({ cameras }: { cameras: CctvCamera[] }) {
  const [query, setQuery] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");
  const search = query.trim().toLowerCase();
  const rwOptions = [...new Set(cameras.map((camera) => camera.rw))].sort(
    (a, b) => a.localeCompare(b, "en", { numeric: true }),
  );
  const rtOptions = [
    ...new Set(
      cameras
        .filter((camera) => !rw || camera.rw === rw)
        .map((camera) => camera.rt),
    ),
  ].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const filtered = cameras.filter(
    (camera) =>
      camera.name.toLowerCase().includes(search) &&
      (!rw || camera.rw === rw) &&
      (!rt || camera.rt === rt),
  );
  const hasFilters = Boolean(query || rw || rt);

  function clearFilters() {
    setQuery("");
    setRw("");
    setRt("");
  }

  return (
    <>
      <div className="mb-6">
        <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem]">
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="cctv-search"
              className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              Search cameras
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              />
              <input
                id="cctv-search"
                type="search"
                placeholder="Search by camera name..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={`${fieldClass} pl-10 pr-12 [&::-webkit-search-cancel-button]:hidden`}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear camera search"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-gray-400 dark:hover:text-green-400"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="cctv-rw"
              className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              RW
            </label>
            <select
              id="cctv-rw"
              value={rw}
              onChange={(event) => {
                setRw(event.target.value);
                setRt("");
              }}
              className={`${fieldClass} cursor-pointer`}
            >
              <option value="">All RWs</option>
              {rwOptions.map((value) => (
                <option key={value} value={value}>
                  RW {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="cctv-rt"
              className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              RT
            </label>
            <select
              id="cctv-rt"
              value={rt}
              onChange={(event) => setRt(event.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              <option value="">All RTs</option>
              {rtOptions.map((value) => (
                <option key={value} value={value}>
                  RT {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2 min-h-11 cursor-pointer rounded-lg px-2 text-sm font-semibold text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 && cameras.length > 0 ? (
        <div role="status" className="py-16 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto mb-3 h-7 w-7 text-gray-400"
          />
          <h2 className="font-bold text-gray-900 dark:text-white">
            No cameras found
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Try another camera name or change your RT/RW filters.
          </p>
        </div>
      ) : (
        <CctvCameraGrid cameras={filtered} />
      )}
    </>
  );
}
