/**
 * PolSpeak API client.
 *
 * Every function talks to the API gateway under `/api/v1`. The types in these modules are
 * the contract the backend services must implement (see `docs/ROADMAP.md`).
 */

export * from "./http";
export * from "./auth";
export * from "./students";
export * from "./groups";
export * from "./schedule";
export * from "./content";
export * from "./media";
export * from "./homework";
export * from "./assignments";
export * from "./messages";
