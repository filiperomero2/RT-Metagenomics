import type { BackendLogEntry, BackendLogType } from "./types/backend";

export const MAX_BACKEND_LOG_LINES = 200;

export function stripBackendLogPrefix(line: string) {
  const withoutSystemPrefix = line.replace(/^\[system\]\s*/i, "");
  const withoutLevelPrefix = withoutSystemPrefix.replace(
    /^\s*(debug|info|warning|warn|error|critical|success)\s*:\s*/i,
    "",
  );

  return withoutLevelPrefix.trimStart() || withoutSystemPrefix.trimStart() || line;
}

export function getBackendLogType(line: string): BackendLogType {
  const normalizedLine = line.trimStart();

  if (/^\[system\]/i.test(normalizedLine)) {
    return "system";
  }

  if (/^(debug|\[debug\]|debug:)/i.test(normalizedLine)) {
    return "debug";
  }

  if (/^(warn|warning|\[warn(?:ing)?\]|warn(?:ing)?:)/i.test(normalizedLine)) {
    return "warning";
  }

  if (
    /^(error|critical|traceback|\[error\]|\[critical\]|error:|critical:)/i.test(
      normalizedLine,
    )
  ) {
    return "error";
  }

  if (/^(success|\[success\]|success:)/i.test(normalizedLine)) {
    return "success";
  }

  if (/^(info|\[info\]|info:)/i.test(normalizedLine)) {
    return "info";
  }

  return "info";
}

export function createBackendLogEntry(
  id: number,
  line: string,
): BackendLogEntry {
  return {
    id,
    type: getBackendLogType(line),
    line: stripBackendLogPrefix(line),
  };
}
