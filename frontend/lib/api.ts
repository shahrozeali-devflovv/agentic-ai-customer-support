const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not configured",
  );
}

type ApiOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    token,
    headers,
    body,
    ...requestOptions
  } = options;

  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...requestOptions,
      body,
      headers: {
        ...(!isFormData
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...headers,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Something went wrong",
    );
  }

  return data as T;
}