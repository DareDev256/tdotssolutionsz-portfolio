#!/bin/bash
# Batch optimize curated photos for web portfolio
# Resizes to max 2000px wide, converts to WebP (quality 85)

PROJECT="/Users/t./Documents/Projects/TdotsSolutionsz Music Video Portfolio"
PHOTOS="$PROJECT/public/photos"
TEMP="/tmp/photo-optimize"
mkdir -p "$TEMP"

# Function: resize to max 2000px wide, convert to WebP
process_photo() {
    local src="$1"
    local dest="$2"
    local temp_jpg="$TEMP/$(basename "$dest" .webp).jpg"

    echo "Processing: $(basename "$src") → $(basename "$dest")"

    # Copy and resize with sips (macOS built-in)
    cp "$src" "$temp_jpg" 2>/dev/null
    sips --resampleWidth 2000 "$temp_jpg" --setProperty formatOptions 80 > /dev/null 2>&1

    # Convert to WebP with cwebp
    cwebp -q 85 -m 6 "$temp_jpg" -o "$dest" > /dev/null 2>&1

    if [ -f "$dest" ]; then
        local size=$(du -h "$dest" | cut -f1)
        echo "  ✓ Done: $size"
    else
        echo "  ✗ Failed!"
    fi
    rm -f "$temp_jpg"
}

PORTFOLIO="/Users/t./Documents/Resumes:Portfolio/James Portfolio"
PICS_AI="/Users/t./Pictures/AI Library/JPG Files"
DESKTOP_AI="/Users/t./Desktop/AI Library"

echo "=== PORTRAITS (9 photos) ==="

# Kat Rose (3)
process_photo "$PORTFOLIO/Glamour/Kat Rose/DSC08926.jpg" "$PHOTOS/portraits/kat-rose-01.webp"
process_photo "$PORTFOLIO/Glamour/Kat Rose/DSC08885.jpg" "$PHOTOS/portraits/kat-rose-02.webp"
process_photo "$PORTFOLIO/Glamour/Kat Rose/DSC08906.jpg" "$PHOTOS/portraits/kat-rose-03.webp"

# Juju (3)
process_photo "$PORTFOLIO/Glamour/Juju/DSC01474-Edit.jpg" "$PHOTOS/portraits/juju-01.webp"
process_photo "$PORTFOLIO/Glamour/Juju/DSC01652.jpg" "$PHOTOS/portraits/juju-02.webp"
process_photo "$PORTFOLIO/Glamour/Juju/DSC01664.jpg" "$PHOTOS/portraits/juju-03.webp"

# Sandra (3)
process_photo "$PORTFOLIO/Glamour/Sandra/SR504227.jpg" "$PHOTOS/portraits/sandra-01.webp"
process_photo "$PORTFOLIO/Glamour/Sandra/SR504214.jpg" "$PHOTOS/portraits/sandra-02.webp"
process_photo "$PORTFOLIO/Glamour/Sandra/SR504263.jpg" "$PHOTOS/portraits/sandra-03.webp"

echo ""
echo "=== ARTIST / MUSIC (5 photos) ==="

# Sean Pane EPK (2)
process_photo "$PICS_AI/SeanPane EPK.jpg" "$PHOTOS/artist/sean-pane-01.webp"
process_photo "$PICS_AI/SeanPane EPK2.jpg" "$PHOTOS/artist/sean-pane-02.webp"

# Concert/street artist shots (3)
process_photo "$PICS_AI/IMG_7197.jpg" "$PHOTOS/artist/concert-warm-01.webp"
process_photo "$PICS_AI/IMG_7185.jpg" "$PHOTOS/artist/artist-car-01.webp"
process_photo "$PICS_AI/IMG_7188.jpg" "$PHOTOS/artist/night-street-01.webp"

echo ""
echo "=== EVENTS (10 photos) ==="

# Baby shower - pick best 5 from 7 (WE-19, WE-20, WE-22, WE-24, WE-25)
process_photo "$DESKTOP_AI/WE-19.jpg" "$PHOTOS/events/baby-shower-01.webp"
process_photo "$DESKTOP_AI/WE-20.jpg" "$PHOTOS/events/baby-shower-02.webp"
process_photo "$DESKTOP_AI/WE-22.jpg" "$PHOTOS/events/baby-shower-03.webp"
process_photo "$DESKTOP_AI/WE-24.jpg" "$PHOTOS/events/baby-shower-04.webp"
process_photo "$DESKTOP_AI/WE-25.jpg" "$PHOTOS/events/baby-shower-05.webp"

# Brunch/food styling (3)
process_photo "$PICS_AI/SR507587.jpg" "$PHOTOS/events/brunch-01.webp"
process_photo "$PICS_AI/SR507594.jpg" "$PHOTOS/events/brunch-02.webp"
process_photo "$PICS_AI/SR507877.jpg" "$PHOTOS/events/brunch-03.webp"

# Team/group (2)
process_photo "$PICS_AI/DSC04715.JPG" "$PHOTOS/events/team-01.webp"
process_photo "$PICS_AI/DSC04719.JPG" "$PHOTOS/events/team-02.webp"

echo ""
echo "=== STREET / URBAN (1 photo) ==="

process_photo "$PORTFOLIO/Street Photography/DSC06744.JPG" "$PHOTOS/street/urban-night-01.webp"

echo ""
echo "=== SUMMARY ==="
echo "Total files:"
find "$PHOTOS" -name "*.webp" | wc -l
echo ""
echo "Total size:"
du -sh "$PHOTOS"
echo ""
echo "By category:"
for dir in portraits artist events street; do
    count=$(find "$PHOTOS/$dir" -name "*.webp" | wc -l)
    size=$(du -sh "$PHOTOS/$dir" | cut -f1)
    echo "  $dir: $count files, $size"
done

# Cleanup
rm -rf "$TEMP"
