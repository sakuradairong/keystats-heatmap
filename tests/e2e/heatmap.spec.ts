import { expect, test, type Page } from "@playwright/test";

async function expectReady(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("viewer-ready")).toBeVisible();
  await expect(page.getByRole("heading", { name: /键盘使用频次/ })).toBeVisible();
}

test("loads the sanitized public keyboard dataset", async ({ page }) => {
  await expectReady(page);

  await expect(page.getByText("总按键次数")).toBeVisible();
  await expect(page.getByTestId("total-count")).not.toHaveText("0");
  await expect(page.getByText("未使用")).toBeVisible();
  await expect(page.locator("[data-key-id]")).toHaveCount(104);

  const payload = await page.evaluate(async () => {
    const response = await fetch("/keystats-public.json");
    return response.json();
  });
  expect(Object.keys(payload.currentStats).sort()).toEqual([
    "date",
    "keyPressCounts",
    "keyPresses",
  ]);
});

test("changes the authoritative daily total", async ({ page }) => {
  await expectReady(page);
  await page.getByTestId("date-select").selectOption("2026-08-02");
  await expect(page.getByTestId("total-count")).toHaveText("17,401");
});

test("keeps tooltip continuous while moving across neighboring keys", async ({
  page,
}) => {
  await expectReady(page);
  await page.locator(".keyboard-stage").scrollIntoViewIfNeeded();

  for (const id of ["A", "S", "D", "F"]) {
    const key = page.locator(`[data-key-id="${id}"]`);
    await key.hover();
    await expect(page.getByRole("tooltip")).toContainText(id);
  }

  const a = page.locator('[data-key-id="A"]');
  const s = page.locator('[data-key-id="S"]');
  const aBox = await a.boundingBox();
  const sBox = await s.boundingBox();
  expect(aBox).not.toBeNull();
  expect(sBox).not.toBeNull();

  await page.mouse.move(aBox!.x + aBox!.width / 2, aBox!.y + aBox!.height / 2);
  await expect(page.getByRole("tooltip")).toContainText("A");
  await page.mouse.move(
    (aBox!.x + aBox!.width + sBox!.x) / 2,
    aBox!.y + aBox!.height / 2,
    { steps: 12 }
  );
  await expect(page.getByRole("tooltip")).toBeVisible();
});

test("moves a pinned tooltip with keyboard focus", async ({ page }) => {
  await expectReady(page);
  const escapeKey = page.locator('[data-key-id="Esc"]');
  await escapeKey.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tooltip")).toContainText("Esc");

  await page.keyboard.press("Tab");
  await expect(page.locator('[data-key-id="F1"]')).toBeFocused();
  await expect(page.getByRole("tooltip")).toContainText("F1");
});

test("reports a corrupt primary dataset instead of hiding it with sample data", async ({
  page,
}) => {
  await page.route("**/keystats-public.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{",
    })
  );
  await page.goto("/");

  await expect(
    page.getByRole("alert").filter({ hasText: "数据没有加载成功" })
  ).toBeVisible();
  await expect(page.getByTestId("viewer-ready")).toHaveCount(0);
});

test("reports malformed imported JSON and offers recovery", async ({ page }) => {
  await expectReady(page);
  await page.getByTestId("file-input").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });

  await expect(
    page.getByRole("alert").filter({ hasText: "数据没有加载成功" })
  ).toContainText("数据没有加载成功");
  await expect(page.getByText("选择另一份 JSON")).toBeVisible();
});

test("keeps horizontal overflow inside the keyboard on mobile", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.endsWith("mobile"));
  await expectReady(page);

  const dimensions = await page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>(".keyboard-scroll")!;
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollClient: scroller.clientWidth,
      scrollWidth: scroller.scrollWidth,
    };
  });

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.scrollClient);

  const spaceKey = page.locator('[data-key-id="Space"]');
  await spaceKey.click();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await spaceKey.click();
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("keeps the keyboard reachable at the 1024px breakpoint", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  await page.setViewportSize({ width: 1024, height: 800 });
  await expectReady(page);

  const dimensions = await page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>(".keyboard-scroll")!;
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollClient: scroller.clientWidth,
      scrollWidth: scroller.scrollWidth,
    };
  });

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.scrollClient);
});
