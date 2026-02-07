/**
 * Test script to verify composite fix
 * Simulates the image compositing process with Sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testComposite() {
  console.log('=== Testing Image Composite Fix ===\n');

  try {
    // Step 1: Create a white canvas (600x1800 like the frame)
    console.log('Step 1: Creating white canvas (600x1800)...');
    let canvas = sharp({
      create: {
        width: 600,
        height: 1800,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    // Step 2: Create test "photos" (colored rectangles) WITH format specification
    console.log('Step 2: Creating test photos WITH format (.jpeg())...');

    const photo1 = await sharp({
      create: {
        width: 513,
        height: 423,
        channels: 3,
        background: { r: 255, g: 0, b: 0 } // Red
      }
    })
    .jpeg({ quality: 95 })  // CRITICAL FIX: Specify format
    .toBuffer();

    console.log(`  Photo 1: ${photo1.length} bytes`);

    const photo2 = await sharp({
      create: {
        width: 509,
        height: 432,
        channels: 3,
        background: { r: 0, g: 255, b: 0 } // Green
      }
    })
    .jpeg({ quality: 95 })  // CRITICAL FIX: Specify format
    .toBuffer();

    console.log(`  Photo 2: ${photo2.length} bytes`);

    const photo3 = await sharp({
      create: {
        width: 516,
        height: 419,
        channels: 3,
        background: { r: 0, g: 0, b: 255 } // Blue
      }
    })
    .jpeg({ quality: 95 })  // CRITICAL FIX: Specify format
    .toBuffer();

    console.log(`  Photo 3: ${photo3.length} bytes`);

    // Step 3: Composite photos onto canvas
    console.log('Step 3: Compositing photos onto canvas...');

    canvas = canvas.composite([
      { input: photo1, top: 86, left: 48 },
      { input: photo2, top: 572, left: 48 },
      { input: photo3, top: 1062, left: 45 }
    ]);

    // Step 4: Save result
    console.log('Step 4: Saving composite...');
    const result = await canvas.jpeg({ quality: 90 }).toBuffer();

    console.log(`  Result size: ${result.length} bytes`);

    const outputPath = path.join(__dirname, 'test-composite-output.jpg');
    fs.writeFileSync(outputPath, result);
    console.log(`  Saved to: ${outputPath}`);

    console.log('\n✓ SUCCESS: Composite created with colored photos visible!');
    console.log('Expected: Red, green, and blue rectangles on white background');

  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.error(error.stack);
  }

  // Also test the BROKEN version for comparison
  console.log('\n\n=== Testing BROKEN Version (without format) ===\n');

  try {
    let brokenCanvas = sharp({
      create: {
        width: 600,
        height: 1800,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    // Create photo WITHOUT format specification (the bug)
    const brokenPhoto = await sharp({
      create: {
        width: 513,
        height: 423,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .toBuffer();  // BUG: No format specified!

    console.log(`Broken photo buffer size: ${brokenPhoto.length} bytes (raw pixels)`);

    brokenCanvas = brokenCanvas.composite([
      { input: brokenPhoto, top: 86, left: 48 }
    ]);

    const brokenResult = await brokenCanvas.jpeg({ quality: 90 }).toBuffer();
    console.log('✗ Unexpected: Should have failed but succeeded?');

  } catch (error) {
    console.log('✓ Expected failure:', error.message);
    console.log('This confirms the bug: raw pixel buffers cannot be composited');
  }
}

testComposite();
