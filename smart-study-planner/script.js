/**
 * SMART STUDY PLANNER • PRO
 * Fully Client-Side Gamified Study Suite
 * No External APIs • 100% Offline Capable
 */

(function () {
    "use strict";

    // ==========================================
    // 1. STATE & STORAGE MANAGEMENT
    // ==========================================

    const STORAGE_KEYS = {
        TASKS: "ssp_tasks_v2",
        THEME: "ssp_theme_v2",
        XP: "ssp_xp_v2",
        STREAK: "ssp_streak_v2",
        LAST_ACTIVE: "ssp_last_active_v2",
        BEST_STREAK: "ssp_best_streak_v2",
        POMO_COUNT: "ssp_pomo_count_v2",
        FOCUS_MINUTES: "ssp_focus_minutes_v2",
        BADGES: "ssp_badges_v2",
        FLASHCARDS: "ssp_flashcards_v2",
        NOTES: "ssp_notes_v2",
        HEATMAP: "ssp_heatmap_v2",
        AUDIO_MUTED: "ssp_audio_muted_v2",
        QUESTS: "ssp_daily_quests_v2",
        QUEST_DATE: "ssp_quest_date_v2",
        NICKNAME: "ssp_nickname_v2",
        AVATAR: "ssp_avatar_v2",
        LEAGUE: "ssp_league_v2",
        FRIENDS: "ssp_friends_v2"
    };

    const VALID_THEMES = ["neutral", "midnight", "hype", "candy", "fresh", "cyber"];
    const VALID_PRIORITIES = ["High", "Medium", "Low"];
    const VALID_SUBJECTS = ["Math", "Coding", "Science", "Language", "Humanities", "General"];

    // Default Flashcard Deck
    const DEFAULT_FLASHCARDS = [
        {
            id: "fc_1",
            subject: "General",
            front: "What is the Feynman Technique for rapid learning?",
            back: "1. Choose a concept.\n2. Teach it in plain words to a 6th grader.\n3. Identify gaps in your explanation.\n4. Review reference material and simplify!",
            reviewedCount: 0
        },
        {
            id: "fc_2",
            subject: "General",
            front: "What is Active Recall and why is it superior to passive rereading?",
            back: "Active recall forces the brain to retrieve information from memory rather than passively reviewing notes. Retrieval strengthens neural synapses and dramatically slows forgetting.",
            reviewedCount: 0
        },
        {
            id: "fc_3",
            subject: "Coding",
            front: "What is Time Complexity and Big-O notation?",
            back: "Big-O measures the upper-bound asymptotic runtime or space requirement of an algorithm as the input size (n) grows towards infinity (e.g. O(1), O(log n), O(n), O(n log n), O(n²)).",
            reviewedCount: 0
        },
        {
            id: "fc_4",
            subject: "Math",
            front: "What is Euler's Identity and why is it celebrated?",
            back: "e^(i*π) + 1 = 0.\nIt links the 5 most fundamental mathematical constants (e, i, π, 1, 0) in one simple equation.",
            reviewedCount: 0
        },
        {
            id: "fc_5",
            subject: "General",
            front: "What is the Pomodoro Technique interval breakdown?",
            back: "Work with 100% focus for 25 minutes, followed by a 5-minute break. After 4 cycles, take a longer 15-30 minute restorative break.",
            reviewedCount: 0
        }
    ];

    // Badge Definitions
    const ALL_BADGES = [
        { id: "b_first_task", title: "First Victory", icon: "🎯", desc: "Complete your first study task." },
        { id: "b_high_volt", title: "High Voltage", icon: "⚡", desc: "Complete a High Priority task." },
        { id: "b_pomo_pioneer", title: "Pomodoro Pioneer", icon: "🍅", desc: "Finish your first 25m focus session." },
        { id: "b_streak_3", title: "Streak Spark", icon: "🔥", desc: "Maintain a 3-day study streak." },
        { id: "b_streak_7", title: "Consistency Titan", icon: "🌟", desc: "Reach a 7-day study streak." },
        { id: "b_recall_pro", title: "Memory Architect", icon: "🧠", desc: "Review 5 active recall flashcards." },
        { id: "b_card_creator", title: "Deck Builder", icon: "🗂️", desc: "Create a custom flashcard." },
        { id: "b_night_owl", title: "Night Owl", icon: "🦉", desc: "Complete a study task after 9 PM." },
        { id: "b_early_bird", title: "Dawn Striver", icon: "🌅", desc: "Complete a study task before 8 AM." },
        { id: "b_lvl_3", title: "Focus Knight", icon: "⚔️", desc: "Attain Level 3 scholar rank." },
        { id: "b_lvl_5", title: "Time Alchemist", icon: "👑", desc: "Attain Level 5 master rank." },
        { id: "b_quest_master", title: "Daily Dominator", icon: "🏆", desc: "Complete all daily quests in a day." }
    ];

    // Helper: Safe JSON load
    function loadStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function saveStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn("Storage write error", e);
        }
    }

    // App State
    let tasks = loadStorage(STORAGE_KEYS.TASKS, []);

    // One-time seamless migration from v1 tasks & theme
    try {
        const isMigrated = localStorage.getItem("ssp_migrated_v2");
        if (!isMigrated) {
            const legacyTasksRaw = localStorage.getItem("tasks");
            if (legacyTasksRaw) {
                const legacyTasks = JSON.parse(legacyTasksRaw);
                if (Array.isArray(legacyTasks) && legacyTasks.length > 0 && tasks.length === 0) {
                    tasks = legacyTasks.map((t, idx) => ({
                        id: t.id || `task_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
                        name: t.name || "",
                        subject: t.subject || "General",
                        priority: ["High", "Medium", "Low"].includes(t.priority) ? t.priority : "Medium",
                        deadline: t.deadline || "",
                        estMinutes: t.estMinutes || 25,
                        completed: Boolean(t.completed),
                        createdAt: t.createdAt || Date.now()
                    }));
                    saveStorage(STORAGE_KEYS.TASKS, tasks);
                }
            }
            const legacyTheme = localStorage.getItem("plannerTheme");
            if (legacyTheme && !localStorage.getItem(STORAGE_KEYS.THEME)) {
                localStorage.setItem(STORAGE_KEYS.THEME, legacyTheme);
            }
            // Mark migration as permanently completed and purge old key
            localStorage.setItem("ssp_migrated_v2", "true");
            localStorage.removeItem("tasks");
        } else {
            // Already migrated: purge any dangling legacy key so it never resurrects deleted tasks
            localStorage.removeItem("tasks");
        }
    } catch (e) {
        // Safe fallback
    }

    // Ensure every task in memory has a guaranteed unique ID and valid fields
    tasks = tasks.map((t, idx) => ({
        id: t.id || `task_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
        name: String(t.name || ""),
        subject: t.subject || "General",
        priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : "Medium",
        deadline: t.deadline || "",
        estMinutes: t.estMinutes || 25,
        completed: Boolean(t.completed),
        createdAt: t.createdAt || Date.now()
    }));

    let userXp = Number(localStorage.getItem(STORAGE_KEYS.XP)) || 0;
    let userNickname = localStorage.getItem(STORAGE_KEYS.NICKNAME) || "Scholar";
    let userAvatar = localStorage.getItem(STORAGE_KEYS.AVATAR) || "🦊";
    let userLeague = localStorage.getItem(STORAGE_KEYS.LEAGUE) || "Bronze";
    let friendsList = loadStorage(STORAGE_KEYS.FRIENDS, []);
    let selectedAvatar = userAvatar;
    let streakCount = Number(localStorage.getItem(STORAGE_KEYS.STREAK)) || 1;
    let bestStreak = Number(localStorage.getItem(STORAGE_KEYS.BEST_STREAK)) || 1;
    let lastActiveDate = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE) || "";
    let totalPomoCount = Number(localStorage.getItem(STORAGE_KEYS.POMO_COUNT)) || 0;
    let totalFocusMinutes = Number(localStorage.getItem(STORAGE_KEYS.FOCUS_MINUTES)) || 0;
    let unlockedBadges = loadStorage(STORAGE_KEYS.BADGES, []);
    let flashcards = loadStorage(STORAGE_KEYS.FLASHCARDS, DEFAULT_FLASHCARDS);
    let heatmapData = loadStorage(STORAGE_KEYS.HEATMAP, {});
    let isAudioMuted = localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED) === "true";

    // Filtering & View State
    let currentFilter = "all";
    let currentPriority = "all";
    let currentSubject = "all";
    let currentSort = "deadline";
    let taskSearchQuery = "";
    let lastDeletedTask = null;
    let taskBeingEdited = null;

    // Flashcard State
    let activeCardIndex = 0;
    let flashcardFilter = "all";

    // Date Utilities
    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getTomorrowString() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Update streak based on activity date
    function verifyAndUpdateStreak() {
        const today = getTodayString();
        if (!lastActiveDate) {
            lastActiveDate = today;
            streakCount = 1;
        } else if (lastActiveDate !== today) {
            const last = new Date(lastActiveDate + "T00:00:00");
            const curr = new Date(today + "T00:00:00");
            const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streakCount += 1;
            } else if (diffDays > 1) {
                streakCount = 1;
            }
            lastActiveDate = today;
        }

        if (streakCount > bestStreak) {
            bestStreak = streakCount;
            localStorage.setItem(STORAGE_KEYS.BEST_STREAK, String(bestStreak));
        }

        localStorage.setItem(STORAGE_KEYS.STREAK, String(streakCount));
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, lastActiveDate);

        if (streakCount >= 3) unlockBadge("b_streak_3");
        if (streakCount >= 7) unlockBadge("b_streak_7");

        renderGamifyBar();
    }

    // Record activity to heatmap
    function recordDailyActivity(points = 1) {
        const today = getTodayString();
        heatmapData[today] = (heatmapData[today] || 0) + points;
        saveStorage(STORAGE_KEYS.HEATMAP, heatmapData);
        renderHeatmap();
    }

    // ==========================================
    // 2. SYNTHESIZED SOUND & AUDIO ENGINE (WEB AUDIO API)
    // ==========================================

    let audioCtx = null;
    let ambientSourceNode = null;
    let ambientGainNode = null;
    let ambientFilterNode = null;
    let ambientLfoNode = null;
    let currentAmbientType = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    const SoundFX = {
        click: function () {
            if (isAudioMuted) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        },

        completeChime: function () {
            if (isAudioMuted) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = ctx.currentTime + idx * 0.08;
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.45);
            });
        },

        levelUpFanfare: function () {
            if (isAudioMuted) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            melody.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = ctx.currentTime + idx * 0.1;
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.2, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.55);
            });
        },

        pomoBowlGong: function () {
            if (isAudioMuted) return;
            const ctx = getAudioContext();
            if (!ctx) return;
            const freqs = [432, 864, 1296];
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.25 / (idx + 1), ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 2.6);
            });
        }
    };

    // Ambient Noise Generators (Rain, White Noise, Ocean Waves, 40Hz Binaural)
    function stopAmbient() {
        if (ambientSourceNode) {
            try { ambientSourceNode.stop(); } catch {}
            ambientSourceNode = null;
        }
        if (ambientLfoNode) {
            try { ambientLfoNode.stop(); } catch {}
            ambientLfoNode = null;
        }
        currentAmbientType = null;
        document.querySelectorAll(".ambient-sound-btn").forEach(btn => btn.classList.remove("playing"));
    }

    function startAmbient(type) {
        stopAmbient();
        const ctx = getAudioContext();
        if (!ctx) return;

        currentAmbientType = type;
        const volumeInput = document.getElementById("ambientVolumeSlider");
        const volume = volumeInput ? Number(volumeInput.value) : 0.3;

        ambientGainNode = ctx.createGain();
        ambientGainNode.gain.setValueAtTime(volume, ctx.currentTime);
        ambientGainNode.connect(ctx.destination);

        const sampleRate = ctx.sampleRate;
        const bufferDuration = 5;
        const bufferSize = sampleRate * bufferDuration;
        const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

        if (type === "whitenoise" || type === "rain" || type === "waves") {
            for (let channel = 0; channel < 2; channel++) {
                const channelData = buffer.getChannelData(channel);
                let b0 = 0, b1 = 0, b2 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    if (type === "whitenoise") {
                        channelData[i] = white * 0.2;
                    } else {
                        // Pink noise filter approximation
                        b0 = 0.99886 * b0 + white * 0.0555179;
                        b1 = 0.99332 * b1 + white * 0.0750759;
                        b2 = 0.96900 * b2 + white * 0.1538520;
                        channelData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.07;
                    }
                }
            }

            ambientSourceNode = ctx.createBufferSource();
            ambientSourceNode.buffer = buffer;
            ambientSourceNode.loop = true;

            ambientFilterNode = ctx.createBiquadFilter();

            if (type === "rain") {
                ambientFilterNode.type = "lowpass";
                ambientFilterNode.frequency.setValueAtTime(1400, ctx.currentTime);
                ambientSourceNode.connect(ambientFilterNode);
                ambientFilterNode.connect(ambientGainNode);
            } else if (type === "waves") {
                ambientFilterNode.type = "lowpass";
                ambientFilterNode.frequency.setValueAtTime(650, ctx.currentTime);

                // Modulate gain for surf effect
                ambientLfoNode = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                ambientLfoNode.frequency.setValueAtTime(0.12, ctx.currentTime);
                lfoGain.gain.setValueAtTime(0.25, ctx.currentTime);
                ambientLfoNode.connect(lfoGain.gain);

                ambientSourceNode.connect(ambientFilterNode);
                ambientFilterNode.connect(ambientGainNode);
                ambientLfoNode.start();
            } else {
                ambientSourceNode.connect(ambientGainNode);
            }

            ambientSourceNode.start();
        } else if (type === "binaural") {
            // 40Hz Gamma Concentration Beat (210Hz left, 250Hz right)
            const oscL = ctx.createOscillator();
            const oscR = ctx.createOscillator();
            const merger = ctx.createChannelMerger(2);

            oscL.type = "sine";
            oscL.frequency.setValueAtTime(210, ctx.currentTime);
            oscR.type = "sine";
            oscR.frequency.setValueAtTime(250, ctx.currentTime);

            oscL.connect(merger, 0, 0);
            oscR.connect(merger, 0, 1);
            merger.connect(ambientGainNode);

            oscL.start();
            oscR.start();

            ambientSourceNode = {
                stop: function () {
                    try { oscL.stop(); oscR.stop(); } catch {}
                }
            };
        }

        // Highlight playing button
        const targetBtn = document.querySelector(`.ambient-sound-btn[data-sound="${type}"]`);
        if (targetBtn) targetBtn.classList.add("playing");
    }

    // ==========================================
    // 3. CONFETTI BURST ENGINE (PURE HTML5 CANVAS)
    // ==========================================

    const confettiCanvas = document.getElementById("confettiCanvas");
    let confettiCtx = null;
    let confettiParticles = [];
    let confettiAnimationId = null;

    if (confettiCanvas) {
        confettiCtx = confettiCanvas.getContext("2d");
        window.addEventListener("resize", () => {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
        });
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }

    function fireConfetti(originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
        if (!confettiCtx) return;

        const colors = ["#5542f6", "#b457ff", "#ff1b8d", "#49f380", "#00f0ff", "#ff9f43", "#ffd32a"];
        const particleCount = 75;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 5 + Math.random() * 8;
            confettiParticles.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 3,
                size: 6 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                opacity: 1,
                decay: 0.015 + Math.random() * 0.02
            });
        }

        if (!confettiAnimationId) {
            renderConfetti();
        }
    }

    function renderConfetti() {
        if (!confettiCtx) return;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = confettiParticles.length - 1; i >= 0; i--) {
            const p = confettiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25; // gravity
            p.rotation += p.rotSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0 || p.y > confettiCanvas.height) {
                confettiParticles.splice(i, 1);
                continue;
            }

            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate((p.rotation * Math.PI) / 180);
            confettiCtx.fillStyle = p.color;
            confettiCtx.globalAlpha = Math.max(0, p.opacity);
            confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            confettiCtx.restore();
        }

        if (confettiParticles.length > 0) {
            confettiAnimationId = requestAnimationFrame(renderConfetti);
        } else {
            confettiAnimationId = null;
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // ==========================================
    // 4. GAMIFICATION, LEVELING & QUESTS
    // ==========================================

    const LEVEL_TIERS = [
        { level: 1, minXp: 0, maxXp: 250, title: "Novice Scholar" },
        { level: 2, minXp: 250, maxXp: 650, title: "Curious Mind" },
        { level: 3, minXp: 650, maxXp: 1300, title: "Focus Knight" },
        { level: 4, minXp: 1300, maxXp: 2200, title: "Deep Work Adept" },
        { level: 5, minXp: 2200, maxXp: 3400, title: "Time Alchemist" },
        { level: 6, minXp: 3400, maxXp: 5000, title: "Flow State Master" },
        { level: 7, minXp: 5000, maxXp: 7200, title: "High Intellect" },
        { level: 8, minXp: 7200, maxXp: 10000, title: "Zen Polymath" },
        { level: 9, minXp: 10000, maxXp: 14000, title: "Grand Master" },
        { level: 10, minXp: 14000, maxXp: 999999, title: "Supreme Polymath" }
    ];

    function getLevelInfo(xp) {
        for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_TIERS[i].minXp) {
                return LEVEL_TIERS[i];
            }
        }
        return LEVEL_TIERS[0];
    }

    function addXP(amount, reason = "") {
        const oldInfo = getLevelInfo(userXp);
        userXp += amount;
        localStorage.setItem(STORAGE_KEYS.XP, String(userXp));

        const newInfo = getLevelInfo(userXp);

        renderGamifyBar();
        renderInsights();
        renderLeaderboard();

        if (newInfo.level > oldInfo.level) {
            // Level Up!
            SoundFX.levelUpFanfare();
            fireConfetti();
            showToast(`⭐ LEVEL UP! You reached ${newInfo.level}: ${newInfo.title}!`);
            if (newInfo.level >= 3) unlockBadge("b_lvl_3");
            if (newInfo.level >= 5) unlockBadge("b_lvl_5");
        } else {
            showToast(`+${amount} XP ${reason ? "• " + reason : ""}`);
        }

        checkDailyQuestsProgress();
    }

    function renderGamifyBar() {
        const streakEl = document.getElementById("streakCount");
        const levelBadgeEl = document.getElementById("levelBadge");
        const levelTitleEl = document.getElementById("levelTitle");
        const xpFillEl = document.getElementById("xpBarFill");
        const curXpEl = document.getElementById("currentXpText");
        const nextXpEl = document.getElementById("nextLevelXpText");
        const badgePillEl = document.getElementById("badgeCountPill");
        const headerUserName = document.getElementById("headerUserName");
        const headerUserAvatar = document.getElementById("headerUserAvatar");

        if (headerUserName) headerUserName.textContent = userNickname;
        if (headerUserAvatar) headerUserAvatar.textContent = userAvatar;

        if (streakEl) streakEl.textContent = streakCount;

        const info = getLevelInfo(userXp);
        if (levelBadgeEl) levelBadgeEl.textContent = `LVL ${info.level}`;
        if (levelTitleEl) levelTitleEl.textContent = info.title;

        const range = info.maxXp - info.minXp;
        const currentWithinLevel = userXp - info.minXp;
        const percent = Math.min(100, Math.max(0, Math.round((currentWithinLevel / range) * 100)));

        if (xpFillEl) xpFillEl.style.width = `${percent}%`;
        if (curXpEl) curXpEl.textContent = userXp;
        if (nextXpEl) nextXpEl.textContent = info.maxXp > 100000 ? "MAX" : info.maxXp;
        if (badgePillEl) badgePillEl.textContent = `${unlockedBadges.length}/${ALL_BADGES.length}`;
    }

    function unlockBadge(badgeId) {
        if (unlockedBadges.includes(badgeId)) return;
        unlockedBadges.push(badgeId);
        saveStorage(STORAGE_KEYS.BADGES, unlockedBadges);

        const badge = ALL_BADGES.find(b => b.id === badgeId);
        if (badge) {
            SoundFX.levelUpFanfare();
            fireConfetti();
            showToast(`🏆 Achievement Unlocked: ${badge.title}!`);
        }

        renderGamifyBar();
        renderBadgesModal();
        renderInsights();
    }

    // Daily Quests Generator
    function getDailyQuests() {
        const today = getTodayString();
        const savedDate = localStorage.getItem(STORAGE_KEYS.QUEST_DATE);
        let quests = loadStorage(STORAGE_KEYS.QUESTS, null);

        if (savedDate !== today || !quests || quests.length === 0) {
            quests = [
                { id: "q_tasks", title: "Conquer 2 Tasks", target: 2, current: 0, xp: 35, claimed: false },
                { id: "q_pomo", title: "Complete 1 Pomodoro Session", target: 1, current: 0, xp: 40, claimed: false },
                { id: "q_cards", title: "Review 3 Flashcards", target: 3, current: 0, xp: 30, claimed: false }
            ];
            saveStorage(STORAGE_KEYS.QUESTS, quests);
            localStorage.setItem(STORAGE_KEYS.QUEST_DATE, today);
        }
        return quests;
    }

    function updateQuestProgress(questId, amount = 1) {
        const quests = getDailyQuests();
        const quest = quests.find(q => q.id === questId);
        if (quest && !quest.claimed) {
            quest.current = Math.min(quest.target, quest.current + amount);
            saveStorage(STORAGE_KEYS.QUESTS, quests);
            renderQuestsList();
        }
    }

    function checkDailyQuestsProgress() {
        renderQuestsList();
    }

    function renderQuestsList() {
        const container = document.getElementById("questsList");
        if (!container) return;

        const quests = getDailyQuests();
        container.innerHTML = "";

        let allClaimed = true;

        quests.forEach(quest => {
            if (!quest.claimed) allClaimed = false;

            const isDone = quest.current >= quest.target;
            const item = document.createElement("div");
            item.className = `quest-item ${isDone ? "completed-quest" : ""}`;

            const percent = Math.min(100, Math.round((quest.current / quest.target) * 100));

            item.innerHTML = `
                <div class="quest-info">
                    <div class="quest-title-row">
                        <span class="quest-title">${quest.title}</span>
                        <span class="quest-xp-badge">+${quest.xp} XP</span>
                    </div>
                    <div class="quest-progress-track">
                        <div class="quest-progress-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="quest-status-text">${quest.current} / ${quest.target} completed</div>
                </div>
                <button type="button" class="claim-quest-btn" data-qid="${quest.id}" ${(!isDone || quest.claimed) ? "disabled" : ""}>
                    ${quest.claimed ? "Claimed ✓" : (isDone ? "Claim XP 🎁" : "In Progress")}
                </button>
            `;

            container.appendChild(item);
        });

        if (allClaimed) {
            unlockBadge("b_quest_master");
        }

        container.querySelectorAll(".claim-quest-btn:not([disabled])").forEach(btn => {
            btn.addEventListener("click", () => {
                const qid = btn.dataset.qid;
                const currentQuests = getDailyQuests();
                const q = currentQuests.find(item => item.id === qid);
                if (q && !q.claimed) {
                    q.claimed = true;
                    saveStorage(STORAGE_KEYS.QUESTS, currentQuests);
                    SoundFX.completeChime();
                    fireConfetti();
                    addXP(q.xp, `Quest Completed: ${q.title}`);
                    renderQuestsList();
                }
            });
        });
    }

    // ==========================================
    // 5. TOAST NOTIFICATION & UNDO
    // ==========================================

    let toastTimer = null;

    function showToast(message, showUndo = false, onUndo = null) {
        const toast = document.getElementById("toastNotification");
        const msgEl = document.getElementById("toastMessage");
        const undoBtn = document.getElementById("toastUndoBtn");

        if (!toast || !msgEl || !undoBtn) return;

        msgEl.textContent = message;

        if (showUndo && onUndo) {
            undoBtn.hidden = false;
            undoBtn.onclick = function () {
                onUndo();
                toast.classList.remove("show");
            };
        } else {
            undoBtn.hidden = true;
            undoBtn.onclick = null;
        }

        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3600);
    }

    // ==========================================
    // 6. TASKS MANAGEMENT ENGINE
    // ==========================================

    const taskInput = document.getElementById("taskInput");
    const taskSubject = document.getElementById("taskSubject");
    const taskPriority = document.getElementById("taskPriority");
    const taskDate = document.getElementById("taskDate");
    const taskEstTime = document.getElementById("taskEstTime");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const taskList = document.getElementById("taskList");
    const taskSearchInput = document.getElementById("taskSearchInput");
    const taskSortSelect = document.getElementById("taskSortSelect");
    const subjectFilterSelect = document.getElementById("subjectFilterSelect");
    const clearCompletedBtn = document.getElementById("clearCompletedBtn");

    // Modal Elements for Edit
    const editTaskModal = document.getElementById("editTaskModal");
    const editTaskName = document.getElementById("editTaskName");
    const editTaskSubject = document.getElementById("editTaskSubject");
    const editTaskPriority = document.getElementById("editTaskPriority");
    const editTaskDate = document.getElementById("editTaskDate");
    const editTaskError = document.getElementById("editTaskError");
    const saveEditBtn = document.getElementById("saveEditBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const closeEditModalBtn = document.getElementById("closeEditModalBtn");

    function saveTasks() {
        saveStorage(STORAGE_KEYS.TASKS, tasks);
        // Ensure legacy key is deleted so it can never resurrect deleted tasks
        try {
            localStorage.removeItem("tasks");
        } catch {}
    }

    function addTask() {
        const name = taskInput.value.trim();
        const subject = taskSubject ? taskSubject.value : "General";
        const priority = taskPriority ? taskPriority.value : "Medium";
        const deadline = taskDate ? taskDate.value : "";
        const estMinutes = taskEstTime ? Number(taskEstTime.value) : 25;

        if (!name) {
            showToast("Please enter a task name first!");
            if (taskInput) taskInput.focus();
            return;
        }

        const newTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: name,
            subject: VALID_SUBJECTS.includes(subject) ? subject : "General",
            priority: VALID_PRIORITIES.includes(priority) ? priority : "Medium",
            deadline: deadline,
            estMinutes: estMinutes,
            completed: false,
            createdAt: Date.now()
        };

        tasks.unshift(newTask);
        saveTasks();
        displayTasks();

        // Award small XP for setting intentions
        addXP(5, "Task Added");
        SoundFX.click();

        taskInput.value = "";
        if (taskDate) taskDate.value = "";
        taskInput.focus();
    }

    function deleteTask(task) {
        const index = tasks.findIndex(t => (task.id && t.id === task.id) || t === task);
        if (index === -1) return;

        lastDeletedTask = { ...tasks[index], originalIndex: index };
        tasks.splice(index, 1);
        saveTasks();
        displayTasks();

        showToast(`Task deleted: "${lastDeletedTask.name}"`, true, () => {
            if (lastDeletedTask) {
                tasks.splice(lastDeletedTask.originalIndex, 0, lastDeletedTask);
                saveTasks();
                displayTasks();
                showToast("Task restored!");
            }
        });
    }

    function toggleTaskComplete(task) {
        task.completed = !task.completed;
        saveTasks();
        displayTasks();

        if (task.completed) {
            SoundFX.completeChime();
            fireConfetti();

            let xpReward = 25;
            if (task.priority === "High") xpReward = 40;
            if (task.priority === "Low") xpReward = 15;

            addXP(xpReward, "Task Completed");
            recordDailyActivity(1);
            verifyAndUpdateStreak();
            updateQuestProgress("q_tasks", 1);

            unlockBadge("b_first_task");
            if (task.priority === "High") unlockBadge("b_high_volt");

            const now = new Date();
            if (now.getHours() >= 21) unlockBadge("b_night_owl");
            if (now.getHours() <= 7) unlockBadge("b_early_bird");
        }
    }

    function openEditModal(task) {
        taskBeingEdited = task;
        if (editTaskName) editTaskName.value = task.name;
        if (editTaskSubject) editTaskSubject.value = task.subject || "General";
        if (editTaskPriority) editTaskPriority.value = task.priority || "Medium";
        if (editTaskDate) editTaskDate.value = task.deadline || "";
        if (editTaskError) editTaskError.hidden = true;
        if (editTaskModal) editTaskModal.hidden = false;
        if (editTaskName) editTaskName.focus();
    }

    function closeEditModal() {
        if (editTaskModal) editTaskModal.hidden = true;
        taskBeingEdited = null;
    }

    function saveTaskEdit() {
        if (!taskBeingEdited) return;
        const name = editTaskName.value.trim();
        if (!name) {
            if (editTaskError) {
                editTaskError.textContent = "Task name cannot be empty.";
                editTaskError.hidden = false;
            }
            return;
        }

        taskBeingEdited.name = name;
        taskBeingEdited.subject = editTaskSubject.value;
        taskBeingEdited.priority = editTaskPriority.value;
        taskBeingEdited.deadline = editTaskDate.value;

        saveTasks();
        closeEditModal();
        displayTasks();
        showToast("Task updated successfully!");
    }

    function displayTasks() {
        if (!taskList) return;
        taskList.innerHTML = "";

        const today = getTodayString();
        const tomorrow = getTomorrowString();

        // 1. Filter
        let filtered = tasks.filter(task => {
            const matchesStatus =
                currentFilter === "all" ||
                (currentFilter === "pending" && !task.completed) ||
                (currentFilter === "completed" && task.completed);

            const matchesPriority =
                currentPriority === "all" || task.priority === currentPriority;

            const matchesSubject =
                currentSubject === "all" || task.subject === currentSubject;

            const matchesSearch =
                !taskSearchQuery ||
                task.name.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                (task.subject && task.subject.toLowerCase().includes(taskSearchQuery.toLowerCase()));

            return matchesStatus && matchesPriority && matchesSubject && matchesSearch;
        });

        // 2. Sort
        filtered.sort((a, b) => {
            if (currentSort === "deadline") {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return a.deadline.localeCompare(b.deadline);
            } else if (currentSort === "priority") {
                const map = { High: 3, Medium: 2, Low: 1 };
                return (map[b.priority] || 0) - (map[a.priority] || 0);
            } else if (currentSort === "name") {
                return a.name.localeCompare(b.name);
            } else if (currentSort === "newest") {
                return (b.createdAt || 0) - (a.createdAt || 0);
            }
            return 0;
        });

        if (filtered.length === 0) {
            const emptyEl = document.createElement("li");
            emptyEl.className = "empty-task-placeholder";
            emptyEl.innerHTML = `
                <div class="empty-icon">🌱</div>
                <p><strong>${tasks.length === 0 ? "No study tasks yet." : "No tasks match your filters."}</strong></p>
                <small>${tasks.length === 0 ? "Add your first goal above and start earning XP!" : "Try adjusting your search or priority filter."}</small>
            `;
            taskList.appendChild(emptyEl);
        } else {
            filtered.forEach(task => {
                const li = document.createElement("li");
                li.className = `task-item ${task.completed ? "completed-item" : ""}`;

                const isOverdue = task.deadline && task.deadline < today && !task.completed;
                const isDueToday = task.deadline === today && !task.completed;
                const isDueTomorrow = task.deadline === tomorrow && !task.completed;

                let deadlineHtml = "";
                if (task.deadline) {
                    if (isDueToday) {
                        deadlineHtml = `<span class="deadline-pill deadline-today">⚡ Due Today</span>`;
                    } else if (isDueTomorrow) {
                        deadlineHtml = `<span class="deadline-pill deadline-tomorrow">📅 Due Tomorrow</span>`;
                    } else if (isOverdue) {
                        deadlineHtml = `<span class="deadline-pill deadline-overdue">⚠ Overdue (${task.deadline})</span>`;
                    } else {
                        deadlineHtml = `<span class="deadline-pill">Due: ${task.deadline}</span>`;
                    }
                }

                const subjectClass = `subject-${(task.subject || "general").toLowerCase()}`;

                li.innerHTML = `
                    <div class="task-checkbox-wrap">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task done">
                    </div>
                    <div class="task-body">
                        <div class="task-title-row">
                            <span class="subject-tag-pill ${subjectClass}">${task.subject || "General"}</span>
                            <span class="task-name-text ${task.completed ? "completed" : ""}">${escapeHtml(task.name)}</span>
                        </div>
                        <div class="task-meta-row">
                            ${deadlineHtml}
                            <span class="est-focus-pill">⏱️ ${task.estMinutes || 25}m</span>
                        </div>
                    </div>
                    <span class="priority-badge priority-${(task.priority || "Medium").toLowerCase()}">${task.priority}</span>
                    <div class="task-actions">
                        ${!task.completed ? `<button type="button" class="focus-task-btn" title="Focus this task in Pomodoro">🍅 Focus</button>` : ""}
                        <button type="button" class="edit-task-btn" title="Edit task">✏️</button>
                        <button type="button" class="delete-task-btn" title="Delete task">✕</button>
                    </div>
                `;

                // Event Listeners
                const checkbox = li.querySelector(".task-checkbox");
                checkbox.addEventListener("change", () => toggleTaskComplete(task));

                const editBtn = li.querySelector(".edit-task-btn");
                editBtn.addEventListener("click", () => openEditModal(task));

                const delBtn = li.querySelector(".delete-task-btn");
                delBtn.addEventListener("click", () => deleteTask(task));

                const focusBtn = li.querySelector(".focus-task-btn");
                if (focusBtn) {
                    focusBtn.addEventListener("click", () => {
                        setTargetFocusTask(task.name);
                        switchTab("tab-focus");
                        showToast(`Target set: "${task.name}". Ready to focus!`);
                    });
                }

                taskList.appendChild(li);
            });
        }

        updateMetricsAndProgress();
        updateDeadlineSummary();
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function updateMetricsAndProgress() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        const totalEl = document.getElementById("totalTasks");
        const compEl = document.getElementById("completedTasks");
        const pendEl = document.getElementById("pendingTasks");
        const pomoEl = document.getElementById("totalPomodorosCount");
        const pctEl = document.getElementById("completionPercent");
        const fillEl = document.getElementById("progressFill");
        const msgEl = document.getElementById("progressMessage");

        if (totalEl) totalEl.textContent = total;
        if (compEl) compEl.textContent = completed;
        if (pendEl) pendEl.textContent = pending;
        if (pomoEl) pomoEl.textContent = totalPomoCount;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (pctEl) pctEl.textContent = `${percent}%`;
        if (fillEl) fillEl.style.width = `${percent}%`;

        let message = "Let's get started!";
        if (total === 0) {
            message = "Plan your goals to kickstart your momentum! 🚀";
        } else if (percent === 100) {
            message = "Unstoppable! All tasks completed today. 🎉";
        } else if (percent >= 75) {
            message = "Crushing it! In the final stretch. 🔥";
        } else if (percent >= 40) {
            message = "Great progress! Flow state unlocked. ✨";
        } else if (percent > 0) {
            message = "Solid start! Keep the chain unbroken. 💪";
        }

        if (msgEl) msgEl.textContent = message;
    }

    function updateDeadlineSummary() {
        const summary = document.getElementById("deadlineSummary");
        if (!summary) return;

        const today = getTodayString();
        const tomorrow = getTomorrowString();

        const dueToday = tasks.filter(t => t.deadline === today && !t.completed).length;
        const dueTomorrow = tasks.filter(t => t.deadline === tomorrow && !t.completed).length;

        if (dueToday === 0 && dueTomorrow === 0) {
            summary.textContent = "✨ No urgent tasks due today or tomorrow!";
            summary.style.borderColor = "var(--border-color)";
        } else {
            summary.textContent = `⚡ ${dueToday} task(s) due today · 📅 ${dueTomorrow} due tomorrow`;
            summary.style.borderColor = "var(--accent)";
        }
    }

    // ==========================================
    // 7. FOCUS HUB & POMODORO TIMER ENGINE
    // ==========================================

    const POMO_TIMES = {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
        stopwatch: 0
    };

    let currentTimerMode = "pomodoro";
    let timerDuration = POMO_TIMES.pomodoro;
    let timerRemaining = POMO_TIMES.pomodoro;
    let timerRunning = false;
    let timerInterval = null;
    let stopwatchElapsedSec = 0;

    const pomodoroDisplay = document.getElementById("pomodoroDisplay");
    const timerProgressCircle = document.getElementById("timerProgressCircle");
    const timerSublabel = document.getElementById("timerSublabel");
    const timerStartBtn = document.getElementById("timerStartBtn");
    const timerPauseBtn = document.getElementById("timerPauseBtn");
    const timerSkipBtn = document.getElementById("timerSkipBtn");
    const timerResetBtn = document.getElementById("timerResetBtn");
    const activeFocusTaskName = document.getElementById("activeFocusTaskName");
    const changeFocusTargetBtn = document.getElementById("changeFocusTargetBtn");
    const zenModeBtn = document.getElementById("zenModeBtn");
    const pomoSessionsCount = document.getElementById("pomoSessionsCount");
    const focusMinutesCount = document.getElementById("focusMinutesCount");

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function updateTimerDisplay() {
        if (!pomodoroDisplay) return;

        if (currentTimerMode === "stopwatch") {
            pomodoroDisplay.textContent = formatTime(stopwatchElapsedSec);
            if (timerProgressCircle) timerProgressCircle.style.strokeDashoffset = "0";
            return;
        }

        pomodoroDisplay.textContent = formatTime(timerRemaining);

        if (timerProgressCircle) {
            const circumference = 659.73; // 2 * pi * 105
            const progressRatio = timerRemaining / timerDuration;
            const offset = circumference * (1 - progressRatio);
            timerProgressCircle.style.strokeDashoffset = String(offset);
        }
    }

    function setTargetFocusTask(taskName) {
        if (activeFocusTaskName) {
            activeFocusTaskName.textContent = taskName;
        }
    }

    function setTimerMode(mode) {
        if (timerRunning) pauseTimer();
        currentTimerMode = mode;
        timerDuration = POMO_TIMES[mode] || (25 * 60);
        timerRemaining = timerDuration;
        stopwatchElapsedSec = 0;

        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === mode);
        });

        if (timerSublabel) {
            if (mode === "pomodoro") timerSublabel.textContent = "Focus Sprint (25m)";
            else if (mode === "shortBreak") timerSublabel.textContent = "Quick Recharge (5m)";
            else if (mode === "longBreak") timerSublabel.textContent = "Deep Rest (15m)";
            else timerSublabel.textContent = "Open Stopwatch Flow";
        }

        updateTimerDisplay();
    }

    function startTimer() {
        if (timerRunning) return;
        timerRunning = true;
        SoundFX.click();

        if (timerStartBtn) timerStartBtn.disabled = true;
        if (timerPauseBtn) timerPauseBtn.disabled = false;

        timerInterval = setInterval(() => {
            if (currentTimerMode === "stopwatch") {
                stopwatchElapsedSec++;
                if (stopwatchElapsedSec % 60 === 0) {
                    totalFocusMinutes++;
                    localStorage.setItem(STORAGE_KEYS.FOCUS_MINUTES, String(totalFocusMinutes));
                    renderFocusStats();
                }
                updateTimerDisplay();
                return;
            }

            if (timerRemaining > 0) {
                timerRemaining--;
                updateTimerDisplay();

                if (currentTimerMode === "pomodoro" && (timerDuration - timerRemaining) % 60 === 0) {
                    totalFocusMinutes++;
                    localStorage.setItem(STORAGE_KEYS.FOCUS_MINUTES, String(totalFocusMinutes));
                    renderFocusStats();
                }
            } else {
                completeTimerCycle();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!timerRunning) return;
        timerRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;

        if (timerStartBtn) timerStartBtn.disabled = false;
        if (timerPauseBtn) timerPauseBtn.disabled = true;
    }

    function resetTimer() {
        pauseTimer();
        if (currentTimerMode === "stopwatch") {
            stopwatchElapsedSec = 0;
        } else {
            timerRemaining = timerDuration;
        }
        updateTimerDisplay();
    }

    function completeTimerCycle() {
        pauseTimer();
        SoundFX.pomoBowlGong();
        fireConfetti();

        if (currentTimerMode === "pomodoro") {
            totalPomoCount++;
            localStorage.setItem(STORAGE_KEYS.POMO_COUNT, String(totalPomoCount));
            addXP(40, "Pomodoro Completed");
            recordDailyActivity(2);
            verifyAndUpdateStreak();
            updateQuestProgress("q_pomo", 1);
            unlockBadge("b_pomo_pioneer");

            showToast("🍅 Pomodoro Complete! Take a 5-minute breather.");
            setTimerMode("shortBreak");
        } else {
            showToast("Break over! Ready for another focus session?");
            setTimerMode("pomodoro");
        }

        renderFocusStats();
        updateMetricsAndProgress();
    }

    function renderFocusStats() {
        if (pomoSessionsCount) pomoSessionsCount.textContent = totalPomoCount;
        if (focusMinutesCount) focusMinutesCount.textContent = totalFocusMinutes;
        renderInsights();
    }

    // ==========================================
    // 8. ACTIVE RECALL FLASHCARDS ENGINE
    // ==========================================

    const flashcardElement = document.getElementById("flashcardElement");
    const cardCategoryTag = document.getElementById("cardCategoryTag");
    const cardFrontText = document.getElementById("cardFrontText");
    const cardBackText = document.getElementById("cardBackText");
    const currentCardIndexEl = document.getElementById("currentCardIndex");
    const totalCardsCountEl = document.getElementById("totalCardsCount");
    const prevCardBtn = document.getElementById("prevCardBtn");
    const nextCardBtn = document.getElementById("nextCardBtn");
    const recallHardBtn = document.getElementById("recallHardBtn");
    const recallEasyBtn = document.getElementById("recallEasyBtn");
    const flashcardDeckFilter = document.getElementById("flashcardDeckFilter");
    const openNewCardBtn = document.getElementById("openNewCardBtn");
    const newCardModal = document.getElementById("newCardModal");
    const closeNewCardModalBtn = document.getElementById("closeNewCardModalBtn");
    const saveNewCardBtn = document.getElementById("saveNewCardBtn");
    const cancelNewCardBtn = document.getElementById("cancelNewCardBtn");
    const newCardSubject = document.getElementById("newCardSubject");
    const newCardQuestion = document.getElementById("newCardQuestion");
    const newCardAnswer = document.getElementById("newCardAnswer");

    function getFilteredFlashcards() {
        if (flashcardFilter === "all") return flashcards;
        return flashcards.filter(c => (c.subject || "General") === flashcardFilter);
    }

    function renderActiveCard() {
        const deck = getFilteredFlashcards();
        if (deck.length === 0) {
            if (cardCategoryTag) cardCategoryTag.textContent = "EMPTY DECK";
            if (cardFrontText) cardFrontText.textContent = "No cards in this deck yet. Create one with the button above!";
            if (cardBackText) cardBackText.textContent = "Create custom cards to test your knowledge.";
            if (currentCardIndexEl) currentCardIndexEl.textContent = "0";
            if (totalCardsCountEl) totalCardsCountEl.textContent = "0";
            return;
        }

        if (activeCardIndex >= deck.length) activeCardIndex = 0;
        if (activeCardIndex < 0) activeCardIndex = deck.length - 1;

        const card = deck[activeCardIndex];

        // Reset flip
        if (flashcardElement) flashcardElement.classList.remove("is-flipped");

        if (cardCategoryTag) cardCategoryTag.textContent = (card.subject || "General").toUpperCase();
        if (cardFrontText) cardFrontText.textContent = card.front;
        if (cardBackText) cardBackText.textContent = card.back;
        if (currentCardIndexEl) currentCardIndexEl.textContent = String(activeCardIndex + 1);
        if (totalCardsCountEl) totalCardsCountEl.textContent = String(deck.length);
    }

    function flipCard() {
        if (!flashcardElement) return;
        flashcardElement.classList.toggle("is-flipped");
        SoundFX.click();
    }

    // ==========================================
    // 9. 30-DAY ACTIVITY HEATMAP ENGINE
    // ==========================================

    function renderHeatmap() {
        const grid = document.getElementById("heatmapGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const today = new Date();
        const days = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            days.push(`${y}-${m}-${day}`);
        }

        days.forEach(dateStr => {
            const count = heatmapData[dateStr] || 0;
            let level = 0;
            if (count >= 6) level = 4;
            else if (count >= 4) level = 3;
            else if (count >= 2) level = 2;
            else if (count >= 1) level = 1;

            const cell = document.createElement("div");
            cell.className = `heatmap-cell level-${level}`;
            cell.title = `${dateStr}: ${count} study actions logged`;
            grid.appendChild(cell);
        });
    }

    function renderInsights() {
        const xpVal = document.getElementById("totalXpEarnedVal");
        const streakVal = document.getElementById("bestStreakVal");
        const badgeVal = document.getElementById("unlockedBadgesVal");
        const hoursVal = document.getElementById("totalFocusHoursVal");

        if (xpVal) xpVal.textContent = userXp;
        if (streakVal) streakVal.textContent = `${bestStreak} Days`;
        if (badgeVal) badgeVal.textContent = `${unlockedBadges.length} / ${ALL_BADGES.length}`;
        if (hoursVal) hoursVal.textContent = `${(totalFocusMinutes / 60).toFixed(1)}h`;
    }

    // ==========================================
    // 10. BADGES MODAL ENGINE
    // ==========================================

    function renderBadgesModal() {
        const grid = document.getElementById("badgesGrid");
        if (!grid) return;
        grid.innerHTML = "";

        ALL_BADGES.forEach(badge => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const card = document.createElement("div");
            card.className = `badge-item ${isUnlocked ? "unlocked" : "locked"}`;
            card.innerHTML = `
                <div class="badge-trophy-icon">${badge.icon}</div>
                <div class="badge-name">${badge.title}</div>
                <div class="badge-desc">${badge.desc}</div>
                <span class="badge-status-tag">${isUnlocked ? "UNLOCKED ✓" : "LOCKED 🔒"}</span>
            `;
            grid.appendChild(card);
        });
    }

    // ==========================================
    // 11. QUICK NOTES SCRATCHPAD ENGINE
    // ==========================================

    const scratchpadText = document.getElementById("scratchpadText");
    const scratchpadCharCount = document.getElementById("scratchpadCharCount");
    const copyNotesBtn = document.getElementById("copyNotesBtn");
    const clearNotesBtn = document.getElementById("clearNotesBtn");

    function loadNotes() {
        if (!scratchpadText) return;
        const saved = localStorage.getItem(STORAGE_KEYS.NOTES) || "";
        scratchpadText.value = saved;
        updateNotesCounts();
    }

    function updateNotesCounts() {
        if (!scratchpadText || !scratchpadCharCount) return;
        const text = scratchpadText.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        scratchpadCharCount.textContent = `${words} words · ${chars} characters`;
    }

    let notesDebounce = null;
    if (scratchpadText) {
        scratchpadText.addEventListener("input", () => {
            updateNotesCounts();
            clearTimeout(notesDebounce);
            notesDebounce = setTimeout(() => {
                localStorage.setItem(STORAGE_KEYS.NOTES, scratchpadText.value);
            }, 400);
        });
    }

    if (copyNotesBtn) {
        copyNotesBtn.addEventListener("click", () => {
            if (!scratchpadText || !scratchpadText.value) {
                showToast("Scratchpad is empty!");
                return;
            }
            navigator.clipboard.writeText(scratchpadText.value).then(() => {
                showToast("Notes copied to clipboard! 📋");
            }).catch(() => {
                showToast("Could not copy notes.");
            });
        });
    }

    if (clearNotesBtn) {
        clearNotesBtn.addEventListener("click", () => {
            if (scratchpadText && confirm("Clear your scratchpad notes?")) {
                scratchpadText.value = "";
                localStorage.setItem(STORAGE_KEYS.NOTES, "");
                updateNotesCounts();
                showToast("Notes cleared.");
            }
        });
    }

    // ==========================================
    // 12. DATA BACKUP & RESTORE ENGINE
    // ==========================================

    const openBackupBtn = document.getElementById("openBackupBtn");
    const backupModal = document.getElementById("backupModal");
    const closeBackupModalBtn = document.getElementById("closeBackupModalBtn");
    const exportDataBtn = document.getElementById("exportDataBtn");
    const importFileInput = document.getElementById("importFileInput");
    const loadSampleDataBtn = document.getElementById("loadSampleDataBtn");

    function exportBackup() {
        const backupObj = {
            version: "2.0",
            exportedAt: new Date().toISOString(),
            tasks,
            userXp,
            streakCount,
            bestStreak,
            totalPomoCount,
            totalFocusMinutes,
            unlockedBadges,
            flashcards,
            notes: scratchpadText ? scratchpadText.value : "",
            heatmapData
        };

        const jsonStr = JSON.stringify(backupObj, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `smart_study_planner_backup_${getTodayString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Backup file downloaded! 📥");
    }

    function importBackup(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const data = JSON.parse(event.target.result);
                if (!data || typeof data !== "object") throw new Error("Invalid format");

                if (Array.isArray(data.tasks)) tasks = data.tasks;
                if (typeof data.userXp === "number") userXp = data.userXp;
                if (typeof data.streakCount === "number") streakCount = data.streakCount;
                if (typeof data.bestStreak === "number") bestStreak = data.bestStreak;
                if (typeof data.totalPomoCount === "number") totalPomoCount = data.totalPomoCount;
                if (typeof data.totalFocusMinutes === "number") totalFocusMinutes = data.totalFocusMinutes;
                if (Array.isArray(data.unlockedBadges)) unlockedBadges = data.unlockedBadges;
                if (Array.isArray(data.flashcards)) flashcards = data.flashcards;
                if (data.notes && scratchpadText) scratchpadText.value = data.notes;
                if (data.heatmapData) heatmapData = data.heatmapData;

                saveTasks();
                localStorage.setItem(STORAGE_KEYS.XP, String(userXp));
                localStorage.setItem(STORAGE_KEYS.STREAK, String(streakCount));
                localStorage.setItem(STORAGE_KEYS.BEST_STREAK, String(bestStreak));
                localStorage.setItem(STORAGE_KEYS.POMO_COUNT, String(totalPomoCount));
                localStorage.setItem(STORAGE_KEYS.FOCUS_MINUTES, String(totalFocusMinutes));
                saveStorage(STORAGE_KEYS.BADGES, unlockedBadges);
                saveStorage(STORAGE_KEYS.FLASHCARDS, flashcards);
                saveStorage(STORAGE_KEYS.HEATMAP, heatmapData);
                if (scratchpadText) localStorage.setItem(STORAGE_KEYS.NOTES, scratchpadText.value);

                displayTasks();
                renderGamifyBar();
                renderFocusStats();
                renderActiveCard();
                renderHeatmap();
                renderInsights();
                renderBadgesModal();

                if (backupModal) backupModal.hidden = true;
                showToast("Data restored successfully! ✨");
                SoundFX.completeChime();
            } catch {
                alert("Failed to parse backup file. Please ensure it is a valid Smart Study Planner JSON export.");
            }
        };
        reader.readAsText(file);
    }

    function loadSampleData() {
        const today = getTodayString();
        const tomorrow = getTomorrowString();

        tasks = [
            {
                id: "sample_1",
                name: "Review Calculus Derivatives & Integrals",
                subject: "Math",
                priority: "High",
                deadline: today,
                estMinutes: 45,
                completed: false,
                createdAt: Date.now() - 3600000
            },
            {
                id: "sample_2",
                name: "Implement Graph BFS / DFS in Python",
                subject: "Coding",
                priority: "Medium",
                deadline: tomorrow,
                estMinutes: 60,
                completed: false,
                createdAt: Date.now() - 7200000
            },
            {
                id: "sample_3",
                name: "Practice Spanish Vocabulary Flashcards",
                subject: "Language",
                priority: "Low",
                deadline: tomorrow,
                estMinutes: 25,
                completed: true,
                createdAt: Date.now() - 10800000
            }
        ];

        userXp = Math.max(userXp, 180);
        streakCount = Math.max(streakCount, 3);
        bestStreak = Math.max(bestStreak, 5);
        totalPomoCount = Math.max(totalPomoCount, 4);
        totalFocusMinutes = Math.max(totalFocusMinutes, 100);
        unlockedBadges = Array.from(new Set([...unlockedBadges, "b_first_task", "b_streak_3", "b_pomo_pioneer"]));

        saveTasks();
        localStorage.setItem(STORAGE_KEYS.XP, String(userXp));
        localStorage.setItem(STORAGE_KEYS.STREAK, String(streakCount));
        localStorage.setItem(STORAGE_KEYS.BEST_STREAK, String(bestStreak));
        localStorage.setItem(STORAGE_KEYS.POMO_COUNT, String(totalPomoCount));
        localStorage.setItem(STORAGE_KEYS.FOCUS_MINUTES, String(totalFocusMinutes));
        saveStorage(STORAGE_KEYS.BADGES, unlockedBadges);

        displayTasks();
        renderGamifyBar();
        renderFocusStats();
        renderInsights();
        renderBadgesModal();

        if (backupModal) backupModal.hidden = true;
        showToast("Demo study plan loaded! ✨");
        SoundFX.completeChime();
    }

    // ==========================================
    // 13. STUDY LEAGUES & LEADERBOARD ENGINE
    // ==========================================

    const LEAGUES = {
        Bronze: { title: "Bronze League", icon: "🥉", baseMinXp: 80, baseMaxXp: 350, next: "Silver" },
        Silver: { title: "Silver League", icon: "🥈", baseMinXp: 350, baseMaxXp: 950, next: "Gold" },
        Gold: { title: "Gold League", icon: "🥇", baseMinXp: 950, baseMaxXp: 2400, next: "Diamond" },
        Diamond: { title: "Diamond League", icon: "💎", baseMinXp: 2400, baseMaxXp: 5500, next: "Master" },
        Master: { title: "Master League", icon: "👑", baseMinXp: 5500, baseMaxXp: 12000, next: null }
    };

    const MOCK_PEERS = [
        { name: "Alex Chen", avatar: "🦉", subject: "Science", title: "Pre-Med Scholar", variance: 0.95 },
        { name: "Maya Patel", avatar: "💻", subject: "Coding", title: "Full-Stack Dev", variance: 0.88 },
        { name: "Kenji Sato", avatar: "🧮", subject: "Math", title: "Pure Math Adept", variance: 0.82 },
        { name: "Elena Rostova", avatar: "🔬", subject: "Science", title: "Bio Chemist", variance: 0.74 },
        { name: "Liam Miller", avatar: "📚", subject: "Language", title: "Linguist Striver", variance: 0.65 },
        { name: "Chloe Dupont", avatar: "📖", subject: "Humanities", title: "History Buff", variance: 0.58 },
        { name: "David Kim", avatar: "🎧", subject: "General", title: "Flow Seeker", variance: 0.48 },
        { name: "Sophie Taylor", avatar: "⚡", subject: "Coding", title: "Algo Sprint", variance: 0.38 },
        { name: "Marcus Vance", avatar: "☕", subject: "General", title: "Deep Worker", variance: 0.28 }
    ];

    function generateFriendCode() {
        const info = getLevelInfo(userXp);
        return `SSP#${userNickname}#${userAvatar}#Lvl${info.level}#${userXp}XP#${streakCount}Streak`;
    }

    function renderLeaderboard() {
        const leagueInfo = LEAGUES[userLeague] || LEAGUES.Bronze;
        const leagueTitleEl = document.getElementById("leagueTitle");
        const leagueIconEl = document.getElementById("leagueIcon");
        const leagueDescEl = document.getElementById("leagueDesc");
        const userCurrentRankPill = document.getElementById("userCurrentRankPill");
        const rankingsTableBody = document.getElementById("rankingsTableBody");
        const podiumContainer = document.getElementById("podiumContainer");
        const myFriendCodeDisplay = document.getElementById("myFriendCodeDisplay");

        if (leagueTitleEl) leagueTitleEl.textContent = leagueInfo.title;
        if (leagueIconEl) leagueIconEl.textContent = leagueInfo.icon;
        if (leagueDescEl) {
            leagueDescEl.textContent = leagueInfo.next
                ? `Finish in the Top 3 this week to advance to ${LEAGUES[leagueInfo.next].title}!`
                : "You are at the pinnacle of mastery in the Master League!";
        }

        if (myFriendCodeDisplay) {
            myFriendCodeDisplay.textContent = generateFriendCode();
        }

        // Calculate dynamic competitor XP based on league
        const minXp = leagueInfo.baseMinXp;
        const maxXp = leagueInfo.baseMaxXp;
        const spread = maxXp - minXp;

        const competitors = MOCK_PEERS.map(peer => {
            const peerXp = Math.round(minXp + spread * peer.variance);
            const peerInfo = getLevelInfo(peerXp);
            return {
                name: peer.name,
                avatar: peer.avatar,
                subject: peer.subject,
                title: peer.title,
                level: peerInfo.level,
                xp: peerXp,
                isUser: false,
                isFriend: false
            };
        });

        // Add real friends from friendsList
        friendsList.forEach(fr => {
            competitors.push({
                name: fr.name,
                avatar: fr.avatar || "👤",
                subject: fr.subject || "General",
                title: fr.title || `Lvl ${fr.level} Friend`,
                level: fr.level || 1,
                xp: fr.xp || 0,
                isUser: false,
                isFriend: true
            });
        });

        // Add user
        const userInfo = getLevelInfo(userXp);
        competitors.push({
            name: userNickname,
            avatar: userAvatar,
            subject: "General",
            title: userInfo.title,
            level: userInfo.level,
            xp: userXp,
            isUser: true,
            isFriend: false
        });

        // Sort descending by XP
        competitors.sort((a, b) => b.xp - a.xp);

        // Find user rank
        const userRank = competitors.findIndex(c => c.isUser) + 1;
        if (userCurrentRankPill) {
            userCurrentRankPill.textContent = `Your Rank: #${userRank} of ${competitors.length}`;
            if (userRank <= 3) {
                userCurrentRankPill.style.background = "#ecfdf5";
                userCurrentRankPill.style.color = "#059669";
            } else {
                userCurrentRankPill.style.background = "var(--stat-bg)";
                userCurrentRankPill.style.color = "var(--text-color)";
            }
        }

        // Render Podium (Top 3)
        if (podiumContainer) {
            podiumContainer.innerHTML = "";
            const top3 = competitors.slice(0, 3);

            // Reorder for visual podium: [Rank 2, Rank 1, Rank 3]
            const podiumOrder = [];
            if (top3[1]) podiumOrder.push({ ...top3[1], rank: 2 });
            if (top3[0]) podiumOrder.push({ ...top3[0], rank: 1 });
            if (top3[2]) podiumOrder.push({ ...top3[2], rank: 3 });

            podiumOrder.forEach(p => {
                const step = document.createElement("div");
                step.className = `podium-step rank-${p.rank}`;
                step.innerHTML = `
                    <div class="podium-avatar-wrap">
                        ${p.rank === 1 ? '<div class="podium-crown">👑</div>' : ""}
                        <div class="podium-avatar">${p.avatar}</div>
                    </div>
                    <div class="podium-name">${escapeHtml(p.name)}${p.isUser ? " (You)" : ""}</div>
                    <div class="podium-xp">${p.xp} XP</div>
                    <div class="podium-pedestal">${p.rank === 1 ? "🥇" : (p.rank === 2 ? "🥈" : "🥉")}</div>
                `;
                podiumContainer.appendChild(step);
            });
        }

        // Render Table Body
        if (rankingsTableBody) {
            rankingsTableBody.innerHTML = "";
            competitors.forEach((c, idx) => {
                const rank = idx + 1;
                const tr = document.createElement("tr");
                tr.className = `ranking-row ${c.isUser ? "user-row" : ""} ${c.isFriend ? "friend-row" : ""}`;

                let rankMedal = `<span class="rank-num">#${rank}</span>`;
                if (rank === 1) rankMedal = `<span class="rank-medal-gold">🥇 #1</span>`;
                else if (rank === 2) rankMedal = `<span class="rank-medal-silver">🥈 #2</span>`;
                else if (rank === 3) rankMedal = `<span class="rank-medal-bronze">🥉 #3</span>`;

                let statusBadge = `<span class="status-badge status-safe">SAFE</span>`;
                if (rank <= 3) {
                    statusBadge = `<span class="status-badge status-promote">PROMOTION ▲</span>`;
                } else if (rank >= competitors.length - 1) {
                    statusBadge = `<span class="status-badge status-demote">DEMOTION ▼</span>`;
                }

                const subjectClass = `subject-${(c.subject || "general").toLowerCase()}`;

                tr.innerHTML = `
                    <td>${rankMedal}</td>
                    <td>
                        <div class="scholar-cell">
                            <span class="scholar-avatar">${c.avatar}</span>
                            <div class="scholar-meta">
                                <span class="scholar-name">
                                    ${escapeHtml(c.name)}
                                    ${c.isUser ? '<span class="you-tag">YOU</span>' : ""}
                                    ${c.isFriend ? '<span class="friend-tag">FRIEND</span>' : ""}
                                </span>
                                <span class="scholar-title-sub">${c.title}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="subject-tag-pill ${subjectClass}">${c.subject}</span></td>
                    <td><span class="level-badge">LVL ${c.level}</span></td>
                    <td><span class="rank-xp-num">${c.xp} XP</span></td>
                    <td>${statusBadge}</td>
                `;
                rankingsTableBody.appendChild(tr);
            });
        }
    }

    // ==========================================
    // 14. PROFILE & AVATAR CUSTOMIZATION ENGINE
    // ==========================================

    const AVATAR_OPTIONS = [
        { icon: "🦊", label: "Fox Scholar" },
        { icon: "🦉", label: "Wise Owl" },
        { icon: "⚡", label: "Focus Ninja" },
        { icon: "🚀", label: "Astro Learner" },
        { icon: "🐱", label: "Cozy Coder" },
        { icon: "🦁", label: "Mind Lion" },
        { icon: "🧙", label: "Archmage" },
        { icon: "🐼", label: "Zen Panda" },
        { icon: "🎧", label: "Lo-Fi Student" },
        { icon: "🧠", label: "Mastermind" },
        { icon: "☕", label: "Coffee Striver" },
        { icon: "🤖", label: "Cyber Bot" }
    ];

    const userProfileWidget = document.getElementById("userProfileWidget");
    const profileModal = document.getElementById("profileModal");
    const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
    const cancelProfileBtn = document.getElementById("cancelProfileBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const profileNicknameInput = document.getElementById("profileNicknameInput");
    const avatarPickerGrid = document.getElementById("avatarPickerGrid");
    const previewAvatarDisplay = document.getElementById("previewAvatarDisplay");
    const previewNameDisplay = document.getElementById("previewNameDisplay");
    const previewRoleDisplay = document.getElementById("previewRoleDisplay");

    function openProfileModal() {
        if (!profileModal) return;
        selectedAvatar = userAvatar;
        if (profileNicknameInput) profileNicknameInput.value = userNickname;
        renderAvatarPicker();
        updateProfilePreview();
        profileModal.hidden = false;
        if (profileNicknameInput) profileNicknameInput.focus();
    }

    function closeProfileModal() {
        if (profileModal) profileModal.hidden = true;
    }

    function renderAvatarPicker() {
        if (!avatarPickerGrid) return;
        avatarPickerGrid.innerHTML = "";
        AVATAR_OPTIONS.forEach(opt => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `avatar-option-btn ${opt.icon === selectedAvatar ? "selected" : ""}`;
            btn.textContent = opt.icon;
            btn.title = opt.label;
            btn.addEventListener("click", () => {
                selectedAvatar = opt.icon;
                renderAvatarPicker();
                updateProfilePreview();
                SoundFX.click();
            });
            avatarPickerGrid.appendChild(btn);
        });
    }

    function updateProfilePreview() {
        const name = (profileNicknameInput && profileNicknameInput.value.trim()) || "Scholar";
        if (previewAvatarDisplay) previewAvatarDisplay.textContent = selectedAvatar;
        if (previewNameDisplay) previewNameDisplay.textContent = name;
        const info = getLevelInfo(userXp);
        if (previewRoleDisplay) previewRoleDisplay.textContent = `Lvl ${info.level} ${info.title} • ${userXp} XP`;
    }

    function saveProfile() {
        const newName = profileNicknameInput ? profileNicknameInput.value.trim() : "";
        userNickname = newName || "Scholar";
        userAvatar = selectedAvatar;

        localStorage.setItem(STORAGE_KEYS.NICKNAME, userNickname);
        localStorage.setItem(STORAGE_KEYS.AVATAR, userAvatar);

        closeProfileModal();
        renderGamifyBar();
        renderLeaderboard();
        SoundFX.completeChime();
        fireConfetti();
        showToast(`Profile updated! Welcome, ${userNickname} ✨`);
    }

    // Friend Code Functions
    const copyFriendCodeBtn = document.getElementById("copyFriendCodeBtn");
    const addFriendInput = document.getElementById("addFriendInput");
    const addFriendBtn = document.getElementById("addFriendBtn");

    function copyFriendCode() {
        const code = generateFriendCode();
        navigator.clipboard.writeText(code).then(() => {
            showToast("Friend code copied to clipboard! Share it with friends. 📋");
            SoundFX.click();
        }).catch(() => {
            showToast("Could not copy code. Select and copy manually!");
        });
    }

    function addFriendFromCode() {
        if (!addFriendInput) return;
        const raw = addFriendInput.value.trim();
        if (!raw.startsWith("SSP#")) {
            alert("Invalid Friend Code format! Format must look like: SSP#Name#Avatar#Lvl2#450XP#3Streak");
            return;
        }

        const parts = raw.split("#");
        if (parts.length < 5) {
            alert("Incomplete Friend Code. Please ensure the full code was pasted.");
            return;
        }

        const name = parts[1];
        const avatar = parts[2] || "👤";
        const lvlStr = parts[3] || "Lvl1";
        const xpStr = parts[4] || "0XP";

        const level = Number(lvlStr.replace(/\D/g, "")) || 1;
        const xp = Number(xpStr.replace(/\D/g, "")) || 0;

        // Check duplicate
        const existingIdx = friendsList.findIndex(f => f.name.toLowerCase() === name.toLowerCase());
        if (existingIdx !== -1) {
            friendsList[existingIdx] = { name, avatar, level, xp };
        } else {
            friendsList.push({ name, avatar, level, xp });
        }

        saveStorage(STORAGE_KEYS.FRIENDS, friendsList);
        addFriendInput.value = "";
        renderLeaderboard();
        SoundFX.completeChime();
        fireConfetti();
        showToast(`Added ${name} to your Study League! 🤝`);
    }

    // ==========================================
    // 15. REAL-TIME CLOCK ENGINE
    // ==========================================

    function updateLiveClock() {
        const clockEl = document.getElementById("liveClock");
        const dateEl = document.getElementById("liveDate");
        if (!clockEl || !dateEl) return;

        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

        dateEl.textContent = now.toLocaleDateString([], {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    // ==========================================
    // 14. THEME SWITCHER ENGINE
    // ==========================================

    const themeTrigger = document.getElementById("themeTrigger");
    const themeMenu = document.getElementById("themeMenu");
    const themeOptions = document.querySelectorAll(".theme-option");

    function applyTheme(theme) {
        if (!VALID_THEMES.includes(theme)) theme = "neutral";
        document.body.dataset.theme = theme;
        localStorage.setItem(STORAGE_KEYS.THEME, theme);

        themeOptions.forEach(opt => {
            const isMatch = opt.dataset.theme === theme;
            opt.setAttribute("aria-pressed", String(isMatch));
        });
    }

    function toggleThemeMenu() {
        if (!themeMenu) return;
        const isHidden = themeMenu.hidden;
        themeMenu.hidden = !isHidden;
        if (themeTrigger) themeTrigger.setAttribute("aria-expanded", String(isHidden));
    }

    // ==========================================
    // 15. TAB NAVIGATION & VIEW SWITCHING
    // ==========================================

    function switchTab(tabId) {
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });

        document.querySelectorAll(".tab-content-panel").forEach(panel => {
            panel.classList.toggle("active", panel.id === tabId);
        });

        SoundFX.click();

        if (tabId === "tab-flashcards") renderActiveCard();
        if (tabId === "tab-stats") {
            renderHeatmap();
            renderQuestsList();
            renderInsights();
        }
        if (tabId === "tab-leaderboard") {
            renderLeaderboard();
        }
    }

    // ==========================================
    // 16. EVENT LISTENERS INITIALIZATION
    // ==========================================

    function initEventListeners() {
        // Tab switching
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => switchTab(btn.dataset.tab));
        });

        // Add task button & enter key
        if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);
        if (taskInput) {
            taskInput.addEventListener("keydown", e => {
                if (e.key === "Enter") addTask();
            });
        }

        // Search & Filter
        if (taskSearchInput) {
            taskSearchInput.addEventListener("input", e => {
                taskSearchQuery = e.target.value;
                displayTasks();
            });
        }

        if (taskSortSelect) {
            taskSortSelect.addEventListener("change", e => {
                currentSort = e.target.value;
                displayTasks();
            });
        }

        if (subjectFilterSelect) {
            subjectFilterSelect.addEventListener("change", e => {
                currentSubject = e.target.value;
                displayTasks();
            });
        }

        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener("click", () => {
                const hadCompleted = tasks.some(t => t.completed);
                if (!hadCompleted) {
                    showToast("No completed tasks to clear.");
                    return;
                }
                tasks = tasks.filter(t => !t.completed);
                saveTasks();
                displayTasks();
                showToast("Cleared completed tasks!");
            });
        }

        // Status filters (All / Pending / Completed)
        document.querySelectorAll(".status-filters .filter-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                currentFilter = btn.dataset.filter;
                document.querySelectorAll(".status-filters .filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                displayTasks();
            });
        });

        // Priority filters
        document.querySelectorAll(".priority-filters .priority-filter-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                currentPriority = btn.dataset.priority;
                document.querySelectorAll(".priority-filters .priority-filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                displayTasks();
            });
        });

        // Edit Modal Events
        if (saveEditBtn) saveEditBtn.addEventListener("click", saveTaskEdit);
        if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
        if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditModal);
        if (editTaskModal) {
            editTaskModal.addEventListener("click", e => {
                if (e.target === editTaskModal) closeEditModal();
            });
        }

        // Theme Switcher Events
        if (themeTrigger) themeTrigger.addEventListener("click", toggleThemeMenu);
        themeOptions.forEach(opt => {
            opt.addEventListener("click", () => {
                applyTheme(opt.dataset.theme);
                if (themeMenu) themeMenu.hidden = true;
                if (themeTrigger) {
                    themeTrigger.setAttribute("aria-expanded", "false");
                    themeTrigger.focus();
                }
            });
        });

        document.addEventListener("click", e => {
            if (themeMenu && !themeMenu.hidden && !e.target.closest(".theme-switcher")) {
                themeMenu.hidden = true;
                if (themeTrigger) themeTrigger.setAttribute("aria-expanded", "false");
            }
        });

        // Sound FX Toggle
        const toggleSoundBtn = document.getElementById("toggleSoundBtn");
        const soundIcon = document.getElementById("soundIcon");
        if (toggleSoundBtn) {
            toggleSoundBtn.addEventListener("click", () => {
                isAudioMuted = !isAudioMuted;
                localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, String(isAudioMuted));
                if (soundIcon) soundIcon.textContent = isAudioMuted ? "🔇" : "🔊";
                if (isAudioMuted) stopAmbient();
                showToast(isAudioMuted ? "Sound muted" : "Sound enabled! 🔊");
            });
            if (soundIcon) soundIcon.textContent = isAudioMuted ? "🔇" : "🔊";
        }

        // Badges Modal
        const openBadgesBtn = document.getElementById("openBadgesBtn");
        const badgesModal = document.getElementById("badgesModal");
        const closeBadgesModalBtn = document.getElementById("closeBadgesModalBtn");

        if (openBadgesBtn && badgesModal) {
            openBadgesBtn.addEventListener("click", () => {
                renderBadgesModal();
                badgesModal.hidden = false;
            });
        }
        if (closeBadgesModalBtn && badgesModal) {
            closeBadgesModalBtn.addEventListener("click", () => badgesModal.hidden = true);
        }
        if (badgesModal) {
            badgesModal.addEventListener("click", e => {
                if (e.target === badgesModal) badgesModal.hidden = true;
            });
        }

        // Level Widget opens badges modal
        const levelWidget = document.getElementById("levelWidget");
        if (levelWidget && badgesModal) {
            levelWidget.addEventListener("click", () => {
                renderBadgesModal();
                badgesModal.hidden = false;
            });
        }

        // Backup Modal
        if (openBackupBtn && backupModal) {
            openBackupBtn.addEventListener("click", () => backupModal.hidden = false);
        }
        if (closeBackupModalBtn && backupModal) {
            closeBackupModalBtn.addEventListener("click", () => backupModal.hidden = true);
        }
        if (backupModal) {
            backupModal.addEventListener("click", e => {
                if (e.target === backupModal) backupModal.hidden = true;
            });
        }
        if (exportDataBtn) exportDataBtn.addEventListener("click", exportBackup);
        if (importFileInput) importFileInput.addEventListener("change", importBackup);
        if (loadSampleDataBtn) loadSampleDataBtn.addEventListener("click", loadSampleData);

        // Pomodoro Timer Events
        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.addEventListener("click", () => setTimerMode(btn.dataset.mode));
        });

        if (timerStartBtn) timerStartBtn.addEventListener("click", startTimer);
        if (timerPauseBtn) timerPauseBtn.addEventListener("click", pauseTimer);
        if (timerSkipBtn) timerSkipBtn.addEventListener("click", () => {
            pauseTimer();
            completeTimerCycle();
        });
        if (timerResetBtn) timerResetBtn.addEventListener("click", resetTimer);

        if (changeFocusTargetBtn) {
            changeFocusTargetBtn.addEventListener("click", () => {
                const target = prompt("What is your focus target for this session?", "Deep Study Session");
                if (target && target.trim()) {
                    setTargetFocusTask(target.trim());
                }
            });
        }

        if (zenModeBtn) {
            zenModeBtn.addEventListener("click", () => {
                document.body.classList.toggle("zen-active");
                const isZen = document.body.classList.contains("zen-active");
                zenModeBtn.textContent = isZen ? "✕ Exit Zen Mode" : "⛶ Fullscreen Zen Mode";
                showToast(isZen ? "Zen Mode: Distraction-free focus activated!" : "Zen Mode exited.");
            });
        }

        // Ambient Audio Buttons
        document.querySelectorAll(".ambient-sound-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const sound = btn.dataset.sound;
                if (btn.classList.contains("playing")) {
                    stopAmbient();
                } else {
                    startAmbient(sound);
                }
            });
        });

        const stopAmbientBtn = document.getElementById("stopAmbientBtn");
        if (stopAmbientBtn) stopAmbientBtn.addEventListener("click", stopAmbient);

        const ambientVolumeSlider = document.getElementById("ambientVolumeSlider");
        if (ambientVolumeSlider) {
            ambientVolumeSlider.addEventListener("input", e => {
                if (ambientGainNode && audioCtx) {
                    ambientGainNode.gain.setValueAtTime(Number(e.target.value), audioCtx.currentTime);
                }
            });
        }

        // Flashcards Events
        if (flashcardElement) {
            flashcardElement.addEventListener("click", flipCard);
            flashcardElement.addEventListener("keydown", e => {
                if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    flipCard();
                }
            });
        }

        if (prevCardBtn) {
            prevCardBtn.addEventListener("click", () => {
                activeCardIndex--;
                renderActiveCard();
            });
        }

        if (nextCardBtn) {
            nextCardBtn.addEventListener("click", () => {
                activeCardIndex++;
                renderActiveCard();
            });
        }

        if (recallEasyBtn) {
            recallEasyBtn.addEventListener("click", () => {
                const deck = getFilteredFlashcards();
                if (deck.length > 0) {
                    const card = deck[activeCardIndex];
                    if (card) card.reviewedCount = (card.reviewedCount || 0) + 1;
                    saveStorage(STORAGE_KEYS.FLASHCARDS, flashcards);

                    SoundFX.completeChime();
                    addXP(10, "Flashcard Mastered");
                    recordDailyActivity(1);
                    updateQuestProgress("q_cards", 1);
                    unlockBadge("b_recall_pro");

                    activeCardIndex++;
                    renderActiveCard();
                }
            });
        }

        if (recallHardBtn) {
            recallHardBtn.addEventListener("click", () => {
                showToast("Card flagged for extra review 📌");
                activeCardIndex++;
                renderActiveCard();
            });
        }

        if (flashcardDeckFilter) {
            flashcardDeckFilter.addEventListener("change", e => {
                flashcardFilter = e.target.value;
                activeCardIndex = 0;
                renderActiveCard();
            });
        }

        // Create New Flashcard Modal
        if (openNewCardBtn && newCardModal) {
            openNewCardBtn.addEventListener("click", () => {
                if (newCardQuestion) newCardQuestion.value = "";
                if (newCardAnswer) newCardAnswer.value = "";
                newCardModal.hidden = false;
                if (newCardQuestion) newCardQuestion.focus();
            });
        }
        if (closeNewCardModalBtn && newCardModal) {
            closeNewCardModalBtn.addEventListener("click", () => newCardModal.hidden = true);
        }
        if (cancelNewCardBtn && newCardModal) {
            cancelNewCardBtn.addEventListener("click", () => newCardModal.hidden = true);
        }
        if (newCardModal) {
            newCardModal.addEventListener("click", e => {
                if (e.target === newCardModal) newCardModal.hidden = true;
            });
        }
        if (saveNewCardBtn) {
            saveNewCardBtn.addEventListener("click", () => {
                const q = newCardQuestion ? newCardQuestion.value.trim() : "";
                const a = newCardAnswer ? newCardAnswer.value.trim() : "";
                const s = newCardSubject ? newCardSubject.value : "General";

                if (!q || !a) {
                    alert("Please provide both front question and back answer.");
                    return;
                }

                const newCard = {
                    id: "fc_" + Date.now(),
                    subject: s,
                    front: q,
                    back: a,
                    reviewedCount: 0
                };

                flashcards.unshift(newCard);
                saveStorage(STORAGE_KEYS.FLASHCARDS, flashcards);
                if (newCardModal) newCardModal.hidden = true;

                addXP(15, "Flashcard Created");
                unlockBadge("b_card_creator");
                showToast("Flashcard added to deck! 🗂️");

                activeCardIndex = 0;
                renderActiveCard();
            });
        }

        // Profile Modal Events
        if (userProfileWidget) userProfileWidget.addEventListener("click", openProfileModal);
        if (closeProfileModalBtn) closeProfileModalBtn.addEventListener("click", closeProfileModal);
        if (cancelProfileBtn) cancelProfileBtn.addEventListener("click", closeProfileModal);
        if (saveProfileBtn) saveProfileBtn.addEventListener("click", saveProfile);
        if (profileNicknameInput) profileNicknameInput.addEventListener("input", updateProfilePreview);
        if (profileModal) {
            profileModal.addEventListener("click", e => {
                if (e.target === profileModal) closeProfileModal();
            });
        }

        // Friend Code Events
        if (copyFriendCodeBtn) copyFriendCodeBtn.addEventListener("click", copyFriendCode);
        if (addFriendBtn) addFriendBtn.addEventListener("click", addFriendFromCode);
        if (addFriendInput) {
            addFriendInput.addEventListener("keydown", e => {
                if (e.key === "Enter") addFriendFromCode();
            });
        }

        // Global ESC key for closing modals
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                if (editTaskModal && !editTaskModal.hidden) closeEditModal();
                if (badgesModal && !badgesModal.hidden) badgesModal.hidden = true;
                if (newCardModal && !newCardModal.hidden) newCardModal.hidden = true;
                if (backupModal && !backupModal.hidden) backupModal.hidden = true;
                if (profileModal && !profileModal.hidden) closeProfileModal();
                if (themeMenu && !themeMenu.hidden) {
                    themeMenu.hidden = true;
                    if (themeTrigger) themeTrigger.setAttribute("aria-expanded", "false");
                }
            }
        });
    }

    // ==========================================
    // 17. BOOTSTRAP APPLICATION
    // ==========================================

    function init() {
        // Apply saved theme
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "neutral";
        applyTheme(savedTheme);

        // Verify streaks
        verifyAndUpdateStreak();

        // Render UI
        renderGamifyBar();
        displayTasks();
        renderFocusStats();
        updateTimerDisplay();
        renderActiveCard();
        renderHeatmap();
        renderQuestsList();
        renderInsights();
        renderLeaderboard();
        loadNotes();

        // Init Clock
        updateLiveClock();
        setInterval(updateLiveClock, 1000);

        // Wire Event Handlers
        initEventListeners();
    }

    // Run on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
