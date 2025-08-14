# Media Showcase for hobbyists

A personal gallery for hobby photos & curated content:
```bash
Home
├── page1
├── page2
├── page...etc...
└── inspo
```
Powered by Cloudinary's image repository and deno's task runner to set-up the site.

![Gallery layout example](https://media.discordapp.net/attachments/1395202571068510328/1404042556651733074/image.png?ex=6899c007&is=68986e87&hm=22c6f92aa4b4c883bf5a9e9b4bc635af8424730139e871df4a9b46f0e6a65447&=&format=webp&quality=lossless&width=2198&height=1260)

## Setup Guide (via deno task)

deno task enables you to run scripts to modify code instead of manually editing files. also once you've set up your site layout, you can simply add images via the online cloudinary dashboard for code-free portfolio management.

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
3. Upload images to `/assets` and tag their metadata (e.g., "street", "portrait", "landscape") --> you can do this later but they should match the pages/routes you setup

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
[read more here](https://docs.deno.com/deploy/manual/deployctl/)
*I'll update deployment docs later*

## Commands

- `deno task setup` - Initial configuration wizard
- `deno task dev` - Development server with hot reload
- `deno task add-links` - Add YouTube videos to inspo page
- `deno task edit` - Edit all site content
- `deno task deploy` - Deploy to Deno Deploy

## How It Works

1. **Routes = Tags**: Gallery routes automatically use their names as Cloudinary tags
   - Route `/street` → Cloudinary tag `street`
   - Route `/portrait` → Cloudinary tag `portrait`

2. **Content Management**: All content stored in `content.json`
   - Site info, navigation, galleries, inspiration links
   - Hot-reloads when edited

3. **Photo Management**: Upload to Cloudinary with matching tags
   - Images automatically appear in galleries
   - Responsive optimization built-in
