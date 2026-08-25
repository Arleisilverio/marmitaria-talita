import os
from PIL import Image

def generate_icons_from_logo():
    src_path = "public/icon.jpg"
    if not os.path.exists(src_path):
        src_path = "public/da-quebrada-hero.jpg"
    
    print(f"Usando logo fonte: {src_path}")
    base_img = Image.open(src_path).convert("RGBA")
    
    # 1. 192x192 PNG
    img_192 = base_img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save("public/pwa-192x192.png", "PNG", quality=95)
    print("Salvo: public/pwa-192x192.png")

    # 2. 512x512 PNG
    img_512 = base_img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save("public/pwa-512x512.png", "PNG", quality=95)
    print("Salvo: public/pwa-512x512.png")

    # 3. 180x180 Apple Touch Icon
    img_apple = base_img.resize((180, 180), Image.Resampling.LANCZOS)
    img_apple.save("public/apple-touch-icon.png", "PNG", quality=95)
    print("Salvo: public/apple-touch-icon.png")

    # 4. 64x64 Favicon
    img_fav = base_img.resize((64, 64), Image.Resampling.LANCZOS)
    img_fav.save("public/favicon.png", "PNG", quality=95)
    print("Salvo: public/favicon.png")

    # 5. Maskable Icon 512x512 (Android safe-zone padding)
    maskable_canvas = Image.new("RGBA", (512, 512), (13, 15, 12, 255)) # #0d0f0c dark background
    padded_size = int(512 * 0.8) # 80% safe zone
    img_padded = base_img.resize((padded_size, padded_size), Image.Resampling.LANCZOS)
    offset = (512 - padded_size) // 2
    maskable_canvas.paste(img_padded, (offset, offset), img_padded)
    maskable_canvas.save("public/maskable-icon-512x512.png", "PNG", quality=95)
    print("Salvo: public/maskable-icon-512x512.png")

    print("🎉 Todos os ícones PWA foram gerados com a logo original do app!")

if __name__ == "__main__":
    generate_icons_from_logo()
