const STORAGE_PREFIX = "okitegami-cockpit:";
const positionOutput = document.getElementById("position-output");
const resetButton = document.getElementById("reset-button");

function key(name) {
  return `${STORAGE_PREFIX}${name}`;
}

function updateClock() {
  const now = new Date();
  const clock = document.getElementById("clock-output");
  const date = document.getElementById("date-output");

  if (clock) {
    clock.textContent = now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (date) {
    date.textContent = now.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short"
    });
  }
}

function loadValue(element) {
  const storeName = element.dataset.store;
  if (!storeName) return;

  const stored = localStorage.getItem(key(storeName));

  if (element.type === "checkbox") {
    element.checked = stored === "true";
    return;
  }

  if (stored !== null) {
    element.value = stored;
  }
}

function saveValue(element) {
  const storeName = element.dataset.store;
  if (!storeName) return;

  if (element.type === "checkbox") {
    localStorage.setItem(key(storeName), String(element.checked));
    return;
  }

  localStorage.setItem(key(storeName), element.value);
}

function setPosition(label) {
  localStorage.setItem(key("position"), label);
  if (positionOutput) {
    positionOutput.textContent = `現在のポジション：${label}`;
  }

  document.querySelectorAll("[data-position]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.position === label);
  });
}

function loadPosition() {
  const stored = localStorage.getItem(key("position"));
  if (stored) {
    setPosition(stored);
  }
}

function resetToday() {
  if (!confirm("cockpit の今日の入力を消しますか？")) return;

  Object.keys(localStorage)
    .filter((storageKey) => storageKey.startsWith(STORAGE_PREFIX))
    .forEach((storageKey) => localStorage.removeItem(storageKey));

  document.querySelectorAll("[data-store]").forEach((element) => {
    if (element.type === "checkbox") {
      element.checked = false;
    } else {
      element.value = "";
    }
  });

  document.querySelectorAll("[data-position]").forEach((button) => {
    button.classList.remove("is-selected");
  });

  if (positionOutput) {
    positionOutput.textContent = "未選択";
  }
}

document.querySelectorAll("[data-store]").forEach((element) => {
  loadValue(element);
  element.addEventListener("input", () => saveValue(element));
  element.addEventListener("change", () => saveValue(element));
});

document.querySelectorAll("[data-position]").forEach((button) => {
  button.addEventListener("click", () => setPosition(button.dataset.position));
});

resetButton?.addEventListener("click", resetToday);

updateClock();
setInterval(updateClock, 30 * 1000);
loadPosition();
