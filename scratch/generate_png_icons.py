import os
from PIL import Image, ImageDraw, ImageFont

def create_pwa_icon(size, output_path, is_maskable=False):
    # Create high-res canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Colors
    bg_color = (13, 15, 12, 255) # #0d0f0c
    border_color = (226, 114, 91, 255) # #e2725b
    primary_color = (255, 123, 84, 255) # #ff7b54
    gold_color = (255, 213, 107, 255) # #ffd56b
    white_color = (255, 255, 255, 255)

    if is_maskable:
        # Full bleed for maskable
        draw.rectangle([0, 0, size, size], fill=bg_color)
    else:
        # Rounded rectangle
        corner_radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=bg_color)
        draw.rounded_rectangle([2, 2, size - 2, size - 2], radius=corner_radius, outline=(255, 255, 255, 25), width=int(size * 0.008))

    # Inner badge
    pad = int(size * 0.18) if not is_maskable else int(size * 0.22)
    inner_radius = int(size * 0.12)
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=inner_radius,
        fill=(24, 28, 21, 255),
        outline=border_color,
        width=max(2, int(size * 0.015))
    )

    # Let's draw modern stylised DQ text / monogram
    font_size = int(size * 0.28)
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("Arial Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

    # Draw 'DQ'
    text = "DQ"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    text_x = (size - text_w) / 2
    text_y = (size - text_h) / 2 - (size * 0.04)

    # Shadow
    draw.text((text_x + int(size*0.01), text_y + int(size*0.015)), text, font=font, fill=(0, 0, 0, 180))
    # Main text
    draw.text((text_x, text_y), "D", font=font, fill=primary_color)
    d_w = draw.textbbox((0, 0), "D", font=font)[2]
    draw.text((text_x + d_w - int(size*0.01), text_y), "Q", font=font, fill=gold_color)

    # Small subtitle 'DA QUEBRADA'
    sub_font_size = max(10, int(size * 0.055))
    try:
        sub_font = ImageFont.truetype("arialbd.ttf", sub_font_size)
    except:
        sub_font = font

    sub_text = "DA QUEBRADA"
    sbbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sw = sbbox[2] - sbbox[0]
    sx = (size - sw) / 2
    sy = text_y + text_h + int(size * 0.04)
    draw.text((sx, sy), sub_text, font=sub_font, fill=white_color)

    # Decorative indicator dot
    dot_r = max(3, int(size * 0.03))
    dot_x = size - pad - int(size * 0.04)
    dot_y = pad + int(size * 0.04)
    draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=primary_color, outline=white_color, width=max(1, int(size*0.005)))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Generated: {output_path} ({size}x{size})")

if __name__ == "__main__":
    public_dir = os.path.abspath("public")
    create_pwa_icon(192, os.path.join(public_dir, "pwa-192x192.png"))
    create_pwa_icon(512, os.path.join(public_dir, "pwa-512x512.png"))
    create_pwa_icon(180, os.path.join(public_dir, "apple-touch-icon.png"))
    create_pwa_icon(512, os.path.join(public_dir, "maskable-icon-512x512.png"), is_maskable=True)
    create_pwa_icon(64, os.path.join(public_dir, "favicon.png"))
    print("All icons created successfully!")
