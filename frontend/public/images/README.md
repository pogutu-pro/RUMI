# RUMI Images Directory

This directory contains all images used throughout the RUMI platform. Follow this guide to add your images.

## ✅ Already Added
- `logo/RUMI Logo.png` - Main RUMI logo (currently in use)

## 📁 Folder Structure & Image Requirements

### 1. `/logo` - Brand Identity
**Already has your logo!**
Additional recommended:
- `logo-white.png` - White version for dark backgrounds (optional)
- `favicon.ico` - Browser tab icon (16x16, 32x32, 64x64)

**Usage**: Navbar, Footer, Email templates

---

### 2. `/auth` - Authentication Pages
**Images needed**:
- `login-bg.jpg` (1920x1080) - Login page background
  - Suggestion: Modern student dorm interior, students studying
- `register-bg.jpg` (1920x1080) - Registration page background
  - Suggestion: Happy students in hostel, group studying

**Current status**: Using placeholder, pages will load without images but won't show background

---

### 3. `/team` - Team Member Photos
**Images needed** (300x300px, square, professional):
- `joseph-ogutu.jpg` - CTO photo
- `jane-smith.jpg` - Head of Operations
- `david-kiprop.jpg` - Customer Success Manager
- `grace-achieng.jpg` - Community Manager

**Current status**: Using icon placeholders

---

### 4. `/blog` - Blog Post Featured Images
**Images needed** (800x400px, 2:1 ratio):
- `student-accommodation-tips.jpg`
- `rumi-expansion.jpg`
- `hostel-deposits.jpg`
- `marketplace-success.jpg`
- `landlord-tips.jpg`
- `product-updates.jpg`

**Suggestions**:
- Student hostels and dorm rooms
- University campuses
- Students using laptops/studying
- Modern accommodation interiors

**Current status**: Using placeholder images

---

### 5. `/hero` - Page Hero Sections
**Images needed** (1920x1080px, high quality):
- `home-hero.jpg` - Homepage hero background (optional, using gradient)
- `about-hero.jpg` - About page background (optional)
- `services-hero.jpg` - General services background

**Current status**: Using gradient backgrounds (works well without images)

---

### 6. `/hostels` - Hostel Property Images
**Folder structure**:
```
hostels/
├── sunview-residence/
│   ├── exterior.jpg
│   ├── room-single.jpg
│   ├── room-double.jpg
│   ├── common-area.jpg
│   ├── gym.jpg
│   └── parking.jpg
├── campus-towers/
│   └── [similar structure]
```

**Image specs**: 800x600px minimum, clear, well-lit

**Suggestions**:
- Building exterior shots
- Different room types
- Common areas (kitchen, lounge, study rooms)
- Amenities (gym, laundry, parking)

**Current status**: API returns empty array, will show "No hostels" message

---

### 7. `/marketplace` - Product Images
**Folder structure** by category:
```
marketplace/
├── electronics/
│   ├── laptop-1.jpg
│   ├── phone-1.jpg
│   └── headphones-1.jpg
├── textbooks/
│   └── [book covers]
├── furniture/
│   └── [furniture photos]
```

**Image specs**: 800x600px, clean background preferred

**Current status**: API has errors (backend issue), will show loading/error state

---

### 8. `/defaults` - Fallback Images
**Images needed**:
- `user-avatar.png` (200x200) - Default profile picture
- `hostel-placeholder.jpg` (800x600) - Default ho stel image
- `product-placeholder.jpg` (800x600) - Default product image

**These are important** - shown when users haven't uploaded images

---

## 🎨 Image Guidelines

### Format
- **Photos**: JPG (optimized)
- **Graphics/Logos**: PNG with transparency
- **Icons**: SVG (preferred)

### Size Optimization
- Compress all images before upload
- Tools: TinyPNG, ImageOptim, Squoosh
- Target: < 200KB per image

### Quality
- High resolution (2x for retina displays)
- Good lighting
- Professional appearance
- Brand-consistent colors when possible

---

## 🚀 Priority Order

### CRITICAL (Add Now):
1. ✅ Logo (already added!)
2. `defaults/user-avatar.png` - Used everywhere
3. `defaults/hostel-placeholder.jpg`
4. `defaults/product-placeholder.jpg`

### HIGH (Add Soon):
5. `auth/login-bg.jpg`
6. `auth/register-bg.jpg`
7. Team member photos (4 images)

### MEDIUM (Add When Available):
8. Blog featured images
9. Sample hostel images
10. Sample product images

---

## 📝 Notes

- All images are served from `/images/` URL path
- Missing images won't break the site - it gracefully handles missing images
- The application uses beautiful gradients where images aren't available
- Update image paths in code when you add new images (or use the same names suggested here)

---

## 🔗 Free Stock Photo Resources

- **Unsplash**: https://unsplash.com
- **Pexels**: https://www.pexels.com  
- **Pixabay**: https://pixabay.com

**Search terms**:
- "student accommodation"
- "university dorm room"
- "african university campus"
- "student marketplace"
- "modern hostel interior"