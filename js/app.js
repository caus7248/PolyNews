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
        ? `${pubDate.toLocaleString("en-GB", { timeZone: "UTC" })} UTC`
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
  const economistStatus = document.getElementById("economist-status");
  const foreignAffairsStatus = document.getElementById("foreign-affairs-status");
  const feedState = {
    economist: null,
    foreignAffairs: null
  };

  const updateFeedStatus = () => {
    if (!status) return;
    const states = Object.values(feedState);
    const loading = states.includes(null);
    const liveCount = states.filter((state) => state === true).length;

    if (loading && liveCount === 0) {
      status.textContent = "Media feed status: Loading";
      return;
    }

    if (!loading && liveCount === 2) {
      status.textContent = "Media feed status: Live";
      return;
    }

    if (!loading && liveCount === 0) {
      status.textContent = "Media feed status: Static mode";
      return;
    }

    status.textContent = loading
      ? "Media feed status: Partial live (updating)"
      : "Media feed status: Partial live";
  };

  const loadFeed = async (key, targetId, source) => {
    const sourceStatus = key === "economist" ? economistStatus : foreignAffairsStatus;
    const sourceList = document.getElementById(targetId);
    try {
      const items = await fetchFeed(source.url);
      renderFeed(targetId, items);
      feedState[key] = true;
      if (sourceStatus) {
        sourceStatus.textContent = `${source.title}: Live`;
      }
      if (sourceList) {
        sourceList.setAttribute("aria-label", `${source.title} live feed items`);
      }
    } catch {
      renderFeed(targetId, source.fallback);
      feedState[key] = false;
      if (sourceStatus) {
        sourceStatus.textContent = `${source.title}: Static fallback`;
      }
      if (sourceList) {
        sourceList.setAttribute("aria-label", `${source.title} static fallback items`);
      }
    } finally {
      updateFeedStatus();
    }
  };

  updateFeedStatus();
  await Promise.all([
    loadFeed("economist", "economist-feed", FEEDS.economist),
    loadFeed("foreignAffairs", "foreign-affairs-feed", FEEDS.foreignAffairs)
  ]);
}

updateClock();
setInterval(updateClock, 1000);
bootFeeds().catch(() => {
  const status = document.getElementById("feed-status");
  const economistStatus = document.getElementById("economist-status");
  const foreignAffairsStatus = document.getElementById("foreign-affairs-status");
  if (status) {
    status.textContent = "Media feed status: Static mode";
  }
  if (economistStatus) {
    economistStatus.textContent = "The Economist: Static fallback";
  }
  if (foreignAffairsStatus) {
    foreignAffairsStatus.textContent = "Foreign Affairs: Static fallback";
  }
  renderFeed("economist-feed", FEEDS.economist.fallback);
  renderFeed("foreign-affairs-feed", FEEDS.foreignAffairs.fallback);
  const economistList = document.getElementById("economist-feed");
  const foreignAffairsList = document.getElementById("foreign-affairs-feed");
  if (economistList) {
    economistList.setAttribute("aria-label", "The Economist static fallback items");
  }
  if (foreignAffairsList) {
    foreignAffairsList.setAttribute("aria-label", "Foreign Affairs static fallback items");
  }
});
