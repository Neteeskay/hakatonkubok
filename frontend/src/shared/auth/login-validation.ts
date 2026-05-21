const DEMO_ADMIN_USERNAME = "admin";
const DEMO_ADMIN_EMAIL = "admin@stoloto.local";
const DEMO_ADMIN_PASSWORD = "admin";

export function isDemoAdminCredentials(login: string, password: string): boolean {
  const loginValue = login.trim().toLowerCase();
  return (
    (loginValue === DEMO_ADMIN_USERNAME || loginValue === DEMO_ADMIN_EMAIL) &&
    password === DEMO_ADMIN_PASSWORD
  );
}

export function isLoginIdentifierValid(login: string): boolean {
  const value = login.trim();
  if (!value) {
    return false;
  }
  if (value.toLowerCase() === DEMO_ADMIN_USERNAME || value.toLowerCase() === DEMO_ADMIN_EMAIL) {
    return true;
  }
  return value.includes("@");
}

export function isLoginPasswordValid(login: string, password: string): boolean {
  if (!password) {
    return false;
  }
  if (isDemoAdminCredentials(login, password)) {
    return true;
  }
  return password.length >= 6;
}
