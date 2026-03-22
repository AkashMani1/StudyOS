async function handleResponse(response: Response, url: string) {
  const isJson = response.headers.get("Content-Type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed for ${url}: ${response.status}`);
  }

  return data;
}

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

  return (await handleResponse(response, url)) as TResponse;
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

  return (await handleResponse(response, url)) as TResponse;
}

export async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url, {
    method: "GET"
  });

  return (await handleResponse(response, url)) as TResponse;
}
