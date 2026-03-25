"use client";

import { SyntheticEvent, useState } from "react";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import { isApiSuccess } from "@/lib/api-types";

type ProjectRecord = {
  id: string;
  title: string;
  description: string;
  budgetTarget: string | number | null;
  latitude: number | null;
  longitude: number | null;
  agencyId: string | null;
  categoryId: number | null;
  createdAt: string;
};

type CreateProjectPayload = {
  title: string;
  description: string;
  budgetTarget: number;
  latitude: number;
  longitude: number;
  agencyId: string;
  categoryId: number;
};

export default function Home() {
  const [projectId, setProjectId] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Ready to test GET and POST /api/projects",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<ProjectRecord | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetTarget, setBudgetTarget] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [categoryId, setcategoryId] = useState("");

  async function handleGetProject(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (!projectId.trim()) {
      setStatusMessage("Project ID is required.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Fetching project...");

    const response = await apiFetch<ProjectRecord>(
      `/api/projects?id=${encodeURIComponent(projectId.trim())}`,
    );

    if (isApiSuccess(response)) {
      setProject(response.data ?? null);
      setStatusMessage(response.message);
    } else {
      setProject(null);
      setStatusMessage(response.message);
    }

    setIsLoading(false);
  }

  async function handleCreateProject(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    const budgetValue = Number.parseFloat(budgetTarget);
    const latitudeValue = Number.parseFloat(latitude);
    const longitudeValue = Number.parseFloat(longitude);
    const categoryIdValue = Number.parseInt(categoryId);

    if (
      !title.trim() ||
      !description.trim() ||
      !agencyId.trim() ||
      Number.isNaN(budgetValue) ||
      Number.isNaN(latitudeValue) ||
      Number.isNaN(longitudeValue) ||
      Number.isNaN(categoryIdValue)
    ) {
      setStatusMessage("Please fill all POST fields with valid values.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Creating project...");

    const payload: CreateProjectPayload = {
      title: title.trim(),
      description: description.trim(),
      budgetTarget: budgetValue,
      latitude: latitudeValue,
      longitude: longitudeValue,
      agencyId: agencyId.trim(),
      categoryId: categoryIdValue,
    };

    const response = await apiFetchJson<CreateProjectPayload, ProjectRecord>(
      "/api/projects",
      "POST",
      payload,
    );

    if (isApiSuccess(response)) {
      setProject(response.data ?? null);
      if (response.data?.id) {
        setProjectId(response.data.id);
      }
      setStatusMessage(response.message);
    } else {
      setStatusMessage(response.message);
    }

    setIsLoading(false);
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Project API Tester</h1>
      <p>Use this page to test GET and POST for /api/projects.</p>

      <form
        onSubmit={handleGetProject}
        style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}
      >
        <h2>GET /api/projects?id=...</h2>
        <input
          type="text"
          placeholder="Project ID"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Project"}
        </button>
      </form>

      <form
        onSubmit={handleCreateProject}
        style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}
      >
        <h2>POST /api/projects</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
        <input
          type="number"
          placeholder="Budget target"
          value={budgetTarget}
          onChange={(event) => setBudgetTarget(event.target.value)}
        />
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={latitude}
          onChange={(event) => setLatitude(event.target.value)}
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={longitude}
          onChange={(event) => setLongitude(event.target.value)}
        />
        <input
          type="text"
          placeholder="Agency User ID (UUID)"
          value={agencyId}
          onChange={(event) => setAgencyId(event.target.value)}
        />
        <input
          type="number"
          placeholder="Category ID (INT)"
          value={categoryId}
          onChange={(event) => setcategoryId(event.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Create Project"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>{statusMessage}</p>

      {project && (
        <pre
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "0.5rem",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(project, null, 2)}
        </pre>
      )}
    </main>
  );
}
