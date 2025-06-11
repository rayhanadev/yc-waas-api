import { load } from "cheerio";

export class WaaSClient {
  protected csrfToken = "";
  protected sessionToken = "";

  async init() {
    const res = await fetch("https://www.workatastartup.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();
    const $ = load(html);
    const token = $('meta[name="csrf-token"]').attr("content") ?? null;

    if (!token) {
      throw new Error("Could not get CSRF token!");
    }

    this.csrfToken = token;

    const setCookie = res.headers.getSetCookie?.() ?? [];
    const bfCookie = setCookie.find((c) => c.startsWith("_bf_session_key="));
    if (bfCookie) {
      this.sessionToken = bfCookie;
    }
  }

  async refreshCSRF() {
    const res = await fetch("https://www.workatastartup.com/verify-session", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-CSRF-Token": this.csrfToken,
        Cookie: this.sessionToken,
      },
    });

    const token = res.status === 422 ? (await res.text()).trim() : null;

    if (!token) {
      throw new Error("Could not get CSRF token!");
    }

    this.csrfToken = token;
  }

  async fetch(path: string, init: RequestInit) {
    let res = await fetch(`https://www.workatastartup.com${path}`, {
      ...init,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-CSRF-Token": this.csrfToken,
        "Content-Type": "application/json",
        Cookie: this.sessionToken,
      },
    });

    if (res.status === 422) {
      await this.refreshCSRF();
      res = await fetch(`https://www.workatastartup.com${path}`, {
        ...init,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "X-CSRF-Token": this.csrfToken,
          "Content-Type": "application/json",
          Cookie: this.sessionToken,
        },
      });
    }

    return res;
  }
}
