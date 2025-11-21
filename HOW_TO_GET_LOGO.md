# 🎨 How to Get the Xaura Logo

## 📍 **Current Logo:**

The web app currently uses the **QrCode icon** from Lucide React (an icon library), not an image file.

**Where it appears:**
- Sidebar: QrCode icon + "Xaura" text
- Login/Register/Forgot Password pages: QrCode icon in a circle

---

## 🎯 **Option 1: Create Your Own Logo**

### **Step 1: Design a Logo**
You can create a logo using:
- **Canva** (free): https://canva.com
- **Figma** (free): https://figma.com
- **Adobe Illustrator** (paid)

### **Step 2: Export as Image**
- Format: **PNG** (with transparent background) or **SVG**
- Sizes needed:
  - **32x32px** (favicon)
  - **64x64px** (small)
  - **128x128px** (medium)
  - **256x256px** (large)

### **Step 3: Add to Web App**
1. Create folder: `web/public/images/`
2. Add your logo file: `logo.png` or `logo.svg`
3. Update components to use the image instead of icon

---

## 🎯 **Option 2: Use Current Icon as Logo**

If you want to export the current QrCode icon as an image:

### **Using Browser:**
1. Open your web app: https://www.xaura.pro
2. Right-click on the QrCode icon
3. **Inspect Element** (F12)
4. Take a screenshot
5. Crop to just the icon

### **Using Lucide Icons Website:**
1. Go to: https://lucide.dev/icons/qr-code
2. Download the SVG icon
3. Customize colors/size
4. Export as PNG/SVG

---

## 🎯 **Option 3: I Can Create a Logo for You**

I can help you:
1. Create a simple logo design
2. Generate logo files in different sizes
3. Update the web app to use the logo image

**Just tell me:**
- What style do you want? (modern, classic, minimal, etc.)
- What colors? (current primary color is purple/indigo)
- Any specific elements? (QR code, scissors, salon-related, etc.)

---

## 📋 **Current Logo Usage:**

**Sidebar:**
```jsx
<QrCode className="text-primary-600" size={28} />
<span className="font-bold text-lg">Xaura</span>
```

**Auth Pages:**
```jsx
<div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
  <QrCode className="text-white" size={32} />
</div>
```

---

## 🚀 **Quick Solution:**

**If you want me to create a logo file for you, I can:**
1. Generate an SVG logo based on the QrCode icon
2. Add it to the web app
3. Replace the icon with the image file

**Or if you have a logo already:**
1. Share the logo file
2. I'll add it to the web app
3. Update all components to use it

---

**Which option do you prefer?** 🎨

