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
      this.list = data;
      this.render();
    } catch (err) {
      console.error("Failed to load people:", err);
    }
  },

  /* ===============================
     SAVE PERSON TO BACKEND
  =============================== */
  async save(name, imageBlob) {
    try {
      const form = new FormData();
      form.append("name", name);
      if (imageBlob) form.append("image", imageBlob);

      const res = await fetch(Config.API_BASE + Config.ENDPOINTS.savePerson, {
        method: "POST",
        body: form
      });
      const data = await res.json();

      if (data.success) {
        this.list.push(data.person);
        this.render();
        Speech.speak(`${name} has been saved.`);
        App.showToast(`✅ Saved: ${name}`);
      }
    } catch (err) {
      console.error("Failed to save person:", err);
      Speech.speak("Sorry, I could not save that person.");
    }
  },

  /* ===============================
     RENDER PEOPLE LIST IN UI
  =============================== */
  render() {
    const pane = document.getElementById("pane-people");
    const empty = document.getElementById("emptyPeople");

    // Remove old cards
    pane.querySelectorAll(".person-card").forEach(c => c.remove());

    if (this.list.length === 0) {
      if (empty) empty.style.display = "flex";
      return;
    }

    if (empty) empty.style.display = "none";

    this.list.forEach(person => {
      const card = document.createElement("div");
      card.className = "person-card";
      card.innerHTML = `
        <div class="person-avatar">👤</div>
        <div class="person-info">
          <div class="person-name">${person.name}</div>
          <div class="person-time">${new Date(person.timestamp).toLocaleString()}</div>
        </div>
      `;
      pane.appendChild(card);
    });
  }
};
