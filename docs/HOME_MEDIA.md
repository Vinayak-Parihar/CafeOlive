# Home Page Media

Website imagery is stored on the existing `Restaurant` settings document in the `homeMedia` array. The public pages read current values from `GET /api/home/media`; admin and manager users manage them from `/admin/settings` through the protected `/api/admin/home-media` endpoints.

## Image Mapping

| Home Page section | Image key | Current component | Admin field |
|---|---|---|---|
| Hero / Banner | `hero` | `LandingPage.jsx` hero background | Hero / Banner |
| Our Vibe | `our-vibe` | `LandingPage.jsx` Our Sanctuary image | Our Vibe |
| Venue & Ambience | `ambience-lounge` | `LandingPage.jsx` Bungalow Lounge card | Bungalow Lounge |
| Venue & Ambience | `ambience-garden` | `LandingPage.jsx` Garden Patio card | Garden Patio |
| Venue & Ambience | `ambience-veranda` | `LandingPage.jsx` Neon Veranda card | Neon Veranda |
| Entertainment & Events | `mini-theatre` | `LandingPage.jsx` Private Mini Theatre card | Private Mini Theatre |
| Entertainment & Events | `party-halls` | `LandingPage.jsx` Bespoke Party Halls card | Party Halls |
| Captured Moments | `gallery-1` | `LandingPage.jsx` gallery preview tile 1 | Captured Moment 1 |
| Captured Moments | `gallery-2` | `LandingPage.jsx` gallery preview tile 2 | Captured Moment 2 |
| Captured Moments | `gallery-3` | `LandingPage.jsx` gallery preview tile 3 | Captured Moment 3 |
| Captured Moments | `gallery-4` | `LandingPage.jsx` gallery preview tile 4 | Captured Moment 4 |

Gallery records use the same media store with `section: "gallery"`. Settings supports replacing the seeded Gallery images, adding new records, and removing individual records while preserving their order.

## Admin Flow

1. Admin or manager opens `/admin/settings`.
2. The selected image is validated in the browser and again by multer on the server: image MIME type and maximum 5 MB.
3. The file is uploaded through the existing Cloudinary utility.
4. The Cloudinary secure URL and public ID replace the matching `imageKey` in MongoDB.
5. The previous Cloudinary asset is removed after a successful replacement.
6. Removing an image clears its URL and disables that slot without changing the layout.
7. The public LandingPage fetches the latest media response on load. Missing unconfigured slots use the server-defined initial image URL; explicitly removed slots render a graceful empty visual.
