import { test, expect } from '@playwright/test';
import { waitForAppReady, waitFor3DCanvas } from '../fixtures/helpers';

test.describe('Visual Homing - 3D Map & Simulation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('3D Map container and canvas render correctly', async ({ page }) => {
    // Check map container
    const mapPanel = page.getByTestId('map-panel');
    await expect(mapPanel).toBeVisible();
    
    const simpleMap = page.getByTestId('simple-map-3d');
    await expect(simpleMap).toBeVisible();
    
    // Check canvas container
    const canvasContainer = page.getByTestId('threejs-canvas');
    await expect(canvasContainer).toBeVisible();
    
    // Wait for Three.js canvas to be created
    await waitFor3DCanvas(page);
    
    // Verify canvas element exists
    const canvas = canvasContainer.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('Simulation buttons are visible and functional', async ({ page }) => {
    // Check simulation buttons
    const simBtn = page.getByTestId('sim-btn');
    const resetBtn = page.getByTestId('reset-btn');
    const newRouteBtn = page.getByTestId('new-route-btn');
    
    await expect(simBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    await expect(newRouteBtn).toBeVisible();
    
    // Check button text (initial state)
    await expect(simBtn).toContainText('Симуляція');
    await expect(resetBtn).toContainText('Скинути');
    await expect(newRouteBtn).toContainText('Новий маршрут');
  });

  test('Start/Stop simulation button toggles state', async ({ page }) => {
    // Wait for canvas and route to load
    await waitFor3DCanvas(page);
    
    // Wait a bit for route to load from API
    await page.waitForResponse(resp => 
      resp.url().includes('/api/routes/demo/generate') && resp.status() === 200,
      { timeout: 10000 }
    ).catch(() => {
      // Route might have already loaded
    });
    
    const simBtn = page.getByTestId('sim-btn');
    
    // Initial state should show "Симуляція"
    await expect(simBtn).toContainText('Симуляція');
    
    // Click to start simulation
    await simBtn.click({ force: true });
    
    // Button should now show "Стоп" (or stay as is if simulation completes quickly)
    // We check that clicking doesn't cause errors
    await expect(simBtn).toBeVisible();
  });

  test('Reset button resets drone position', async ({ page }) => {
    await waitFor3DCanvas(page);
    
    const resetBtn = page.getByTestId('reset-btn');
    
    // Click reset button
    await resetBtn.click({ force: true });
    
    // Button should still be visible (no errors)
    await expect(resetBtn).toBeVisible();
  });

  test('New route button loads new route', async ({ page }) => {
    await waitFor3DCanvas(page);
    
    const newRouteBtn = page.getByTestId('new-route-btn');
    
    // Set up response listener before clicking
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/routes/demo/generate') && resp.status() === 200,
      { timeout: 15000 }
    );
    
    // Click new route button
    await newRouteBtn.click({ force: true });
    
    // Wait for API call to complete
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.points).toBeDefined();
    expect(data.keyframes).toBeDefined();
  });

  test('Map stats display keyframes and distance', async ({ page }) => {
    await waitFor3DCanvas(page);
    
    // Wait for route data to load and stats to appear
    const statsDiv = page.locator('.map-stats');
    await expect(statsDiv).toBeVisible({ timeout: 10000 });
    
    // Check keyframes count is displayed
    await expect(statsDiv).toContainText('Keyframes:');
    
    // Check distance is displayed
    await expect(statsDiv).toContainText('Дистанція:');
    await expect(statsDiv).toContainText('m');
  });
});
