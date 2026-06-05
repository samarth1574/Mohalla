# PWA Icons

## Required Icons

This directory needs the following icon files for the PWA to function properly:

### 1. icon-192x192.png
- **Size**: 192x192 pixels
- **Format**: PNG
- **Purpose**: App icon for Android home screen, notification icon
- **Design**: Should have the Mohalla logo with emerald/teal gradient background

### 2. icon-512x512.png
- **Size**: 512x512 pixels
- **Format**: PNG
- **Purpose**: High-resolution app icon for Android splash screen and app stores
- **Design**: Same as 192x192 but higher resolution

## Design Guidelines

- Use the Mohalla brand colors: emerald-600 (#059669) and teal-500
- Include the "M" logo in the center
- Ensure the icon is clearly visible on both light and dark backgrounds
- Keep the design simple and recognizable at small sizes
- Use the same design for both sizes, just different resolutions

## How to Generate Icons

You can use online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- https://maskable.app/ (for maskable icons)

Or use image editing software like:
- Figma
- Adobe Photoshop
- GIMP (free)

## Temporary Solution

Until proper icons are created, you can:
1. Create a simple colored square (emerald background)
2. Add white letter "M" in the center
3. Export in both sizes

Example using ImageMagick:
```bash
# Create 192x192 icon
convert -size 192x192 xc:"#059669" -gravity center -pointsize 120 -fill white -annotate +0+0 "M" icon-192x192.png

# Create 512x512 icon
convert -size 512x512 xc:"#059669" -gravity center -pointsize 320 -fill white -annotate +0+0 "M" icon-512x512.png
```

## Note

These icons are referenced in:
- `/public/manifest.json`
- `/public/sw.js` (service worker)
- Various notification handlers

Make sure the filenames match exactly: `icon-192x192.png` and `icon-512x512.png`
