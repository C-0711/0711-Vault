#!/usr/bin/env python3
"""
Generate App Store icons for 0711 Vault
Run: python3 generate-icons.py

Requires: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Icon sizes needed for iOS
ICON_SIZES = [
    # iPhone
    (180, "icon-60@3x.png"),
    (120, "icon-60@2x.png"),
    (87, "icon-29@3x.png"),
    (80, "icon-40@2x.png"),
    (120, "icon-40@3x.png"),
    (58, "icon-29@2x.png"),
    # iPad
    (167, "icon-83.5@2x.png"),
    (152, "icon-76@2x.png"),
    (76, "icon-76.png"),
    # App Store
    (1024, "icon-1024.png"),
    # Notification
    (40, "icon-20@2x.png"),
    (60, "icon-20@3x.png"),
    # Spotlight
    (80, "icon-40@2x.png"),
    (120, "icon-40@3x.png"),
]


def create_icon(size: int) -> Image.Image:
    """Create a single icon at the specified size."""
    
    # Create gradient background
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Gradient from dark blue to darker blue
    for y in range(size):
        r = int(10 + (y / size) * 15)  # 10-25
        g = int(15 + (y / size) * 20)  # 15-35
        b = int(40 + (y / size) * 30)  # 40-70
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Draw vault icon (simplified lock/shield)
    center_x = size // 2
    center_y = size // 2
    
    # Shield shape
    shield_size = int(size * 0.5)
    shield_top = center_y - int(shield_size * 0.5)
    shield_bottom = center_y + int(shield_size * 0.5)
    shield_left = center_x - int(shield_size * 0.4)
    shield_right = center_x + int(shield_size * 0.4)
    
    # Draw shield
    shield_points = [
        (center_x, shield_top),  # Top
        (shield_right, shield_top + int(shield_size * 0.2)),  # Top right
        (shield_right, center_y),  # Middle right
        (center_x, shield_bottom),  # Bottom point
        (shield_left, center_y),  # Middle left
        (shield_left, shield_top + int(shield_size * 0.2)),  # Top left
    ]
    
    # Shield fill
    draw.polygon(shield_points, fill=(255, 255, 255, 230))
    
    # Draw "0711" text
    try:
        # Try to use a nice font, fall back to default
        font_size = int(size * 0.15)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "0711"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = center_x - text_width // 2
    text_y = center_y - text_height // 2
    
    draw.text((text_x, text_y), text, fill=(20, 30, 60), font=font)
    
    return img


def create_icon_modern(size: int) -> Image.Image:
    """Create a modern, minimal icon."""
    
    # Dark background
    img = Image.new('RGB', (size, size), (15, 15, 20))
    draw = ImageDraw.Draw(img)
    
    # Subtle gradient overlay
    for y in range(size):
        alpha = int(30 * (1 - y / size))
        draw.line([(0, y), (size, y)], fill=(30 + alpha, 30 + alpha, 40 + alpha))
    
    # Draw stylized "V" for Vault
    center_x = size // 2
    center_y = size // 2
    v_size = int(size * 0.4)
    
    # V shape with glow effect
    for offset in range(3, 0, -1):
        alpha = 100 - offset * 30
        v_points = [
            (center_x - v_size // 2 - offset, center_y - v_size // 3),
            (center_x, center_y + v_size // 3 + offset),
            (center_x + v_size // 2 + offset, center_y - v_size // 3),
        ]
        color = (100 + alpha, 150 + alpha, 255)
        draw.line([v_points[0], v_points[1]], fill=color, width=max(1, size // 30))
        draw.line([v_points[1], v_points[2]], fill=color, width=max(1, size // 30))
    
    # Main V
    v_points = [
        (center_x - v_size // 2, center_y - v_size // 3),
        (center_x, center_y + v_size // 3),
        (center_x + v_size // 2, center_y - v_size // 3),
    ]
    draw.line([v_points[0], v_points[1]], fill=(200, 220, 255), width=max(2, size // 20))
    draw.line([v_points[1], v_points[2]], fill=(200, 220, 255), width=max(2, size // 20))
    
    # Lock keyhole
    keyhole_y = center_y - v_size // 6
    keyhole_r = max(2, size // 25)
    draw.ellipse(
        [center_x - keyhole_r, keyhole_y - keyhole_r,
         center_x + keyhole_r, keyhole_y + keyhole_r],
        fill=(200, 220, 255)
    )
    draw.rectangle(
        [center_x - keyhole_r // 2, keyhole_y,
         center_x + keyhole_r // 2, keyhole_y + keyhole_r * 2],
        fill=(200, 220, 255)
    )
    
    return img


def main():
    output_dir = "Icons"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🎨 Generating 0711 Vault icons...")
    
    for size, filename in ICON_SIZES:
        img = create_icon_modern(size)
        path = os.path.join(output_dir, filename)
        img.save(path, "PNG")
        print(f"  ✅ {filename} ({size}x{size})")
    
    # Create Contents.json for asset catalog
    contents = {
        "images": [],
        "info": {"author": "xcode", "version": 1}
    }
    
    idiom_map = {
        "60": "iphone",
        "29": "iphone", 
        "40": "iphone",
        "20": "iphone",
        "76": "ipad",
        "83.5": "ipad",
        "1024": "ios-marketing"
    }
    
    # Save App Store icon (1024x1024)
    print(f"\n📱 App Store icon saved to {output_dir}/icon-1024.png")
    print("\nNext steps:")
    print("1. Open Xcode")
    print("2. Go to Assets.xcassets > AppIcon")
    print("3. Drag icon-1024.png to the 1024pt slot")
    print("4. Or use the generated icons for each size")


if __name__ == "__main__":
    main()
