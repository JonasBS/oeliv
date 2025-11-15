# ØLIV – Farm Hospitality Website

A modern, accessible, and beautifully designed single-page website for ØLIV farm hospitality and ØLIV Brew brewery on Bornholm, Denmark.

## ✨ Features

### Design & UX Enhancements
- **Modern animations**: Smooth fade-in, slide-down, and scale animations throughout
- **Interactive hover effects**: Cards, buttons, and images respond to user interaction
- **Improved visual hierarchy**: Better typography, spacing, and color contrast
- **Professional gradient backgrounds**: Subtle gradients add depth and sophistication
- **Smooth transitions**: All interactive elements use cubic-bezier easing for premium feel

### Accessibility Improvements
- **ARIA labels**: Comprehensive screen reader support throughout
- **Keyboard navigation**: Full keyboard support with visible focus states
- **Semantic HTML**: Proper use of landmarks, headings, and roles
- **Color contrast**: Meets WCAG AA standards
- **Reduced motion support**: Respects user's motion preferences
- **Form validation**: Required fields and proper labeling

### User Experience
- **Enhanced booking modal**: 
  - Improved animations (scale-in effect)
  - Better form layout and spacing
  - Dynamic price calculator based on selected dates
  - Escape key to close
  - Focus management
  - Body scroll lock when open

- **Smooth scroll**: All anchor links smoothly scroll to sections
- **Intersection Observer**: Sections fade in as you scroll
- **Responsive grid layouts**: Auto-fit grids adapt to any screen size
- **Touch-friendly**: Larger tap targets on mobile devices

### Performance & Best Practices
- **Single HTML file**: No build process needed
- **Optimized CSS**: Uses CSS custom properties for theming
- **Lazy animations**: Animations only trigger when elements are visible
- **Print styles**: Clean printing without interactive elements
- **High contrast mode**: Supports system high contrast settings

## 🚀 Usage

### Local Development
Simply open `index.html` in your browser. No build step required!

```bash
open index.html
```

### Deploy to GitHub Pages

1. Create a new repository (e.g., `oliv-website`)
2. Upload `index.html` to the root of the repository
3. Go to **Settings → Pages**
   - Source: **Deploy from branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Your site will be live at `https://<username>.github.io/<repo>/`

### Deploy to Other Platforms

#### Netlify
1. Drag and drop the file to netlify.com/drop
2. Done!

#### Vercel
```bash
vercel --prod
```

## 🎨 Customization

### Colors
Edit the CSS custom properties in the `:root` selector:

```css
:root {
  --charcoal: #0a0c0d;
  --olive: #3d4a26;
  --beige: #c9b89a;
  --cream: #f8f4ed;
  --accent-warm: #d4a574;
  --accent-cool: #7ba8b0;
  /* ... more colors */
}
```

### Images
**Current Images** - Curated for authentic Nordic farm hospitality aesthetic:

All images are carefully selected from Unsplash to match the rustic luxury style of properties like:
- **Babylonstoren** (South Africa) - Farm-to-table luxury
- **São Lourenço do Barrocal** (Portugal) - Minimalist farm estate
- **Reschio** (Italy) - Historic estate restoration
- **Oakwell Beer Spa** (Sweden) - Wellness & brewery integration

**Image Categories:**
1. **Hero Image** - Nordic farmhouse with landscape views
2. **Room Images** - Natural materials, muted tones, rustic elegance
3. **Brewery** - Craft beer production, wooden barrels, authentic
4. **Spa** - Nordic sauna, natural wellness
5. **Coastal** - Scandinavian coastline, rugged beauty

**To Replace Images:**
Simply update the `src` attributes in the HTML `<img>` tags with your own URLs.

### Content
All content is in Danish. Simply edit the HTML text to update:
- Room descriptions & prices
- Package details
- Brewery information
- Contact information

## 📱 Responsive Breakpoints

- **Desktop**: > 900px (full navigation, multi-column grids)
- **Tablet**: 768px - 900px (simplified navigation, adjusted layouts)
- **Mobile**: < 768px (single column, stacked layouts)

## 🔧 Browser Support

- ✅ Chrome/Edge (last 2 versions)
- ✅ Firefox (last 2 versions)
- ✅ Safari (last 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📦 What's Included

- Fully responsive design
- Booking modal with date selection
- Dynamic pricing calculator
- Room showcase with 5 different accommodation types
- Package deals section
- Spa & experiences section
- Brewery information
- Location highlight
- Philosophy section
- Sticky header with navigation
- Professional footer

## 🎯 Key Improvements Over Original

1. **Animations**: Added smooth entrance animations to all sections
2. **Accessibility**: Full ARIA support and keyboard navigation
3. **Interactivity**: Hover effects on cards, buttons, and images
4. **Modal UX**: Enhanced booking modal with better animations and focus management
5. **Responsive**: Improved mobile layouts with auto-fit grids
6. **Performance**: Intersection Observer for efficient animations
7. **Code Quality**: Clean, well-commented, organized CSS
8. **User Feedback**: Better button states and transitions
9. **Typography**: Improved hierarchy and readability
10. **Visual Polish**: Professional gradients, shadows, and spacing

## 📝 License

This is a custom website for ØLIV. All rights reserved.

## 🤝 Support

For questions or customization requests, contact the development team.

---

Built with ❤️ for ØLIV Bornholm
