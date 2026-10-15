import { expect, test, type Page } from "@playwright/test";
import { findRetiredCopy } from "../support/retired-copy";

// Skip the preloader except in the test that covers it.
async function visit(page: Page, path = "/") {
  await page.addInitScript(() => sessionStorage.setItem("fc-loaded", "1"));
  await page.goto(path);
}

test.describe("page", () => {
  test("loads without console errors and with core content", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await visit(page);
    await expect(page).toHaveTitle(/Fresh Can/);
    await expect(page.locator("h1")).toContainText("100% coco");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await page.waitForTimeout(800);
    expect(errors).toEqual([]);
  });

  test("has no third-party or placeholder copy and no prices in the rendered page", async ({ page }) => {
    await visit(page);
    const text = await page.locator("body").innerText();
    expect(findRetiredCopy(text)).toEqual([]);
    expect(findRetiredCopy(await page.content())).toEqual([]);
    expect(text).not.toMatch(/\$\d/);
  });

  test("has no horizontal overflow", async ({ page }) => {
    await visit(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("every image has alt text and loads", async ({ page }) => {
    await visit(page);
    const missingAlt = await page.locator("img:not([alt])").count();
    expect(missingAlt).toBe(0);
    // Scroll through so lazy images load
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(60);
    }
    await page.waitForLoadState("networkidle");
    const broken = await page.evaluate(() =>
      [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== "lazy").map((i) => i.currentSrc),
    );
    expect(broken).toEqual([]);
  });

  test("external links point at real brand destinations", async ({ page }) => {
    await visit(page);
    const hrefs = await page.locator("a[href^='http']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThan(5);
    for (const h of hrefs) expect(h).toMatch(/^https:\/\/(wa\.me\/593939941356|www\.instagram\.com\/|www\.google\.com\/maps\/)/);
  });
});

test.describe("navigation", () => {
  test("menu opens, traps focus, closes with Escape", async ({ page }) => {
    await visit(page);
    const toggle = page.locator("[data-menu-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#menu")).toBeVisible();
    await expect(page.locator("#menu a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#menu")).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("menu link jumps to its section", async ({ page }) => {
    await visit(page);
    await page.locator("[data-menu-toggle]").click();
    await page.locator("#menu a[href='#ruta-fresh']").click();
    await expect(page.locator("#menu")).toBeHidden({ timeout: 10_000 });
    await expect
      .poll(async () => page.evaluate(() => Math.abs(document.getElementById("ruta-fresh")!.getBoundingClientRect().top)), { timeout: 10_000 })
      .toBeLessThan(5);
    await expect(page).toHaveURL(/#ruta-fresh$/);
  });

  test("direct load of a hash lands on the section", async ({ page }) => {
    await visit(page, "/#formatos");
    await page.waitForTimeout(600);
    const top = await page.evaluate(() => document.getElementById("formatos")!.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(5);
  });
});

test.describe("ordering", () => {
  test("format popover builds a WhatsApp order", async ({ page }) => {
    await visit(page);
    const card = page.locator("[data-format='330']");
    await card.scrollIntoViewIfNeeded();
    const toggle = card.locator("[data-order-toggle]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const pop = card.locator("[data-order-pop]");
    await expect(pop).toBeVisible();
    await pop.locator("[data-qty='1']").click();
    await expect(pop.locator("[data-qty-value]")).toHaveText("2");
    const href = await pop.locator("[data-order-link]").getAttribute("href");
    expect(decodeURIComponent(href!.split("text=")[1]!)).toContain("2 latas de 330 ml");
    await page.keyboard.press("Escape");
    await expect(pop).toBeHidden();
  });

  test("only one popover is open at a time", async ({ page }) => {
    await visit(page);
    await page.locator("[data-format='250'] [data-order-toggle]").click();
    await page.locator("[data-format='500'] [data-order-toggle]").click();
    await expect(page.locator("[data-order-pop]:visible")).toHaveCount(1);
  });

  test("format carousel switches size and order link", async ({ page }) => {
    await visit(page);
    const box = page.locator("[data-carousel]");
    await box.scrollIntoViewIfNeeded();
    await expect(box.locator("[data-carousel-ml]")).toHaveText("330");
    await box.locator("[data-carousel-next]").click();
    await expect(box.locator("[data-carousel-ml]")).toHaveText("500");
    expect(decodeURIComponent((await box.locator("[data-carousel-order]").getAttribute("href"))!)).toContain("500 ml");
  });
});

test.describe("motion", () => {
  test("preloader runs on first visit then reveals the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/is-loading/);
    await expect(page.locator("html")).not.toHaveClass(/is-loading/, { timeout: 8000 });
    await expect(page.locator("[data-hero]")).toHaveClass(/is-in/);
  });

  test("reduced motion skips the loader and pins nothing", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/is-loading/);
    await expect(page.locator("html")).toHaveClass(/static-scene/);
    await expect(page.locator("[data-badge]").first()).toBeVisible();
    await ctx.close();
  });

  test("footer game shows a crosshair cursor over the slicing area", async ({ page }) => {
    await visit(page);
    const game = page.locator("[data-game]");
    await expect(game).toHaveCSS("cursor", "crosshair");
  });

  test("manifesto word rotates", async ({ page }) => {
    await visit(page);
    const rot = page.locator("[data-rotator]");
    await rot.scrollIntoViewIfNeeded();
    const first = await rot.locator(".is-active").innerText();
    await expect.poll(async () => rot.locator(".is-active").innerText(), { timeout: 5000 }).not.toBe(first);
  });
});
