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
    
    // Check version badge
    const version = page.locator('.version');
    await expect(version).toContainText('v1.0');
    
    // Check footer
    const footer = page.getByTestId('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('MIT License');
  });

  test('Navigation tabs are visible and 3D Map is active by default', async ({ page }) => {
    // Check all tabs are visible
    await expect(page.getByTestId('tab-map')).toBeVisible();
    await expect(page.getByTestId('tab-docs')).toBeVisible();
    await expect(page.getByTestId('tab-firmware')).toBeVisible();
    await expect(page.getByTestId('tab-about')).toBeVisible();
    
    // 3D Map tab should be active by default
    const mapTab = page.getByTestId('tab-map');
    await expect(mapTab).toHaveClass(/active/);
  });

  test('Tab navigation works correctly', async ({ page }) => {
    // Click Docs tab
    await navigateToTab(page, 'tab-docs');
    await expect(page.getByTestId('docs-section')).toBeVisible();
    await expect(page.getByTestId('tab-docs')).toHaveClass(/active/);
    
    // Click Firmware tab
    await navigateToTab(page, 'tab-firmware');
    await expect(page.getByTestId('firmware-section')).toBeVisible();
    await expect(page.getByTestId('tab-firmware')).toHaveClass(/active/);
    
    // Click About tab
    await navigateToTab(page, 'tab-about');
    await expect(page.getByTestId('about-section')).toBeVisible();
    await expect(page.getByTestId('tab-about')).toHaveClass(/active/);
    
    // Click back to Map tab
    await navigateToTab(page, 'tab-map');
    await expect(page.getByTestId('map-panel')).toBeVisible();
    await expect(page.getByTestId('tab-map')).toHaveClass(/active/);
  });

  test('About section displays project information and specifications', async ({ page }) => {
    await navigateToTab(page, 'tab-about');
    
    const aboutSection = page.getByTestId('about-section');
    await expect(aboutSection).toBeVisible();
    
    // Check project title
    await expect(aboutSection).toContainText('Visual Homing System');
    
    // Check features grid
    await expect(aboutSection).toContainText('Без GPS залежності');
    await expect(aboutSection).toContainText('Без компаса');
    await expect(aboutSection).toContainText('Teach & Repeat');
    await expect(aboutSection).toContainText('Термальна камера');
    
    // Check specifications table
    await expect(aboutSection).toContainText('Raspberry Pi Zero 2 W');
    await expect(aboutSection).toContainText('ArduCopter');
    await expect(aboutSection).toContainText('MAVLink');
    await expect(aboutSection).toContainText('Python 3');
    await expect(aboutSection).toContainText('C++17');
  });

  test('Documentation tab displays document list', async ({ page }) => {
    await navigateToTab(page, 'tab-docs');
    
    const docsSection = page.getByTestId('docs-section');
    await expect(docsSection).toBeVisible();
    
    // Check sidebar header
    await expect(page.locator('.sidebar-header')).toContainText('Документи');
    
    // Check that document items exist
    const docItems = page.locator('.doc-item');
    const count = await docItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Click on first document to verify content loads
    await docItems.first().click();
    
    // Wait for content to load (either placeholder goes away or content appears)
    const docContent = page.getByTestId('doc-content');
    await expect(docContent).toBeVisible({ timeout: 10000 });
  });
});
