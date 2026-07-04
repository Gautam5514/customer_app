// Holds a "post-login intent" — where a guest was headed before we asked them
// to sign in. The root navigator consumes this once the session is set so the
// user resumes exactly where they left off (e.g. straight into checkout).
let pending = null;

export function setPostLogin(target) {
  pending = target || null;
}

export function takePostLogin() {
  const t = pending;
  pending = null;
  return t;
}
