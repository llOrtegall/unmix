export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE ?? "/api/v1",
  authBasePath: "/api/auth",
} as const;
