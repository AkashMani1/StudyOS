export async function postJson<TRequest, TResponse>(
  url: string,
  payload: TRequest
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function patchJson<TRequest, TResponse>(
  url: string,
  payload: TRequest
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url, {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}
