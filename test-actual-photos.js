/**
 * Test script to check if actual captured photos can be read by Sharp
 * and verify the compositing process with real files
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testActualPhotos() {
  console.log('=== Testing Actual Photos with Sharp ===\n');

  // Find the most recent session folder
  const sessionsDir = path.join(__dirname, 'sessions');

  if (!fs.existsSync(sessionsDir)) {
    console.error('No sessions directory found!');
    console.log('Expected path:', sessionsDir);
    return;
  }

  const sessions = fs.readdirSync(sessionsDir)
    .filter(f => fs.statSync(path.join(sessionsDir, f)).isDirectory())
    .sort()
    .reverse();

  if (sessions.length === 0) {
    console.error('No session folders found!');
    return;
  }

  const latestSession = sessions[0];
  const sessionPath = path.join(sessionsDir, latestSession);
  console.log(`Latest session: ${latestSession}`);
  console.log(`Session path: ${sessionPath}\n`);

  // Find photos
  const photosDir = path.join(sessionPath, 'photos');
  if (!fs.existsSync(photosDir)) {
    console.error('No photos directory found!');
    return;
  }

  const photos = fs.readdirSync(photosDir)
    .filter(f => f.match(/\.(jpg|jpeg|png|cr2|cr3)$/i))
    .sort();

  console.log(`Found ${photos.length} photos:`);
  photos.forEach(p => console.log(`  - ${p}`));
  console.log('');

  // Test each photo with Sharp
  for (const photo of photos) {
    const photoPath = path.join(photosDir, photo);
    console.log(`\nTesting: ${photo}`);
    console.log(`  Path: ${photoPath}`);

    try {
      // Get file stats
      const stats = fs.statSync(photoPath);
      console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);

      // Try to read with Sharp
      const image = sharp(photoPath);
      const metadata = await image.metadata();
      console.log(`  Format: ${metadata.format}`);
      console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
      console.log(`  Channels: ${metadata.channels}`);

      // Try to convert to JPEG buffer (the compositing format)
      const startTime = Date.now();
      const buffer = await image.jpeg({ quality: 95 }).toBuffer();
      const elapsed = Date.now() - startTime;

      console.log(`  ✓ Converted to JPEG buffer: ${buffer.length} bytes (${elapsed}ms)`);

    } catch (error) {
      console.error(`  ✗ Failed to process:`, error.message);
      console.error(`  Error details:`, error);
    }
  }

  // Test compositing with actual photos
  if (photos.length >= 3) {
    console.log('\n\n=== Testing Compositing with Actual Photos ===\n');

    try {
      // Create a test canvas
      let canvas = sharp({
        create: {
          width: 600,
          height: 1800,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      });

      // Prepare first 3 photos
      const composites = [];
      for (let i = 0; i < Math.min(3, photos.length); i++) {
        const photoPath = path.join(photosDir, photos[i]);
        console.log(`Preparing photo ${i + 1}: ${photos[i]}`);

        const buffer = await sharp(photoPath)
          .resize(513, 423, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 95 })
          .toBuffer();

        console.log(`  Buffer size: ${buffer.length} bytes`);

        composites.push({
          input: buffer,
          top: i * 490 + 86,
          left: 48
        });
      }

      // Composite onto canvas
      console.log('\nCompositing...');
      canvas = canvas.composite(composites);

      const result = await canvas.jpeg({ quality: 90 }).toBuffer();
      console.log(`✓ Composite result: ${result.length} bytes`);

      // Save test output
      const outputPath = path.join(__dirname, 'test-actual-composite.jpg');
      fs.writeFileSync(outputPath, result);
      console.log(`✓ Saved test composite to: ${outputPath}`);
      console.log('\nPlease check if the output image shows the photos correctly!');

    } catch (error) {
      console.error('\n✗ Compositing failed:', error.message);
      console.error(error.stack);
    }
  }
}

testActualPhotos().catch(console.error);
