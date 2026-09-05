import os
from PIL import Image, ImageDraw, ImageFont

src_path = "/home/parth-parmar/.gemini/antigravity-ide/brain/19513e3b-dfda-48bf-839f-acfd74481822/peoplepay360_logo_mark_1788596085575.png"
out_dir = "/home/parth-parmar/Desktop/odoo-hackthon/client/public"

os.makedirs(out_dir, exist_ok=True)

# 1. Open source icon image and convert white background to transparent alpha
img = Image.open(src_path).convert("RGBA")
width, height = img.size

# Process alpha for white background
pixels = img.load()
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if r > 235 and g > 235 and b > 235:
            # White or near-white background -> alpha 0
            diff = max(255 - r, 255 - g, 255 - b)
            if diff < 20:
                pixels[x, y] = (255, 255, 255, 0)
            else:
                alpha = int((diff / 20.0) * 255)
                pixels[x, y] = (r, g, b, min(255, alpha))

# Crop the top shield icon specifically (bounding box around icon)
# The shield icon is located around top-center (x: 180 to 840, y: 140 to 720)
icon_crop = img.crop((180, 140, 840, 720))

# Get exact tight bounding box of cropped icon
icon_bbox = icon_crop.getbbox()
if icon_bbox:
    icon_crop = icon_crop.crop(icon_bbox)

# -------------------------------------------------------------
# FAVICON GENERATION (512x512 square centered)
# -------------------------------------------------------------
fav_dim = 512
favicon = Image.new("RGBA", (fav_dim, fav_dim), (0, 0, 0, 0))
# Scale icon to fit 420x420 inside 512x512
icon_fav = icon_crop.resize((420, int(420 * icon_crop.height / icon_crop.width)), Image.Resampling.LANCZOS)
fav_x = (fav_dim - icon_fav.width) // 2
fav_y = (fav_dim - icon_fav.height) // 2
favicon.paste(icon_fav, (fav_x, fav_y), icon_fav)

favicon_path = os.path.join(out_dir, "favicon.webp")
favicon.save(favicon_path, "WEBP", quality=100)
print(f"✅ Generated {favicon_path} (512x512)")

# -------------------------------------------------------------
# HIGH-RES LOGO GENERATION (Navbar - Light BG: Slate Dark + Orange 360)
# -------------------------------------------------------------
# Select bold font
font_paths = [
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
]
font_path = next((p for p in font_paths if os.path.exists(p)), None)

font_size = 140
font = ImageFont.truetype(font_path, font_size)

# Height of logo canvas
canvas_h = 320
icon_h = 240
icon_w = int(icon_h * icon_crop.width / icon_crop.height)
icon_scaled = icon_crop.resize((icon_w, icon_h), Image.Resampling.LANCZOS)

# Create extra wide canvas to prevent ANY cut-off
canvas_w = 1800
nav_logo = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

# Paste icon
icon_y = (canvas_h - icon_h) // 2
nav_logo.paste(icon_scaled, (20, icon_y), icon_scaled)

draw = ImageDraw.Draw(nav_logo)

# Calculate text metrics
text1 = "PeoplePay"
text2 = "360"

# Start position for text
text_x = 20 + icon_w + 35
text_y = (canvas_h - font_size) // 2 - 10

# Draw "PeoplePay" in dark navy (#0F172A)
draw.text((text_x, text_y), text1, fill=(15, 23, 42, 255), font=font)

# Measure exact width of "PeoplePay"
bbox_text1 = draw.textbbox((text_x, text_y), text1, font=font)
w_text1 = bbox_text1[2] - text_x

# Draw "360" in vibrant orange (#FF5E1E) right next to it with spacing
x_360 = text_x + w_text1 + 15
draw.text((x_360, text_y), text2, fill=(255, 94, 30, 255), font=font)

# Measure total bounding box and crop canvas to exact content + padding
full_bbox = nav_logo.getbbox()
if full_bbox:
    # Add 20px right padding
    crop_box = (full_bbox[0], full_bbox[1], min(canvas_w, full_bbox[2] + 25), full_bbox[3])
    nav_logo = nav_logo.crop(crop_box)

logo_path = os.path.join(out_dir, "logo.webp")
nav_logo.save(logo_path, "WEBP", quality=100)
print(f"✅ Generated {logo_path} ({nav_logo.width}x{nav_logo.height})")

# -------------------------------------------------------------
# HIGH-RES LOGO GENERATION (Footer - Dark BG: Pure White + Orange 360)
# -------------------------------------------------------------
footer_logo = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
footer_logo.paste(icon_scaled, (20, icon_y), icon_scaled)

draw_f = ImageDraw.Draw(footer_logo)

# Draw "PeoplePay" in pure white (#FFFFFF)
draw_f.text((text_x, text_y), text1, fill=(255, 255, 255, 255), font=font)
# Draw "360" in vibrant orange (#FF5E1E)
draw_f.text((x_360, text_y), text2, fill=(255, 94, 30, 255), font=font)

full_bbox_f = footer_logo.getbbox()
if full_bbox_f:
    crop_box_f = (full_bbox_f[0], full_bbox_f[1], min(canvas_w, full_bbox_f[2] + 25), full_bbox_f[3])
    footer_logo = footer_logo.crop(crop_box_f)

footer_logo_path = os.path.join(out_dir, "logo-footer.webp")
footer_logo.save(footer_logo_path, "WEBP", quality=100)
print(f"✅ Generated {footer_logo_path} ({footer_logo.width}x{footer_logo.height})")

