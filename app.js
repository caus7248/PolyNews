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

const updateMinSignalA11y = () => {
  minScoreEl.setAttribute("aria-valuenow", minScoreEl.value);
  minScoreEl.setAttribute("aria-valuetext", minScoreEl.value);
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
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
    storiesEl.textContent = "";
    const emptyEl = document.createElement("li");
    emptyEl.textContent = "No stories match current filters.";
    storiesEl.appendChild(emptyEl);
    return;
  }

  storiesEl.textContent = "";
  filtered.forEach((story) => {
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

    const itemEl = document.createElement("li");
    itemEl.className = "story";

    const titleEl = document.createElement("h2");
    const linkEl = document.createElement("a");
    linkEl.href = url;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.textContent = story.title;
    titleEl.appendChild(linkEl);

    const metaEl = document.createElement("p");
    metaEl.className = "meta";

    const signalEl = document.createElement("span");
    signalEl.className = "signal";
    signalEl.textContent = `Signal ${signalScore(story)}`;

    const metaTextEl = document.createTextNode(
      ` · ${story.score || 0} points · ${story.descendants || 0} comments · ${formatMinutesAgo(story.time)}`
    );
    metaEl.append(signalEl, metaTextEl);
    itemEl.append(titleEl, metaEl);
    storiesEl.appendChild(itemEl);
  });
};

const fetchStories = async () => {
  setStatus("Loading live stories…");
  try {
    const ids = await fetchJson(`${API_BASE}/topstories.json`);
    const topIds = ids.slice(0, MAX_ITEMS);
    const itemResults = await Promise.allSettled(
      topIds.map((id) => fetchJson(`${API_BASE}/item/${id}.json`))
    );
    const items = itemResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    stories = items
      .filter((item) => item && item.type === "story" && item.title)
      .sort((a, b) => signalScore(b) - signalScore(a));

    render();
    const stamp = new Date().toLocaleTimeString();
    setStatus(`Showing ${stories.length} stories · last refreshed ${stamp}`);
  } catch (error) {
    if (stories.length) {
      setStatus("Unable to refresh live stories right now. Showing last successful results.");
    } else {
      storiesEl.textContent = "";
      const messageEl = document.createElement("li");
      messageEl.textContent = "Unable to load stories right now.";
      storiesEl.appendChild(messageEl);
      setStatus("Unable to fetch live stories right now.");
    }
    console.error(error);
  }
};

searchEl.addEventListener("input", render);
minScoreEl.addEventListener("input", () => {
  minScoreValueEl.textContent = minScoreEl.value;
  updateMinSignalA11y();
  render();
});
refreshEl.addEventListener("click", fetchStories);

updateMinSignalA11y();
fetchStories();
setInterval(fetchStories, REFRESH_MS);
