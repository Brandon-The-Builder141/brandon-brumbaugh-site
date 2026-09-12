// Groups the Iron Legion Contracting LLC photo set (assets/images/iron-legion)
// into distinct job sites, so the "job site graph" can connect each photo to
// the property it was actually taken at instead of showing one flat pile.
//
// There's no EXIF/GPS/caption data on these photos (stripped by whatever app
// they were exported from), so this grouping is a best-effort visual read —
// same house siding, same fence, same yard features, a visible house number
// in a couple of shots. It is NOT sourced from client records. If a grouping
// is wrong, this is the one file to fix — nothing else needs to change.

// Explicit filenames (extensions vary by source photo, so this is safer than
// reconstructing them from a rule):
const FILES = {
  1: 'job-01.png', 2: 'job-02.jpeg', 3: 'job-03.jpeg', 4: 'job-04.jpeg', 5: 'job-05.jpeg',
  6: 'job-06.jpeg', 7: 'job-07.jpeg', 8: 'job-08.jpeg', 9: 'job-09.jpeg', 10: 'job-10.jpeg',
  11: 'job-11.jpeg', 12: 'job-12.jpeg', 13: 'job-13.jpeg', 14: 'job-14.jpeg', 15: 'job-15.jpeg',
  16: 'job-16.jpeg', 17: 'job-17.jpeg', 18: 'job-18.jpeg', 19: 'job-19.jpeg', 20: 'job-20.jpeg',
  21: 'job-21.jpg', 22: 'job-22.jpg', 23: 'job-23.jpg', 24: 'job-24.jpeg', 25: 'job-25.jpeg',
  26: 'job-26.jpeg', 27: 'job-27.jpeg', 28: 'job-28.jpg', 29: 'job-29.jpg', 30: 'job-30.jpeg',
  31: 'job-31.jpeg', 32: 'job-32.jpeg', 33: 'job-33.jpeg', 34: 'job-34.jpeg', 35: 'job-35.jpeg',
  36: 'job-36.jpeg', 37: 'job-37.jpeg', 38: 'job-38.jpeg', 39: 'job-39.jpeg', 40: 'job-40.jpeg',
  41: 'job-41.jpeg', 42: 'job-42.jpeg', 43: 'job-43.jpeg', 44: 'job-44.jpeg', 45: 'job-45.jpeg',
  46: 'job-46.jpg', 47: 'job-47.jpeg', 48: 'job-48.jpg'
};
const path = n => 'assets/images/iron-legion/' + FILES[n];

export const JOB_SITES = [
  {
    id: 'site-pool-patio',
    name: 'Pool, Fence & Patio',
    note: 'Fence teardown and rebuild around an existing pool, a covered patio addition, and a backyard fire pit and garden bed.',
    photos: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17].map(path)
  },
  {
    id: 'site-carport',
    name: 'Carport & Mailbox Post',
    note: 'An attached aluminum carport, a freestanding wood-framed carport, and a paver-ringed mailbox post at the same property.',
    photos: [19, 20, 24, 25, 26, 27, 28, 29].map(path)
  },
  {
    id: 'site-deck-brick',
    name: 'Deck, Soffit & Landscaping',
    note: 'A backyard deck and pergola build, soffit/fascia repair, and landscaping at a brick house with a backyard playset.',
    photos: [1, 21, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 46, 47].map(path)
  },
  {
    id: 'site-porch-screen',
    name: 'Porch Privacy Screen',
    note: 'A pergola frame and a striped privacy screen built onto the front porch.',
    photos: [18, 30, 31, 48].map(path)
  },
  {
    id: 'site-composite-deck',
    name: 'Composite Deck Build',
    note: 'A composite deck poured and framed in a townhouse backyard.',
    photos: [22, 23].map(path)
  },
  {
    id: 'site-front-bed',
    name: 'Front Bed & Walkway',
    note: 'Front-yard bush removal and a fresh mulch bed along the walkway.',
    photos: [42, 43, 44, 45].map(path)
  },
  {
    id: 'site-step-rebuild',
    name: 'Deck Step Rebuild',
    note: 'Old deck steps torn out and rebuilt.',
    photos: [12, 13, 14].map(path)
  }
];

export function totalPhotoCount() {
  return JOB_SITES.reduce((sum, s) => sum + s.photos.length, 0);
}
