const buildHeaders = (token, isFormData) => {
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const apiconnector = async ({ method = "GET", url, body, token }) => {
  let response;
  const isFormData = body instanceof FormData;

  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(token, isFormData),
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Run npm run dev and ensure the backend is running on PORT 5000."
    );
      }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
};

