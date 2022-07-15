import { DateTime } from "luxon";

export const appVersion = process.env.VERCEL_GIT_COMMIT_SHA;
export const releaseHash = process.env.VERCEL_GIT_COMMIT_SHA;
export const buildDate = new Date().getTime();

export function getFormattedBuildDate(): string | undefined {
  if (!buildDate) return undefined;
  return DateTime.fromMillis(buildDate).toLocaleString(DateTime.DATE_FULL);
}
