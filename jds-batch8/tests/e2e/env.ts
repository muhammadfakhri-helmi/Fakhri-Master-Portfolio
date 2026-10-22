import { tmpdir } from "node:os";
import { join } from "node:path";

// Everything the end-to-end tests create lives outside the repository.
export const E2E_DIR = join(tmpdir(), "jds-b8-e2e");
export const SITE_PORT = 5290;
export const REVIEWER_PORT = 5299;
/** Same sub-path as the real deployment: <user>.github.io/Fakhri-Master-Portfolio/jds-batch8/ */
export const BASE_PATH = "/Fakhri-Master-Portfolio/jds-batch8/";
export const SITE_URL = `http://127.0.0.1:${SITE_PORT}${BASE_PATH}`;
export const REVIEWER_URL = `http://127.0.0.1:${REVIEWER_PORT}/`;
export const paths = {
  site: join(E2E_DIR, "site"),
  reviewerData: join(E2E_DIR, "reviewer-data"),
  files: join(E2E_DIR, "files"),
};
