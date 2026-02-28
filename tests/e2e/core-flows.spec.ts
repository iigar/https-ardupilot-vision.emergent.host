import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab, waitFor3DCanvas } from '../fixtures/helpers';

test.describe('Visual Homing - Core Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
  });

  test('App loads successfully with header and navigation', async ({ page }) => {
    // Check header
    const header = page.getByTestId('header');
    await expect(header).toBeVisible();
    
    // Check logo text
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Visual Homing');
    
    // Check version badge - updated to v2.0
    const versionBadge = page.locator('span:has-text("v2.0")');
    await expect(versionBadge).toBeVisible();
    
    // Check footer
    const footer = page.getByTestId('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('MIT License');
  });

  test('Navigation tabs are visible and 3D Map is active by default', async ({ page }) => {
    // Check all tabs are visible (including NEW Telemetry tab)
    await expect(page.getByTestId('tab-map')).toBeVisible();
    await expect(page.getByTestId('tab-history')).toBeVisible();
    await expect(page.getByTestId('tab-telemetry')).toBeVisible();  // NEW: Telemetry tab
    await expect(page.getByTestId('tab-docs')).toBeVisible();
    await expect(page.getByTestId('tab-firmware')).toBeVisible();
    await expect(page.getByTestId('tab-about')).toBeVisible();
    
    // 3D Map tab should be active by default - check for cyan-500 bg class instead of 'active'
    const mapTab = page.getByTestId('tab-map');
    await expect(mapTab).toHaveClass(/bg-cyan-500/);
  });

  test('Tab navigation works correctly', async ({ page }) => {
    // Click Docs tab
    await navigateToTab(page, 'tab-docs');
    await expect(page.getByTestId('docs-section')).toBeVisible();
    await expect(page.getByTestId('tab-docs')).toHaveClass(/bg-cyan-500/);
    
    // Click Firmware tab
    await navigateToTab(page, 'tab-firmware');
    await expect(page.getByTestId('firmware-section')).toBeVisible();
    await expect(page.getByTestId('tab-firmware')).toHaveClass(/bg-cyan-500/);
    
    // Click About tab
    await navigateToTab(page, 'tab-about');
    await expect(page.getByTestId('about-section')).toBeVisible();
    await expect(page.getByTestId('tab-about')).toHaveClass(/bg-cyan-500/);
    
    // Click History tab
    await navigateToTab(page, 'tab-history');
    await expect(page.getByTestId('history-section')).toBeVisible();
    await expect(page.getByTestId('tab-history')).toHaveClass(/bg-cyan-500/);
    
    // Click Telemetry tab (NEW)
    await navigateToTab(page, 'tab-telemetry');
    await expect(page.getByTestId('telemetry-section')).toBeVisible();
    await expect(page.getByTestId('tab-telemetry')).toHaveClass(/bg-cyan-500/);
    
    // Click back to Map tab
    await navigateToTab(page, 'tab-map');
    await expect(page.getByTestId('map-panel')).toBeVisible();
    await expect(page.getByTestId('tab-map')).toHaveClass(/bg-cyan-500/);
  });

  test('About section displays project information and specifications', async ({ page }) => {
    await navigateToTab(page, 'tab-about');
    
    const aboutSection = page.getByTestId('about-section');
    await expect(aboutSection).toBeVisible();
    
    // Check project title
    await expect(aboutSection).toContainText('Visual Homing System');
    
    // Check features grid - including NEW Smart RTL and Optical Flow features
    await expect(aboutSection).toContainText('Без GPS залежності');
    await expect(aboutSection).toContainText('Без компаса');
    await expect(aboutSection).toContainText('Teach & Repeat');
    await expect(aboutSection).toContainText('Термальна камера');
    await expect(aboutSection).toContainText('Smart RTL');  // NEW: Smart RTL feature
    await expect(aboutSection).toContainText('Optical Flow');  // NEW: Optical Flow feature
    
    // Check specifications table - including NEW sensor modules
    await expect(aboutSection).toContainText('Raspberry Pi Zero 2 W');
    await expect(aboutSection).toContainText('ArduCopter');
    await expect(aboutSection).toContainText('MAVLink');
    await expect(aboutSection).toContainText('Python 3');
    await expect(aboutSection).toContainText('C++17');
    await expect(aboutSection).toContainText('MATEK 3901-L0X');  // NEW: Optical Flow sensor
    await expect(aboutSection).toContainText('TF-Luna');  // NEW: LiDAR sensor
    await expect(aboutSection).toContainText('Matek H743-Slim V3');  // Flight controller
  });

  test('Documentation tab displays document list', async ({ page }) => {
    await navigateToTab(page, 'tab-docs');
    
    const docsSection = page.getByTestId('docs-section');
    await expect(docsSection).toBeVisible();
    
    // Check sidebar header text - now uses different structure
    await expect(page.locator('h2:has-text("Документи")')).toBeVisible();
    
    // Check that document items exist using buttons in sidebar
    const docItems = page.locator('button:has(svg)').filter({ has: page.locator('span') });
    const count = await docItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Click on first document button to verify content loads
    const firstDocButton = docsSection.locator('button').first();
    await firstDocButton.click();
    
    // Wait for content to load
    const docContent = page.getByTestId('doc-content');
    await expect(docContent).toBeVisible({ timeout: 10000 });
  });

  test('Route History tab displays correctly', async ({ page }) => {
    await navigateToTab(page, 'tab-history');
    
    const historySection = page.getByTestId('history-section');
    await expect(historySection).toBeVisible();
    
    // Check header text
    await expect(historySection).toContainText('Історія маршрутів');
    await expect(historySection).toContainText('Збережені записи польотів');
    
    // Either route-history list or empty state should be visible
    const hasRoutes = await page.getByTestId('route-history').isVisible().catch(() => false);
    if (!hasRoutes) {
      // Check empty state message
      await expect(historySection).toContainText('Немає збережених маршрутів');
    }
  });
});
