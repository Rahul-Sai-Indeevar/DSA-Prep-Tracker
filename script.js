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
        if (window.updateCharts) window.updateCharts(problems);
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

    let problems = []; // We will fetch this from the DB now!
    const API_BASE_URL = 'https://dsa-prep-tracker-30zt.onrender.com/api';

    // Fetch data from Python Backend
    async function fetchProblems() {
        try {
            const response = await fetch(`${API_BASE_URL}/problems`);
            if (response.ok) {
                problems = await response.json();
                renderHistory(); // Draw the table once data loads
            }
        } catch (error) {
            console.error("Failed to fetch from backend:", error);
            // Fallback to local storage if server is offline just so UI doesn't break
            problems = JSON.parse(localStorage.getItem('dsa-tracker-history')) || [];
            renderHistory();
        }
    }

    fetchProblems(); // Call it immediately

    // Handle migration from old single-number goal to new multi-category format
    let savedGoal = JSON.parse(localStorage.getItem('dsa-tracker-goal'));
    if (!savedGoal || typeof savedGoal.target === 'number') {
        savedGoal = {
            type: savedGoal ? savedGoal.type : 'daily',
            targets: { 'DSA': savedGoal ? savedGoal.target : 5, 'SQL': 0, 'Pandas': 0, 'Machine Learning': 0 }
        };
    }

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
        document.getElementById('goal-type').value = savedGoal.type;
        document.getElementById('goal-dsa').value = savedGoal.targets['DSA'];
        document.getElementById('goal-sql').value = savedGoal.targets['SQL'];
        document.getElementById('goal-pandas').value = savedGoal.targets['Pandas'];
        document.getElementById('goal-ml').value = savedGoal.targets['Machine Learning'];

        document.getElementById('goal-view-mode').style.display = 'none';
        document.getElementById('goal-edit-mode').style.display = 'block'; // Changed to block for layout
    });

    document.getElementById('save-goal-btn').addEventListener('click', () => {
        savedGoal = {
            type: document.getElementById('goal-type').value,
            targets: {
                'DSA': parseInt(document.getElementById('goal-dsa').value) || 0,
                'SQL': parseInt(document.getElementById('goal-sql').value) || 0,
                'Pandas': parseInt(document.getElementById('goal-pandas').value) || 0,
                'Machine Learning': parseInt(document.getElementById('goal-ml').value) || 0
            }
        };
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-id').value;
        const statusRadio = document.querySelector('input[name="revision-status"]:checked');
        const statusEmoji = statusRadio.value === 'red' ? '🔴' : (statusRadio.value === 'yellow' ? '🟡' : '🟢');

        const probData = {
            date: document.getElementById('date').value,
            timeOfDay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: document.getElementById('category').value,
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

        try {
            if (editId) {
                // UPDATE EXISTING PROBLEM IN DATABASE
                await fetch(`${API_BASE_URL}/problems/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(probData)
                });
            } else {
                // ADD NEW PROBLEM TO DATABASE
                await fetch(`${API_BASE_URL}/problems`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(probData)
                });
            }

            await fetchProblems(); // Re-fetch the updated list from the DB
            resetForm();

        } catch (error) {
            console.error("Error saving to database:", error);
            alert("Failed to save to database. Make sure your Python server is running!");
        }
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
        document.getElementById('category').value = p.category || 'DSA';
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
    ['chart-platform', 'chart-time', 'chart-type', 'chart-category'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => window.updateCharts(problems));
    });

    window.updateCharts = function (allData) {
        if (typeof Chart === 'undefined') return;

        const pFilter = document.getElementById('chart-platform').value;
        const timeFilter = document.getElementById('chart-time').value;
        const typeFilter = document.getElementById('chart-type').value;
        const catFilter = document.getElementById('chart-category').value;

        // 1. Filter the data first!
        const now = new Date();
        let cData = allData.filter(p => {
            if (timeFilter !== 'all' && (now - new Date(p.date)) / 86400000 > parseInt(timeFilter)) return false;
            if (pFilter !== 'All' && p.platform !== pFilter) return false;

            const pCat = p.category || 'DSA';
            if (catFilter !== 'All' && pCat !== catFilter) return false;

            return true;
        });

        // 2. NOW check if the filtered data is empty
        const emptyState = document.getElementById('insights-empty-state');
        const chartsWrapper = document.getElementById('insights-charts-wrapper');

        // Use cData.length instead of allData.length!
        if (cData.length === 0) {
            emptyState.style.display = 'block';
            chartsWrapper.style.display = 'none';
            // Also update the mini-stats to 0
            document.getElementById('insight-total').textContent = '0';
            document.getElementById('insight-avg').textContent = '0m';
            return;
        } else {
            emptyState.style.display = 'none';
            chartsWrapper.style.display = 'flex';

            // Update the mini-stats to reflect ONLY the filtered data
            document.getElementById('insight-total').textContent = cData.length;
            const totalTime = cData.reduce((sum, p) => sum + (parseInt(p.time) || 0), 0);
            document.getElementById('insight-avg').textContent = `${Math.round(totalTime / cData.length)}m`;
        }

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
            dColors = '#8b5cf6';
            document.getElementById('chart-type').value = 'bar'; 
        } else {
            let counts = { easy: 0, medium: 0, hard: 0, other: 0 };
            cData.forEach(p => {
                // Fallback to empty string to prevent crashes
                const d = (p.difficulty || '').toLowerCase();
                if (d.includes('easy')) counts.easy++;
                else if (d.includes('medium')) counts.medium++;
                else if (d.includes('hard')) counts.hard++;
                else counts.other++; // Empty difficulties will automatically be grouped into "Other"!
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
    ['search-filter', 'status-filter', 'sort-filter', 'platform-filter', 'diff-filter', 'category-filter'].forEach(id => {
        document.getElementById(id)?.addEventListener(id.includes('search') || id.includes('diff') ? 'input' : 'change', renderHistory);
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
        const category = document.getElementById('category').value;
        const platform = document.getElementById('platform-filter').value;
        const diff = document.getElementById('diff-filter').value.toLowerCase();

        let filtered = problems.filter(p => {
            // 1. Text Search (Problem Name only)
            const mSearch = p.name.toLowerCase().includes(search);
            // 2. Status Match
            const mStatus = status === 'All' || p.status === status;
            // 3. Platform Match
            const pCat = p.category || 'DSA';
            const mCategory = category === 'All' || pCat === category;
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
            return mSearch && mStatus && mPlatform && mDiff && mTags && mCategory;
        });

        filtered.sort((a, b) => {
            if (sort === 'date-desc') return b.id - a.id;
            if (sort === 'date-asc') return a.id - b.id;
            if (sort === 'duration-desc') return parseInt(b.time) - parseInt(a.time);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No matching problems found.</td></tr>`;
        } else {
            tbody.innerHTML = filtered.map(p => {
                const link = p.link ? `<a href="${p.link}" target="_blank">${p.name}</a>` : `<strong>${p.name}</strong>`;
                // If no tags, show a small gray dash
                const tags = p.tags && p.tags.length > 0
                    ? p.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')
                    : `<span style="color: var(--text-muted);">-</span>`;

                // If no time, show a dash instead of 'm'
                const displayTime = p.time ? `${p.time}m` : `<span style="color: var(--text-muted);">-</span>`;
                // If no difficulty, show a dash
                const displayDiff = p.difficulty ? p.difficulty : `<span style="color: var(--text-muted);">-</span>`;

                return `
                <tr class="main-row" onclick="toggleRow(this)">
                    <td>${p.date}<br><small style="color:var(--text-muted);">${p.timeOfDay || ''}</small></td>
                    <td><span style="font-weight:bold; color:var(--primary); font-size:12px;">${p.category || 'Other'}</span><br>${p.platform || 'Other'}</td>
                    <td>${link}</td>
                    <td>${displayDiff}</td>
                    <td><div class="selected-tags" style="margin:0;">${tags}</div></td>
                    <td>${displayTime}</td>
                    <td>${getStatusIcon(p.status)}</td>
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
        let totalTarget = 0;
        let dailyReq = 0;

        // Sum up the total target from all categories
        Object.values(savedGoal.targets).forEach(val => totalTarget += val);

        if (savedGoal.type === 'weekly') dailyReq = Math.ceil(totalTarget / 7);
        else if (savedGoal.type === 'monthly') dailyReq = Math.ceil(totalTarget / 30);
        else dailyReq = totalTarget; // daily

        document.getElementById('daily-req-txt').innerHTML = `<i class="fas fa-info-circle"></i> Complete ${dailyReq} per day to keep streak`;

        // Progress Math
        let completedCats = { 'DSA': 0, 'SQL': 0, 'Pandas': 0, 'Machine Learning': 0 };
        const now = new Date(); now.setHours(0, 0, 0, 0);

        problems.forEach(p => {
            const diffDays = Math.ceil(Math.abs(now - new Date(p.date).setHours(0, 0, 0, 0)) / 86400000);
            const isWithinTimeframe =
                (savedGoal.type === 'daily' && diffDays === 0) ||
                (savedGoal.type === 'weekly' && diffDays <= 7) ||
                (savedGoal.type === 'monthly' && diffDays <= 30);

            if (isWithinTimeframe) {
                const pCat = p.category || 'DSA';
                if (completedCats[pCat] !== undefined) completedCats[pCat]++;
            }
        });

        // Calculate Overall Progress & Breakdown HTML
        let totalCompleted = 0;
        let breakdownHTML = '';

        for (const [cat, target] of Object.entries(savedGoal.targets)) {
            if (target > 0) {
                // We cap the contribution to totalCompleted so over-solving one category doesn't mask under-solving another
                totalCompleted += Math.min(completedCats[cat], target);

                const isDone = completedCats[cat] >= target;
                const color = isDone ? '#10b981' : 'var(--text-muted)';
                breakdownHTML += `<span style="color: ${color}">${cat}: ${completedCats[cat]}/${target}</span>`;
            }
        }

        document.getElementById('progress-text').textContent = `${totalCompleted} / ${totalTarget}`;
        document.getElementById('progress-bar').value = totalTarget > 0 ? Math.min((totalCompleted / totalTarget) * 100, 100) : 0;
        document.getElementById('goal-breakdown').innerHTML = breakdownHTML;

        const msg = document.getElementById('motivation-msg');
        if (totalTarget === 0) msg.textContent = 'Set a goal!';
        else if (totalCompleted >= totalTarget) msg.textContent = 'Goal Crushed! 🎉';
        else msg.textContent = `🚀 Just ${totalTarget - totalCompleted} more to go!`;

        // Streak Math (Streak checks if you met the TOTAL daily requirement)
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
    // ==========================================
    // 7. AI CHEAT SHEET LOGIC
    // ==========================================
    const aiModal = document.getElementById('ai-modal');
    const closeAiBtn = document.getElementById('close-modal-btn');
    const aiAnalyzeBtn = document.getElementById('ai-analyze-btn');
    const aiLoading = document.getElementById('ai-loading');
    const aiResponse = document.getElementById('ai-response');

    closeAiBtn.addEventListener('click', () => aiModal.classList.add('hidden'));

    aiAnalyzeBtn.addEventListener('click', async () => {
        if (problems.length === 0) {
            alert("Log some problems first so the AI has data to analyze!");
            return;
        }

        // 1. Open Modal & Show Loading
        aiModal.classList.remove('hidden');
        aiLoading.classList.remove('hidden');
        aiResponse.innerHTML = '';

        // 2. Prepare the data payload for the AI
        // We strip out unneeded data to save tokens/bandwidth
        const aiPayload = problems.map(p => ({
            name: p.name,
            category: p.category,
            difficulty: p.difficulty,
            status: p.statusVal, // 'red', 'yellow', 'green'
            mistakes: p.missedPoints,
            trick: p.trickUsed
        }));

        const promptText = `
            Act as an expert SDE and Data Science technical interviewer.
            Here is a JSON list of the coding problems I have practiced recently: 
            ${JSON.stringify(aiPayload)}
            
            Please provide:
            1. An analysis of my weak points (based on 'red'/'yellow' statuses and my mistakes).
            2. A customized revision cheat sheet highlighting the 'tricks' I used in the problems I solved.
            Keep it highly technical, encouraging, and formatted with clean bullet points.
        `;

        try {
            // TALK TO PYTHON BACKEND!
            const response = await fetch(`${API_BASE_URL}/ai-analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText })
            });

            if (response.ok) {
                const data = await response.json();
                aiLoading.classList.add('hidden');
                aiResponse.innerHTML = data.reply;
            } else {
                throw new Error("API returned an error");
            }
        } catch (error) {
            aiLoading.classList.add('hidden');
            aiResponse.innerHTML = `<p style="color: red;">Error connecting to Python backend. Is the server running?</p>`;
        }
    });
});