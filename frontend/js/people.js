/* ==========================================
   VISUAL COMPANION — PEOPLE MANAGER
========================================== */
window.People = {
  list: [],

  /* ===============================
     LOAD PEOPLE FROM BACKEND
  =============================== */
  async load() {
    try {
      const res = await fetch(Config.API_BASE + Config.ENDPOINTS.people);
      const data = await res.json();

      this.list = Array.isArray(data) ? data : [];
      this.render();

      console.log(`Loaded ${this.list.length} people ✅`);
    } catch (err) {
      console.error("❌ Failed to load people:", err);
    }
  },

  /* ===============================
     SAVE PERSON TO BACKEND
  =============================== */
  async save(name, imageBlob) {
    // Basic validation
    if (!name || name.trim() === "") {
      console.warn("❌ Name missing");
      App?.showToast?.("Name is required");
      return;
    }

    if (!imageBlob) {
      console.warn("❌ Image missing");
      App?.showToast?.("Image is required");
      return;
    }

    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("image", imageBlob);

      const res = await fetch(Config.API_BASE + Config.ENDPOINTS.savePerson, {
        method: "POST",
        body: form
      });

      const data = await res.json();
      console.log("Save response:", data);

      // Handle success safely (backend-compatible)
      if (data && (data.success || data.person)) {
        const person = data.person || {
          name: name.trim(),
          imageUrl: null,
          timestamp: new Date().toISOString()
        };

        // Add to list and re-render
        this.list.unshift(person);
        this.render();

        Speech?.speak?.(`${name} has been saved.`);
        App?.showToast?.(`✅ Saved: ${name}`);
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (err) {
      console.error("❌ Failed to save person:", err);
      Speech?.speak?.("Sorry, I could not save that person.");
      App?.showToast?.("Failed to save person");
    }
  },

  /* ===============================
     RENDER PEOPLE LIST IN UI
  =============================== */
  render() {
    const pane = document.getElementById("pane-people");
    const empty = document.getElementById("emptyPeople");

    if (!pane) return;

    // Remove old cards
    pane.querySelectorAll(".person-card").forEach(c => c.remove());

    if (!this.list || this.list.length === 0) {
      if (empty) empty.style.display = "flex";
      return;
    }

    if (empty) empty.style.display = "none";

    this.list.forEach(person => {
      const card = document.createElement("div");
      card.className = "person-card";

      const imgUrl = person.photoUrl || person.imageUrl;

      const avatarHtml = imgUrl
        ? `
          <img
            class="person-avatar-img"
            src="${imgUrl}"
            alt="${person.name}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="person-avatar" style="display:none;">👤</div>
        `
        : `<div class="person-avatar">👤</div>`;

      card.innerHTML = `
        <div class="person-avatar-wrap">
          ${avatarHtml}
        </div>
        <div class="person-info">
          <div class="person-name">${person.name || "Unknown"}</div>
          <div class="person-time">
            ${person.timestamp ? new Date(person.timestamp).toLocaleString() : ""}
          </div>
        </div>
      `;

      pane.appendChild(card);
    });
  }
};
