import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

# Source generated image
src_path = "/home/parth-parmar/.gemini/antigravity-ide/brain/19513e3b-dfda-48bf-839f-acfd74481822/peoplepay360_logo_mark_1788596085575.png"
out_dir = "/home/parth-parmar/Desktop/odoo-hackthon/client/public"

os.makedirs(out_dir, exist_ok=True)

# Open image
img = Image.open(src_path).convert("RGBA")
width, height = img.size

# Crop to shield icon part (approx top 70%)
# Let's inspect bounding box of icon
datas = img.getdata()

# Remove white background with smooth alpha
newData = []
for item in datas:
    # item is (R, G, B, A)
    r, g, b, a = item
    # If pixel is close to pure white, adjust alpha
    if r > 240 and g > 240 and b > 240:
        # Distance from white
        diff = max(255 - r, 255 - g, 255 - b)
        if diff < 15:
            newData.append((255, 255, 255, 0))
        else:
            alpha = int((diff / 15.0) * 255)
            newData.append((r, g, b, min(255, alpha)))
    else:
        newData.append((r, g, b, a))

img_trans = Image.new("RGBA", img.size)
img_trans.putdata(newData)

# Find bounding box of non-transparent icon part
bbox = img_trans.getbbox()
print("Bounding box of icon:", bbox)

# Crop shield icon specifically
# Top icon is around (150, 150, 850, 700)
icon_crop = img_trans.crop((180, 140, 840, 720))

# Save Favicon (512x512 square centered)
fav_size = 512
favicon = Image.new("RGBA", (fav_size, fav_size), (0, 0, 0, 0))
icon_resized = icon_crop.resize((420, 420), Image.Resampling.LANCZOS)
favicon.paste(icon_resized, ((fav_size - 420) // 2, (fav_size - 420) // 2), icon_resized)

favicon_path = os.path.join(out_dir, "favicon.webp")
favicon.save(favicon_path, "WEBP", quality=100)
print(f"Saved {favicon_path}")

# Generate Navbar Logo (horizontal: icon + typography "PeoplePay360")
# We will create a high resolution canvas (1200 x 300)
nav_h = 300
nav_icon_w = 260
icon_nav = icon_crop.resize((nav_icon_w, nav_icon_w), Image.Resampling.LANCZOS)

# Create canvas
nav_logo = Image.new("RGBA", (1000, 300), (0, 0, 0, 0))
nav_logo.paste(icon_nav, (20, (300 - nav_icon_w) // 2), icon_nav)

draw = ImageDraw.Draw(nav_logo)

# Load font or render text with custom PIL drawing or SVG fallback
# We can use default or DejaVuSans font
font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not os.path.exists(font_path):
    font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

try:
    font = ImageFont.truetype(font_path, 110)
except Exception:
    font = ImageFont.load_default()

# Text: "PeoplePay" in #0F172A, "360" in #FF5E1E
text_x = 310
text_y = 90

draw.text((text_x, text_y), "PeoplePay", fill=(15, 23, 42, 255), font=font)
# Measure PeoplePay length
bbox_pp = draw.textbbox((text_x, text_y), "PeoplePay", font=font)
pp_width = bbox_pp[2] - text_x

draw.text((text_x + pp_width + 10, text_y), "360", fill=(255, 94, 30, 255), font=font)

# Save Navbar Logo webp
logo_path = os.path.join(out_dir, "logo.webp")
nav_logo.save(logo_path, "WEBP", quality=100)
print(f"Saved {logo_path}")

# Footer Logo (White/Light text for dark backgrounds or dark text for light backgrounds)
# Let's create footer logo with white text for dark footer, or orange/slate for versatility
footer_logo = Image.new("RGBA", (1000, 300), (0, 0, 0, 0))
footer_logo.paste(icon_nav, (20, (300 - nav_icon_w) // 2), icon_nav)
draw_f = ImageDraw.Draw(footer_logo)
draw_f.text((text_x, text_y), "PeoplePay", fill=(255, 255, 255, 255), font=font)
draw_f.text((text_x + pp_width + 10, text_y), "360", fill=(255, 94, 30, 255), font=font)

logo_footer_path = os.path.join(out_dir, "logo-footer.webp")
footer_logo.save(logo_footer_path, "WEBP", quality=100)
print(f"Saved {logo_footer_path}")

