import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "cuenta_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getAuthConfig() {
  return {
    password: process.env.APP_PASSWORD,
    sessionSecret: process.env.APP_SESSION_SECRET,
  };
}

export function isPasswordProtectionEnabled() {
  const { password, sessionSecret } = getAuthConfig();
  return Boolean(password && sessionSecret);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function buildSessionToken(secret: string) {
  const payload = JSON.stringify({
    issuedAt: Date.now(),
  });

  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyPersonalSessionToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as {
      issuedAt?: number;
    };

    if (!payload.issuedAt) {
      return false;
    }

    const ageSeconds = (Date.now() - payload.issuedAt) / 1000;
    return ageSeconds < SESSION_MAX_AGE_SECONDS;
  } catch {
    return false;
  }
}

export async function hasValidPersonalSession() {
  if (!isPasswordProtectionEnabled()) {
    return true;
  }

  const { sessionSecret } = getAuthConfig();
  if (!sessionSecret) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return verifyPersonalSessionToken(token, sessionSecret);
}

export async function createPersonalSession() {
  const { sessionSecret } = getAuthConfig();

  if (!sessionSecret) {
    throw new Error("APP_SESSION_SECRET is not configured.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, buildSessionToken(sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearPersonalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function validateAppPassword(password: string) {
  const configuredPassword = process.env.APP_PASSWORD;

  if (!configuredPassword) {
    return true;
  }

  return safeEqual(password, configuredPassword);
}

export async function requirePersonalSession() {
  if (!(await hasValidPersonalSession())) {
    redirect("/login");
  }
}
