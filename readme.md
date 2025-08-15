# Media Showcase for hobbyists

A personal gallery for hobby photos & curated content:

```bash
Home
├── gallery1 # name should correspond to tag
├── gallery2 # name should correspond to tag
├── gallery...etc...
└── inspo
```

Powered by Cloudinary's image repository and deno's task runner to set-up the
site.

![Gallery layout example](./static/landscape_sample.png)

## Setup Guide (via deno task)

deno task enables you to run scripts to modify code instead of manually editing
files. also once you've set up your site layout, you can simply add images via
the online cloudinary dashboard for code-free portfolio management.

### 1. Install Deno

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows
irm https://deno.land/install.ps1 | iex
```

### 2. Setup a Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the [Dashboard](https://cloudinary.com/console)
3. Upload images to `/assets` and tag their metadata (e.g., "street",
   "portrait", "landscape") --> you can do this later but they should match the
   pages/routes you setup

### 3. Configure Your Site

```bash
# run the interactive setup
deno task setup
```

This will:

- Set your name, bio, and quote
- Define gallery routes (auto-maps to Cloudinary tags)
- Create a .env file with Cloudinary credentials

### 4. Add Content

```bash
# add videos or links to your inspiration page
deno task add-links

# edit all content
deno task edit
```

### 5. Run Your Site

```bash
deno task dev
```

Open http://localhost:8737 to view your site locally

OR

### 6. Deploy Your Site

```bash
deno task deploy
```

[read more here on deployment](https://docs.deno.com/deploy/manual/deployctl/)
--> _I'll update deployment docs later_

## Commands

- `deno task setup` - Initial configuration wizard
- `deno task dev` - Development server with hot reload
- `deno task add-links` - Add links to inspirations page
- `deno task edit` - Edit all site content
- `deno task deploy` - Deploy to Deno Deploy
- `deno task test` - Run all tests
- `deno task ci` - Full CI check (fmt, lint, test)

## How It Works

1. **Routes = Tags**: Gallery routes automatically use their names as Cloudinary
   tags
   - Route OR Gallery: `/street` → Cloudinary tag `street`
   - Route OR Gallery: `/portrait` → Cloudinary tag `portrait`

2. **Content/Structure Management**: All website structure stored in
   `content.json`
   - Site info, navigation, galleries, inspiration links
   - Hot-reloads when edited
   - Any information not set by scripts, can be edited directly in
     `content.json`

3. **Photo Management**: Upload to Cloudinary with matching tags
   - Images automatically appear in galleries
   - Responsive optimization built-in

4. **Cache Management**: Cache images and videos locally for faster loading
   (zero-maintenance due to automatic clearing)
   - Images and videos are cached in `/cache`
   - Cache is automatically cleared when content is edited
   - `/api/cache/status endpoint` shows:
     - Current memory usage vs limits
     - Which entries are expired
     - Active requests in progress
     - Cache hit rates (indirectly via age)
