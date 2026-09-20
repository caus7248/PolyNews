const RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json?rss_url=";

const FEEDS = {
  economist: {
    url: "https://www.economist.com/international/rss.xml",
    title: "The Economist",
    fallback: [
      {
        title: "Global inflation outlook and policy divergence",
        link: "https://www.economist.com/",
        pubDate: "Static fallback"
      },
      {
        title: "Supply chains, sanctions, and regional blocs",
        link: "https://www.economist.com/",
        pubDate: "Static fallback"
      }
    ]
  },
  foreignAffairs: {
    url: "https://www.foreignaffairs.com/rss.xml",
    title: "Foreign Affairs",
    fallback: [
      {
        title: "Statecraft, deterrence, and alignment trends",
        link: "https://www.foreignaffairs.com/",
        pubDate: "Static fallback"
      },
      {
        title: "Institutions under multipolar pressure",
        link: "https://www.foreignaffairs.com/",
        pubDate: "Static fallback"
      }
    ]
  }
};

function updateClock() {
  const el = document.getElementById("live-clock");
  if (!el) return;
  const now = new Date();
  el.textContent = `${now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" })} UTC`;
}

function renderFeed(targetId, items) {
  const list = document.getElementById(targetId);
  if (!list) return;

  list.innerHTML = "";
  items.slice(0, 5).forEach((item) => {
    const li = document.createElement("li");
    const entry = document.createElement("span");
    const meta = document.createElement("span");
    const hasValidLink = typeof item.link === "string" && /^https?:\/\//i.test(item.link);

    if (hasValidLink) {
      const a = document.createElement("a");
      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.title || "Untitled";
      li.appendChild(a);
    } else {
      entry.textContent = item.title || "Untitled";
      li.appendChild(entry);
    }

    meta.className = "feed-meta";
    const rawPubDate = typeof item.pubDate === "string" ? item.pubDate.trim() : "";
    const pubDate = rawPubDate ? new Date(rawPubDate) : null;
    meta.textContent =
      pubDate && !Number.isNaN(pubDate.getTime())
        ? pubDate.toLocaleString()
        : rawPubDate
          ? rawPubDate
        : "Date unavailable";

    li.appendChild(meta);
    list.appendChild(li);
  });
}

async function fetchFeed(url) {
  const requestUrl = `${RSS2JSON_ENDPOINT}${encodeURIComponent(url)}`;
  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.status !== "ok") {
    throw new Error(payload?.message || "Feed service error");
  }
  if (!payload?.items?.length) {
    throw new Error("No feed items returned");
  }

  return payload.items;
}

async function bootFeeds() {
  const status = document.getElementById("feed-status");
  const [economistResult, foreignAffairsResult] = await Promise.allSettled([
    fetchFeed(FEEDS.economist.url),
    fetchFeed(FEEDS.foreignAffairs.url)
  ]);

  const economistLive = economistResult.status === "fulfilled";
  const foreignAffairsLive = foreignAffairsResult.status === "fulfilled";

  renderFeed(
    "economist-feed",
    economistLive ? economistResult.value : FEEDS.economist.fallback
  );
  renderFeed(
    "foreign-affairs-feed",
    foreignAffairsLive ? foreignAffairsResult.value : FEEDS.foreignAffairs.fallback
  );

  if (status) {
    status.textContent =
      economistLive && foreignAffairsLive
        ? "Live"
        : economistLive || foreignAffairsLive
          ? "Partial live"
          : "Static mode";
  }
}

updateClock();
setInterval(updateClock, 1000);
bootFeeds().catch(() => {
  const status = document.getElementById("feed-status");
  if (status) {
    status.textContent = "Static mode";
  }
  renderFeed("economist-feed", FEEDS.economist.fallback);
  renderFeed("foreign-affairs-feed", FEEDS.foreignAffairs.fallback);
});
