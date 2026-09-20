const API_BASE = "https://hacker-news.firebaseio.com/v0";
const MAX_ITEMS = 25;
const REFRESH_MS = 60000;

const storiesEl = document.getElementById("stories");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search");
const minScoreEl = document.getElementById("min-score");
const minScoreValueEl = document.getElementById("min-score-value");
const refreshEl = document.getElementById("refresh");

let stories = [];

const setStatus = (text) => {
  statusEl.textContent = text;
};

const signalScore = (item) => {
  const points = Number(item.score || 0);
  const comments = Number(item.descendants || 0);
  return Math.round(points * 0.7 + comments * 0.3);
};

const formatMinutesAgo = (unixSeconds) => {
  const diff = Math.max(1, Math.floor((Date.now() - unixSeconds * 1000) / 60000));
  return `${diff}m ago`;
};

const render = () => {
  const query = searchEl.value.trim().toLowerCase();
  const minSignal = Number(minScoreEl.value);

  const filtered = stories
    .filter((story) => signalScore(story) >= minSignal)
    .filter((story) => !query || story.title.toLowerCase().includes(query));

  if (!filtered.length) {
    storiesEl.innerHTML = "<li>No stories match current filters.</li>";
    return;
  }

  storiesEl.innerHTML = filtered
    .map((story) => {
      const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
      return `
      <li class="story">
        <h2><a href="${url}" target="_blank" rel="noopener noreferrer">${story.title}</a></h2>
        <p class="meta"><span class="signal">Signal ${signalScore(story)}</span> · ${story.score || 0} points · ${story.descendants || 0} comments · ${formatMinutesAgo(story.time)}</p>
      </li>`;
    })
    .join("");
};

const fetchStories = async () => {
  setStatus("Loading live stories…");
  try {
    const ids = await fetch(`${API_BASE}/topstories.json`).then((r) => r.json());
    const topIds = ids.slice(0, MAX_ITEMS);
    const items = await Promise.all(
      topIds.map((id) => fetch(`${API_BASE}/item/${id}.json`).then((r) => r.json()))
    );

    stories = items
      .filter((item) => item && item.type === "story" && item.title)
      .sort((a, b) => signalScore(b) - signalScore(a));

    const stamp = new Date().toLocaleTimeString();
    setStatus(`Showing ${stories.length} stories · last refreshed ${stamp}`);
    render();
  } catch (error) {
    setStatus("Unable to fetch live stories right now.");
    console.error(error);
  }
};

searchEl.addEventListener("input", render);
minScoreEl.addEventListener("input", () => {
  minScoreValueEl.textContent = minScoreEl.value;
  render();
});
refreshEl.addEventListener("click", fetchStories);

fetchStories();
setInterval(fetchStories, REFRESH_MS);
