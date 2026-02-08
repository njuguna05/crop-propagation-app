# FloraTrack Favicon Instructions

## Current Setup
- **favicon.svg**: Modern SVG favicon for browsers that support it
- **favicon.ico**: Legacy ICO format for older browsers
- **logo192.png** and **logo512.png**: PWA icons for mobile devices

## SVG Favicon
The `favicon.svg` file contains a scalable vector version of the FloraTrack plant logo with:
- Green color scheme (#16a34a, #22c55e, #10b981)
- Plant stem with leaves and root system
- Growth tracking dots
- Circular background with gradient

## Creating ICO Files
To create proper ICO files from the SVG:

1. **Online Converters**:
   - Use https://favicon.io/favicon-converter/
   - Upload the `favicon.svg` file
   - Download the generated `favicon.ico`

2. **Using ImageMagick**:
   ```bash
   convert favicon.svg -resize 16x16 favicon-16.png
   convert favicon.svg -resize 32x32 favicon-32.png
   convert favicon-16.png favicon-32.png favicon.ico
   ```

3. **Using GIMP**:
   - Open `favicon.svg` in GIMP
   - Export as ICO format with multiple sizes (16x16, 32x32)

## PWA Icons
For the manifest.json icons (logo192.png, logo512.png):

1. **Export from SVG**:
   ```bash
   convert favicon.svg -resize 192x192 logo192.png
   convert favicon.svg -resize 512x512 logo512.png
   ```

2. **Or use online tools**:
   - Use https://realfavicongenerator.net/
   - Upload the SVG and generate all required sizes

## File Structure
```
public/
├── favicon.svg          # Modern SVG favicon
├── favicon.ico          # Legacy ICO favicon
├── logo192.png         # PWA icon 192x192
├── logo512.png         # PWA icon 512x512
├── manifest.json       # PWA manifest
└── index.html          # References both SVG and ICO
```

## Browser Support
- **SVG**: Chrome 73+, Firefox 41+, Safari 9+, Edge 79+
- **ICO**: All browsers (fallback)
- **PNG**: PWA and mobile bookmarks

## Testing
1. Check favicon appears in browser tab
2. Test PWA installation on mobile
3. Verify bookmark icons on different platforms
4. Test in incognito/private browsing mode