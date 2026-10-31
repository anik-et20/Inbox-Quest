export async function safeFetchJson<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  const text = await response.text();
  let data: { error?: string; code?: string } | T;

  try {
    data = text ? JSON.parse(text) as T : {};
  } catch {
    throw new Error(`Request failed with status ${response.status}: server returned invalid JSON`);
  }

  if (!response.ok) {
    const error = typeof data === "object" && data !== null && "error" in data
      ? String((data as { error?: string }).error || "Request failed")
      : "Request failed";
    const code = typeof data === "object" && data !== null && "code" in data
      ? String((data as { code?: string }).code || "")
      : "";
    throw new Error(`Request failed with status ${response.status}${code ? ` [${code}]` : ""}: ${error}`);
  }

  return data as T;
}
