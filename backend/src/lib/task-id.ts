export function parsePositiveIntegerId(value: string | string[] | undefined): number | null {
  const rawId = Array.isArray(value) ? value[0] : value;

  if (!rawId || !/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const taskId = Number(rawId);
  return Number.isSafeInteger(taskId) ? taskId : null;
}