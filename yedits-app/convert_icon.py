from PIL import Image
import os
import shutil

# Source path
source_webp = r"..\resources\icons\yedits-YE-logo-colour-old1.webp"
temp_png = "temp_icon.png"

try:
    # Open and convert
    print(f"Opening {source_webp}...")
    img = Image.open(source_webp)
    print("Saving as PNG...")
    img.save(temp_png, "PNG")
    
    # Destinations to overwrite
    destinations = [
        r"assets\images\icon.png",
        r"assets\images\adaptive-icon.png",
        r"assets\images\splash-icon.png",
        r"assets\images\notification-icon.png"
    ]
    
    for dest in destinations:
        print(f"Copying to {dest}...")
        shutil.copy2(temp_png, dest)
        
    # Clean up
    if os.path.exists(temp_png):
        os.remove(temp_png)
        
    print("Conversion complete!")
    
except Exception as e:
    print(f"Error: {e}")
