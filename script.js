document.addEventListener('DOMContentLoaded', () => {

    // 0. THEME SWITCHER
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.documentElement;
    const savedTheme = localStorage.getItem('dsa-tracker-theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    themeToggleBtn.innerHTML = savedTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('dsa-tracker-theme', newTheme);
        themeToggleBtn.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        if (window.updateCharts) window.updateCharts(JSON.parse(localStorage.getItem('dsa-tracker-history')) || []);
    });

    // 1. INIT & COLLAPSE UI
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Notes Toggle
    const notesBtn = document.getElementById('toggle-notes-btn');
    const notesSection = document.getElementById('notes-section');
    notesBtn.addEventListener('click', () => {
        notesSection.classList.toggle('open');
        notesBtn.innerHTML = notesSection.classList.contains('open') ? '<i class="fas fa-chevron-up"></i> Hide Notes' : '<i class="fas fa-chevron-down"></i> Add Notes';
    });

    // Insights Toggle
    const insightsBtn = document.getElementById('toggle-charts-btn');
    const insightsPanel = document.getElementById('insights-panel');
    insightsBtn.addEventListener('click', () => {
        insightsPanel.classList.toggle('open');
    });

    let problems = JSON.parse(localStorage.getItem('dsa-tracker-history')) || [];
    let savedGoal = JSON.parse(localStorage.getItem('dsa-tracker-goal')) || { type: 'daily', target: 5 };
    document.getElementById('goal-type').value = savedGoal.type;
    document.getElementById('goal-target').value = savedGoal.target;

    // 2. TAGS & TIMER
    const tagDropdown = document.getElementById('tag-dropdown');
    const selectedTagsContainer = document.getElementById('selected-tags');
    let selectedTags = new Set();

    tagDropdown.addEventListener('change', (e) => {
        if (e.target.value && !selectedTags.has(e.target.value)) {
            selectedTags.add(e.target.value); renderTags();
        }
        e.target.value = "";
    });

    function renderTags() {
        selectedTagsContainer.innerHTML = '';
        selectedTags.forEach(tag => {
            const span = document.createElement('span'); span.className = 'tag-pill';
            span.innerHTML = `${tag} <i class="fas fa-times remove-tag" onclick="removeTag('${tag}')"></i>`;
            selectedTagsContainer.appendChild(span);
        });
    }
    window.removeTag = (tag) => { selectedTags.delete(tag); renderTags(); };

    let timerInterval, totalSecs = 0;
    const timerDisplay = document.getElementById('timer-display');
    const timeInput = document.getElementById('time-taken');

    document.getElementById('start-timer').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            totalSecs++;
            timerDisplay.textContent = `${String(Math.floor(totalSecs / 60)).padStart(2, '0')}:${String(totalSecs % 60).padStart(2, '0')}`;
        }, 1000);
    });
    document.getElementById('pause-timer').addEventListener('click', () => clearInterval(timerInterval));
    document.getElementById('save-timer').addEventListener('click', () => {
        clearInterval(timerInterval);
        if (totalSecs > 0) timeInput.value = Math.ceil(totalSecs / 60);
    });

    // 3. GOALS & AUTOFILL
    document.getElementById('edit-goal-btn').addEventListener('click', () => {
        document.getElementById('goal-view-mode').style.display = 'none';
        document.getElementById('goal-edit-mode').style.display = 'flex';
    });
    document.getElementById('save-goal-btn').addEventListener('click', () => {
        savedGoal = { type: document.getElementById('goal-type').value, target: parseInt(document.getElementById('goal-target').value) || 0 };
        localStorage.setItem('dsa-tracker-goal', JSON.stringify(savedGoal));
        document.getElementById('goal-view-mode').style.display = 'flex';
        document.getElementById('goal-edit-mode').style.display = 'none';
        updateDashboard();
    });

    document.getElementById('autofill-btn').addEventListener('click', () => {
        const url = document.getElementById('problem-link').value;
        if (url.includes('leetcode.com/problems/')) {
            document.getElementById('platform').value = 'LeetCode';
            document.getElementById('problem-name').value = url.split('problems/')[1].split('/')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        } else if (url.includes('codeforces.com')) {
            document.getElementById('platform').value = 'Codeforces';
        }
    });

    // 4. SUBMIT & EDIT
    const form = document.getElementById('tracker-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-id').value;
        const statusRadio = document.querySelector('input[name="revision-status"]:checked');
        const statusEmoji = statusRadio.value === 'red' ? '🔴' : (statusRadio.value === 'yellow' ? '🟡' : '🟢');

        const probData = {
            id: editId ? parseInt(editId) : Date.now(),
            date: document.getElementById('date').value,
            timeOfDay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            platform: document.getElementById('platform').value,
            name: document.getElementById('problem-name').value,
            difficulty: document.getElementById('difficulty').value,
            tags: Array.from(selectedTags),
            time: document.getElementById('time-taken').value || '0',
            status: statusEmoji,
            statusVal: statusRadio.value,
            link: document.getElementById('problem-link').value,
            initialIdea: document.getElementById('initial-idea').value,
            missedPoints: document.getElementById('missed-points').value,
            trickUsed: document.getElementById('trick-used').value
        };

        if (editId) {
            problems = problems.map(p => p.id === parseInt(editId) ? probData : p);
        } else {
            problems.unshift(probData);
        }

        localStorage.setItem('dsa-tracker-history', JSON.stringify(problems));
        renderHistory();
        resetForm();
    });

    cancelEditBtn.addEventListener('click', resetForm);

    function resetForm() {
        form.reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('date').valueAsDate = new Date();
        selectedTags.clear();
        renderTags();
        clearInterval(timerInterval);
        totalSecs = 0;
        timerDisplay.textContent = "00:00";
        document.getElementById('form-title').innerHTML = 'Log a Problem';
        document.getElementById('save-btn').innerHTML = 'Save Problem';
        cancelEditBtn.style.display = 'none';
        document.getElementById('notes-section').classList.remove('open');
        document.getElementById('toggle-notes-btn').innerHTML = '<i class="fas fa-chevron-down"></i> Add Notes';
        document.querySelector('input[name="revision-status"][value="green"]').checked = true;
    }

    // Attach to Window for table row buttons
    window.editProblem = (id) => {
        const p = problems.find(prob => prob.id === id);
        if (!p) return;

        document.getElementById('edit-id').value = p.id;
        document.getElementById('date').value = p.date;
        document.getElementById('platform').value = p.platform;
        document.getElementById('problem-name').value = p.name;
        document.getElementById('difficulty').value = p.difficulty;
        document.getElementById('problem-link').value = p.link || '';
        document.getElementById('time-taken').value = p.time;
        document.getElementById('initial-idea').value = p.initialIdea || '';
        document.getElementById('missed-points').value = p.missedPoints || '';
        document.getElementById('trick-used').value = p.trickUsed || '';

        const statusVal = p.statusVal || (p.status === '🔴' ? 'red' : (p.status === '🟡' ? 'yellow' : 'green'));
        document.querySelector(`input[name="revision-status"][value="${statusVal}"]`).checked = true;

        selectedTags = new Set(p.tags); renderTags();
        document.getElementById('notes-section').classList.add('open');
        notesBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Notes';

        document.getElementById('form-title').innerHTML = '<i class="fas fa-pen"></i> Edit Problem';
        document.getElementById('save-btn').innerHTML = 'Update Problem';
        cancelEditBtn.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.toggleRow = (el) => {
        el.classList.toggle('expanded');
        const collapse = el.nextElementSibling.querySelector('.smooth-collapse');
        collapse.classList.toggle('open');
    };

    // 5. CHART FILTERS & LOGIC
    let diffChart = null, tagChart = null, timeChart = null;
    ['chart-platform', 'chart-time', 'chart-type'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => window.updateCharts(problems));
    });

    window.updateCharts = function (allData) {
        if (typeof Chart === 'undefined') return;

        // Handle Empty State
        const emptyState = document.getElementById('insights-empty-state');
        const chartsWrapper = document.getElementById('insights-charts-wrapper');
        if (allData.length === 0) {
            emptyState.style.display = 'block';
            chartsWrapper.style.display = 'none';
            return;
        } else {
            emptyState.style.display = 'none';
            chartsWrapper.style.display = 'flex';
        }

        const pFilter = document.getElementById('chart-platform').value;
        const timeFilter = document.getElementById('chart-time').value;
        const typeFilter = document.getElementById('chart-type').value;

        const now = new Date();
        let cData = allData.filter(p => {
            if (timeFilter !== 'all' && (now - new Date(p.date)) / 86400000 > parseInt(timeFilter)) return false;
            if (pFilter !== 'All' && p.platform !== pFilter) return false;
            return true;
        });

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const txtColor = isDark ? '#94a3b8' : '#1f2937';
        Chart.defaults.color = txtColor;

        // --- Difficulty Chart (Pie or Bar) ---
        let dLabels = [], dData = [], dColors = [];
        if (pFilter === 'Codeforces') {
            let counts = {};
            cData.forEach(p => { const d = p.difficulty || 'Unrated'; counts[d] = (counts[d] || 0) + 1; });
            dLabels = Object.keys(counts).sort((a, b) => parseInt(a) - parseInt(b));
            dData = dLabels.map(l => counts[l]);
            dColors = '#8b5cf6'; // CF Purple
            document.getElementById('chart-type').value = 'bar'; // Auto force bar for ratings
        } else {
            let counts = { easy: 0, medium: 0, hard: 0, other: 0 };
            cData.forEach(p => {
                const d = p.difficulty.toLowerCase();
                if (d.includes('easy')) counts.easy++; else if (d.includes('medium')) counts.medium++; else if (d.includes('hard')) counts.hard++; else counts.other++;
            });
            dLabels = ['Easy', 'Medium', 'Hard', 'Other']; dData = [counts.easy, counts.medium, counts.hard, counts.other];
            dColors = ['#10b981', '#f59e0b', '#ef4444', '#64748b'];
        }

        if (diffChart) diffChart.destroy();
        diffChart = new Chart(document.getElementById('difficultyChart'), {
            type: document.getElementById('chart-type').value,
            data: { labels: dLabels, datasets: [{ label: 'Problems', data: dData, backgroundColor: dColors, borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: pFilter === 'Codeforces' ? 'CF Ratings' : 'Difficulty' }, legend: { display: document.getElementById('chart-type').value === 'doughnut' } } }
        });

        // --- Tag Chart (Always Bar) ---
        let tagCounts = {};
        cData.forEach(p => p.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

        if (tagChart) tagChart.destroy();
        tagChart = new Chart(document.getElementById('tagChart'), {
            type: 'bar',
            data: { labels: sortedTags.map(t => t[0]), datasets: [{ label: 'Uses', data: sortedTags.map(t => t[1]), backgroundColor: '#3b82f6', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Top 5 Tags' }, legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 } } } }
        });

        // --- NEW: Average Time per Difficulty/Rating Chart ---
        let timeStats = {};
        cData.forEach(p => {
            const timeTaken = parseInt(p.time) || 0;
            if (timeTaken === 0) return; // Skip if no time was logged

            let key;
            if (pFilter === 'Codeforces') {
                key = p.difficulty || 'Unrated';
            } else {
                const d = p.difficulty.toLowerCase();
                if (d.includes('easy')) key = 'Easy';
                else if (d.includes('medium')) key = 'Medium';
                else if (d.includes('hard')) key = 'Hard';
                else key = 'Other';
            }

            if (!timeStats[key]) timeStats[key] = { total: 0, count: 0 };
            timeStats[key].total += timeTaken;
            timeStats[key].count += 1;
        });
        let tLabels = [];
        if (pFilter === 'Codeforces') {
            tLabels = Object.keys(timeStats).sort((a, b) => parseInt(a) - parseInt(b));
        } else {
            tLabels = ['Easy', 'Medium', 'Hard', 'Other'].filter(k => timeStats[k]);
        }
        let tData = tLabels.map(l => Math.round(timeStats[l].total / timeStats[l].count));

        if (timeChart) timeChart.destroy();
        timeChart = new Chart(document.getElementById('timeChart'), {
            type: 'bar',
            data: { labels: tLabels, datasets: [{ label: 'Avg Time (mins)', data: tData, backgroundColor: '#f59e0b', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Avg Time per Difficulty' }, legend: { display: false } }, scales: { y: { ticks: { color: txtColor } }, x: { ticks: { color: txtColor } } } }
        });
    };

    // 6. HISTORY TABLE & DASHBOARD
    // Setup Advanced Filter Triggers
    ['search-filter', 'status-filter', 'sort-filter', 'platform-filter', 'diff-filter'].forEach(id => {
        document.getElementById(id).addEventListener(id.includes('search') || id.includes('diff') ? 'input' : 'change', renderHistory);
    });

    // Setup Multi-Tag Filter Logic
    const filterTagDropdown = document.getElementById('filter-tag-dropdown');
    const activeFilterTagsContainer = document.getElementById('active-filter-tags');
    let filterTags = new Set();

    filterTagDropdown.addEventListener('change', (e) => {
        if (e.target.value && !filterTags.has(e.target.value)) {
            filterTags.add(e.target.value);
            renderFilterTags();
            renderHistory(); // Re-render table when tag added
        }
        e.target.value = "";
    });

    function renderFilterTags() {
        activeFilterTagsContainer.innerHTML = '';
        filterTags.forEach(tag => {
            const span = document.createElement('span'); span.className = 'tag-pill';
            span.innerHTML = `${tag} <i class="fas fa-times remove-tag" onclick="removeFilterTag('${tag}')"></i>`;
            activeFilterTagsContainer.appendChild(span);
        });
    }

    // Attach to window so the inline onclick works
    window.removeFilterTag = (tag) => {
        filterTags.delete(tag);
        renderFilterTags();
        renderHistory(); // Re-render table when tag removed
    };

    function renderHistory() {
        const tbody = document.querySelector('#history-table tbody');
        const search = document.getElementById('search-filter').value.toLowerCase();
        const status = document.getElementById('status-filter').value;
        const sort = document.getElementById('sort-filter').value;
        const platform = document.getElementById('platform-filter').value;
        const diff = document.getElementById('diff-filter').value.toLowerCase();

        let filtered = problems.filter(p => {
            // 1. Text Search (Problem Name only)
            const mSearch = p.name.toLowerCase().includes(search);
            // 2. Status Match
            const mStatus = status === 'All' || p.status === status;
            // 3. Platform Match
            const mPlatform = platform === 'All' || p.platform === platform;
            // 4. Difficulty/Rating Match (Allows partial typing like "12" for "1200" or "med" for "Medium")
            const mDiff = diff === '' || (p.difficulty && p.difficulty.toLowerCase().includes(diff));

            // 5. Multi-Tag Logic (AND Logic: Problem must contain ALL selected filter tags)
            let mTags = true;
            if (filterTags.size > 0) {
                const probTagsLower = p.tags.map(t => t.toLowerCase());
                mTags = [...filterTags].every(ft => probTagsLower.includes(ft.toLowerCase()));
            }

            // Must pass ALL filters to be displayed
            return mSearch && mStatus && mPlatform && mDiff && mTags;
        });

        filtered.sort((a, b) => {
            if (sort === 'date-desc') return b.id - a.id;
            if (sort === 'date-asc') return a.id - b.id;
            if (sort === 'duration-desc') return parseInt(b.time) - parseInt(a.time);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No matching problems found.</td></tr>`;
        } else {
            tbody.innerHTML = filtered.map(p => {
                const link = p.link ? `<a href="${p.link}" target="_blank">${p.name}</a>` : `<strong>${p.name}</strong>`;
                const tags = p.tags.map(t => `<span class="tag-pill">${t}</span>`).join('');
                return `
                <tr class="main-row" onclick="toggleRow(this)">
                    <td>${p.date}<br><small style="color:var(--text-muted);">${p.timeOfDay || ''}</small></td>
                    <td>${p.platform}</td><td>${link}</td><td>${p.difficulty}</td>
                    <td><div class="selected-tags">${tags}</div></td><td>${p.time}m</td><td>${p.status}</td>
                    <td style="text-align: right;">
                        <button class="row-action-btn" title="Edit Problem" onclick="event.stopPropagation(); editProblem(${p.id})">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </td>
                </tr>
                <tr class="details-row">
                    <td colspan="8" class="details-td">
                        <div class="smooth-collapse">
                            <div class="collapse-inner">
                                <!-- NEW WRAPPER: details-box -->
                                <div class="details-box">
                                    <div><strong>💡 Idea:</strong> ${p.initialIdea || '-'}</div>
                                    <div><strong>⚠️ Mistakes:</strong> ${p.missedPoints || '-'}</div>
                                    <div><strong>🔑 Trick:</strong> ${p.trickUsed || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        updateDashboard();
        if (window.updateCharts) window.updateCharts(problems);
    }

    function updateDashboard() {
        // Goal Math
        let dailyReq = savedGoal.target;
        if (savedGoal.type === 'weekly') dailyReq = Math.ceil(savedGoal.target / 7);
        if (savedGoal.type === 'monthly') dailyReq = Math.ceil(savedGoal.target / 30);
        document.getElementById('daily-req-txt').innerHTML = `<i class="fas fa-info-circle"></i> Complete ${dailyReq} per day to keep streak`;

        // Progress Math
        let completed = 0;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        problems.forEach(p => {
            const diffDays = Math.ceil(Math.abs(now - new Date(p.date).setHours(0, 0, 0, 0)) / 86400000);
            if (savedGoal.type === 'daily' && diffDays === 0) completed++;
            if (savedGoal.type === 'weekly' && diffDays <= 7) completed++;
            if (savedGoal.type === 'monthly' && diffDays <= 30) completed++;
        });
        document.getElementById('progress-text').textContent = `${completed} / ${savedGoal.target}`;
        document.getElementById('progress-bar').value = savedGoal.target ? Math.min((completed / savedGoal.target) * 100, 100) : 0;

        const msg = document.getElementById('motivation-msg');
        if (!savedGoal.target) msg.textContent = 'Set a goal!';
        else if (completed >= savedGoal.target) msg.textContent = 'Goal Crushed! 🎉';
        else msg.textContent = `🚀 Just ${savedGoal.target - completed} more to go!`;

        // Streak Math
        const dateCounts = {};
        problems.forEach(p => { dateCounts[p.date] = (dateCounts[p.date] || 0) + 1; });
        let streak = 0, curr = new Date(); curr.setHours(0, 0, 0, 0);
        let dStr = curr.toISOString().split('T')[0];

        if (!dateCounts[dStr] || dateCounts[dStr] < dailyReq) {
            curr.setDate(curr.getDate() - 1); dStr = curr.toISOString().split('T')[0];
        }
        while (dateCounts[dStr] && dateCounts[dStr] >= dailyReq) {
            streak++; curr.setDate(curr.getDate() - 1); dStr = curr.toISOString().split('T')[0];
        }
        document.getElementById('streak-msg').textContent = streak;

        // Update Insight Stats
        document.getElementById('insight-total').textContent = problems.length;
        const totalTime = problems.reduce((sum, p) => sum + (parseInt(p.time) || 0), 0);
        document.getElementById('insight-avg').textContent = problems.length ? `${Math.round(totalTime / problems.length)}m` : '0m';
    }

    renderHistory();
});