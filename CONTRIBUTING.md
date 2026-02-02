# Contributing to Peaks Challenge Pacing Calculator

Thanks for your interest in improving the calculator! 🚴

## How to Contribute

1. **Fork** the repository
2. **Create a branch** for your changes (`git checkout -b my-feature`)
3. **Make your changes** and test locally
4. **Commit** with a clear message
5. **Push** to your fork
6. **Open a Pull Request** against `main`

## What We're Looking For

### 🐛 Bug Fixes
- Calculation errors
- Display issues
- Mobile responsiveness problems

### 📊 Better Data
- More accurate segment gradients
- Additional validation data points (anonymised finish times with splits)
- Improved physics modeling

### ✨ New Features
- Elevation profile visualisation
- Save/share profile links
- Compare multiple scenarios
- Weather adjustments

### 📝 Documentation
- Clearer methodology explanations
- Additional assumptions documentation

## Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/peaks-calc.git
cd peaks-calc

# Start local server
python3 -m http.server 8080

# Open http://localhost:8080
```

## Code Style

- Keep it simple — vanilla HTML/CSS/JS
- No build tools or frameworks required
- Mobile-first responsive design
- Comment complex calculations

## Pull Request Guidelines

- One feature/fix per PR
- Include before/after screenshots for UI changes
- For calculation changes, show validation data
- Update README if adding features

## Questions?

Open an issue if you're unsure about something before starting work.

---

All contributions will be reviewed by the maintainer before merging.
