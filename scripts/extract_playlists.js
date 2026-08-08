import https from 'https';
import fs from 'fs';

function fetchPlaylistItems(playlistId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };

    https.get(url, options, (res) => {
      let html = '';
      res.on('data', (chunk) => html += chunk);
      res.on('end', () => {
        const videoMatches = [];
        const seen = new Set();

        // Extract video IDs and titles using regex matching
        const regex = /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
        let m;
        while ((m = regex.exec(html)) !== null) {
          const id = m[1];
          const title = m[2];
          if (!seen.has(id) && title && !title.includes('YouTube') && title.length > 2) {
            seen.add(id);
            videoMatches.push({ videoId: id, title: title });
          }
        }

        // Fallback pattern if first regex didn't catch all
        if (videoMatches.length === 0) {
          const matches = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g) || [];
          const ids = [...new Set(matches.map(x => x.replace('/watch?v=', '')))];
          ids.forEach((id, idx) => {
            if (!seen.has(id)) {
              seen.add(id);
              videoMatches.push({ videoId: id, title: `Lesson ${idx + 1}` });
            }
          });
        }

        resolve(videoMatches);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const playlists = [
    { key: 'flutter', plId: 'PLjxrf2q8roU23XGwz3Km7sQZFTdB996iG', name: 'Flutter Widget of the Week' },
    { key: 'careerDefiner', plId: 'PLAr0hfIonl-GxRd26o0YHhOb6czgvNN9M', name: 'Career Definer Quant' },
    { key: 'fcc', plId: 'PLWKjhJtqVAbmGw5fN5BQlwuug-8bDmabi', name: 'freeCodeCamp CS' },
    { key: 'feelFree', plId: 'PLOoogDtEDyvvqaKSM-ZkwAqUyjyR402HH', name: 'Feel Free to Learn' },
    { key: 'english', plId: 'PLvXbn5FzrrpJ1Axf8lyo9bj0gs9j8DF6v', name: 'English Connection' }
  ];

  const results = {};
  for (const pl of playlists) {
    const items = await fetchPlaylistItems(pl.plId);
    console.log(`=== ${pl.name} (${items.length} videos found) ===`);
    items.slice(0, 5).forEach((item, i) => {
      console.log(`  Lesson ${i + 1}: [${item.videoId}] ${item.title}`);
    });
    results[pl.key] = items;
  }

  fs.writeFileSync('./scripts/playlist_items.json', JSON.stringify(results, null, 2));
  console.log('Saved to scripts/playlist_items.json');
}

run();
