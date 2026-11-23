"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useState } from "react";
import { ChevronDown, Cctv, Search, X } from "lucide-react";
import { FeaturePageHeader } from "@/components/shared/FeaturePageHeader";
import type { CctvCamera } from "@/lib/cctv/cameras";
import { CctvCameraGrid } from "./CctvCameraGrid";

const fieldClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white text-base text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:bg-[#111827] dark:text-white sm:text-sm";
const selectClass = `${fieldClass} cursor-pointer appearance-none pl-3 pr-8 font-semibold`;
const selectIconClass =
  "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400";

export function CctvBrowser({ cameras }: { cameras: CctvCamera[] }) {
  const { t: translateUi } = useLanguage();

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
      (camera.name.toLowerCase().includes(search) ||
        translateUi(camera.name).toLowerCase().includes(search)) &&
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
      <FeaturePageHeader
        title="CCTV"
        icon={Cctv}
        description={translateUi(
          "A closer look at your neighborhood. Select a camera to watch.",
        )}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem] md:grid-cols-[11.5rem_7.5rem_7.5rem] lg:grid-cols-[13rem_8rem_8rem]">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="cctv-search" className="sr-only">
              {translateUi("Search cameras")}
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
              />
              <input
                id="cctv-search"
                type="search"
                placeholder={translateUi("Cari kamera...")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={`${fieldClass} pl-9 ${query ? "pr-10" : "pr-3"} placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden`}
              />
              {query && (
                <button
                  type="button"
                  aria-label={translateUi("Clear camera search")}
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-0 flex h-11 w-10 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-gray-400 dark:hover:text-green-400"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <label htmlFor="cctv-rw" className="sr-only">
              {translateUi("RW")}
            </label>
            <select
              id="cctv-rw"
              value={rw}
              onChange={(event) => {
                setRw(event.target.value);
                setRt("");
              }}
              className={selectClass}
            >
              <option value="">{translateUi("All RWs")}</option>
              {rwOptions.map((value) => (
                <option key={value} value={value}>
                  {translateUi("RW ")}
                  {value}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className={selectIconClass} />
          </div>
          <div className="relative">
            <label htmlFor="cctv-rt" className="sr-only">
              {translateUi("RT")}
            </label>
            <select
              id="cctv-rt"
              value={rt}
              onChange={(event) => setRt(event.target.value)}
              className={selectClass}
            >
              <option value="">{translateUi("All RTs")}</option>
              {rtOptions.map((value) => (
                <option key={value} value={value}>
                  {translateUi("RT ")}
                  {value}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className={selectIconClass} />
          </div>
        </div>
      </FeaturePageHeader>
      {hasFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2 min-h-11 cursor-pointer rounded-lg px-2 text-sm font-semibold text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            {translateUi("Clear filters")}
          </button>
        </div>
      )}

      <div className="mt-6">
        {filtered.length === 0 && cameras.length > 0 ? (
          <div role="status" className="py-16 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto mb-3 h-7 w-7 text-gray-400"
            />
            <h2 className="font-bold text-gray-900 dark:text-white">
              {translateUi("No cameras found")}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {translateUi(
                "Try another camera name or change your RT/RW filters.",
              )}
            </p>
          </div>
        ) : (
          <CctvCameraGrid cameras={filtered} />
        )}
      </div>
    </>
  );
}
