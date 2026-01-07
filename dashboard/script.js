let currentUser = null;
let currentGuilds = [];
let currentServerId = null;
let currentSettings = {};
let serverData = {};

async function init() {
    try {
        const res = await fetch('/api/user');
        if (!res.ok) {
            window.location.href = '/';
            return;
        }
        const data = await res.json();
        currentUser = data.user;
        currentGuilds = data.guilds;

        renderUser();
        renderServers();
    } catch (e) {
        window.location.href = '/';
    }
}

function renderUser() {
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userTag').textContent = `#${currentUser.discriminator || '0'}`;
    document.getElementById('userAvatar').src = currentUser.avatar
        ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
}

function renderServers() {
    const list = document.getElementById('serversList');
    list.innerHTML = '';

    currentGuilds.forEach(guild => {
        const div = document.createElement('div');
        div.className = 'server-item';
        div.innerHTML = `
            <div class="server-icon">
                ${guild.icon
                ? `<img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png" alt="">`
                : guild.name.charAt(0)}
            </div>
            <span>${guild.name}</span>
        `;
        div.onclick = () => selectServer(guild.id);
        list.appendChild(div);
    });
}

async function selectServer(id) {
    currentServerId = id;

    document.querySelectorAll('.server-item').forEach((el, i) => {
        el.classList.toggle('active', currentGuilds[i]?.id === id);
    });

    try {
        const res = await fetch(`/api/server/${id}`);
        serverData = await res.json();
        currentSettings = serverData.settings || {};

        document.getElementById('noServerSelected').style.display = 'none';
        document.getElementById('serverContent').style.display = 'block';
        document.getElementById('serverName').textContent = serverData.guild.name;

        renderStats();
        renderTab('general');
    } catch (e) {
        console.error(e);
    }
}

function renderStats() {
    const grid = document.getElementById('statsGrid');
    const shops = serverData.shops || [];
    const ratings = serverData.ratings || [];

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${shops.length}</div>
            <div class="stat-label">عدد المتاجر</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${ratings.length}</div>
            <div class="stat-label">عدد التقييمات</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${serverData.bannedUsers?.length || 0}</div>
            <div class="stat-label">المحظورين</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${serverData.topShops?.[0]?.name || '-'}</div>
            <div class="stat-label">⭐ أفضل متجر</div>
        </div>
    `;
}

function renderTab(tab) {
    document.querySelectorAll('.tab').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });

    const content = document.getElementById('tabContent');

    switch (tab) {
        case 'general':
            content.innerHTML = `
                <div class="settings-section">
                    <h2>⚙️ الإعدادات العامة</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم البوت</label>
                            <input type="text" id="botName" value="${currentSettings.botName || 'متجر شوب'}">
                        </div>
                        <div class="form-group">
                            <label>شعار المتجر (الحروف)</label>
                            <input type="text" id="shopLogo" value="${currentSettings.shopLogo || 'Ar'}" maxlength="5">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>حساب التحويل (Discord ID)</label>
                        <input type="text" id="transferAccount" value="${currentSettings.transferAccount || ''}">
                    </div>
                    <div class="form-group">
                        <label>تفعيل نظام التقييم</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="ratingEnabled" ${currentSettings.ratingEnabled !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h2>💰 أسعار المتاجر</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>سعر المتجر العادي (Normal)</label>
                            <input type="number" id="priceNormal" value="${currentSettings.shopTypes?.normal?.price || 1000}">
                        </div>
                        <div class="form-group">
                            <label>منشنات المتجر العادي</label>
                            <input type="number" id="mentionsNormal" value="${currentSettings.shopTypes?.normal?.mentions || 5}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>سعر المتجر المميز (Good)</label>
                            <input type="number" id="priceGood" value="${currentSettings.shopTypes?.good?.price || 3000}">
                        </div>
                        <div class="form-group">
                            <label>منشنات المتجر المميز</label>
                            <input type="number" id="mentionsGood" value="${currentSettings.shopTypes?.good?.mentions || 15}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>سعر المساعد</label>
                            <input type="number" id="helperPrice" value="${currentSettings.helperPrice || 2000}">
                        </div>
                        <div class="form-group">
                            <label>سعر المنشن الإضافي</label>
                            <input type="number" id="mentionPrice" value="${currentSettings.mentionPrice || 500}">
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'shops':
            const shops = serverData.shops || [];
            content.innerHTML = `
                <div class="settings-section">
                    <h2>🏪 المتاجر (${shops.length})</h2>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>الشعار</th>
                                    <th>النوع</th>
                                    <th>الفئة</th>
                                    <th>المنشنات</th>
                                    <th>التقييم</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${shops.map(s => `
                                    <tr>
                                        <td>${s.name}</td>
                                        <td><span class="badge badge-gold">${s.logo}</span></td>
                                        <td><span class="badge badge-${s.type === 'good' ? 'success' : 'warning'}">${s.type}</span></td>
                                        <td>${s.category}</td>
                                        <td>${s.mentions_left}</td>
                                        <td>${s.rating_count > 0 ? `${(s.rating_total / s.rating_count).toFixed(1)} ⭐` : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            break;

        case 'categories':
            const cats = currentSettings.categories || [
                { name: 'عادي', price: 1000 },
                { name: 'مميز', price: 3000 },
                { name: 'احترافي', price: 5000 },
                { name: 'الاساطير', price: 9999 }
            ];
            content.innerHTML = `
                <div class="settings-section">
                    <h2>📁 الفئات (${cats.length}/10)</h2>
                    <div id="categoriesList">
                        ${cats.map((c, i) => `
                            <div class="category-item">
                                <input type="text" value="${c.name}" data-cat-name="${i}">
                                <input type="number" value="${c.price}" data-cat-price="${i}" style="max-width: 150px;">
                                <button class="btn btn-danger" onclick="removeCategory(${i})">حذف</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="addCategory()" style="margin-top: 15px;">+ إضافة فئة</button>
                </div>
            `;
            break;

        case 'encryption':
            const words = currentSettings.encryptionWords || {
                'بيع': 'بي3',
                'شراء': 'شر4ء',
                'سعر': 'سع2',
                'حساب': 'ح5اب'
            };
            content.innerHTML = `
                <div class="settings-section">
                    <h2>🔐 كلمات التشفير</h2>
                    <div id="encryptionList">
                        ${Object.entries(words).map(([orig, enc], i) => `
                            <div class="encryption-item">
                                <input type="text" value="${orig}" data-enc-orig="${i}">
                                <span>➜</span>
                                <input type="text" value="${enc}" data-enc-new="${i}">
                                <button class="btn btn-danger" onclick="removeEncryption('${orig}')">حذف</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="addEncryption()" style="margin-top: 15px;">+ إضافة كلمة</button>
                </div>
            `;
            break;

        case 'warnings':
            content.innerHTML = `
                <div class="settings-section">
                    <h2>⚠️ نظام التحذيرات</h2>
                    <div class="form-group">
                        <label>حد التحذيرات قبل البان</label>
                        <input type="number" id="warningLimit" value="${currentSettings.warningLimit || 3}" min="1" max="10">
                    </div>
                    <p style="color: var(--text-muted);">عند وصول المستخدم لهذا العدد من التحذيرات، سيتم حظره تلقائياً من إنشاء المتاجر</p>
                </div>
            `;
            break;

        case 'ratings':
            const topShops = serverData.topShops || [];
            content.innerHTML = `
                <div class="settings-section">
                    <h2>🏆 أفضل المتاجر</h2>
                    ${topShops.map((s, i) => `
                        <div class="top-shop">
                            <div class="top-shop-rank">#${i + 1}</div>
                            <div class="top-shop-info">
                                <h4>${s.logo} | ${s.name}</h4>
                                <p>
                                    <span class="stars">${'⭐'.repeat(Math.round(s.avg_rating))}</span>
                                    (${s.avg_rating?.toFixed(1) || 0}) - ${s.rating_count} تقييم
                                </p>
                            </div>
                        </div>
                    `).join('') || '<p style="color: var(--text-muted);">لا توجد تقييمات بعد</p>'}
                </div>
            `;
            break;

        case 'bans':
            const bans = serverData.bannedUsers || [];
            content.innerHTML = `
                <div class="settings-section">
                    <h2>🚫 المحظورين (${bans.length})</h2>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label>حظر مستخدم جديد</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="banUserId" placeholder="Discord ID">
                            <input type="text" id="banReason" placeholder="السبب">
                            <button class="btn btn-danger" onclick="banUser()">حظر</button>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>السبب</th>
                                    <th>التحذيرات</th>
                                    <th>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bans.map(b => `
                                    <tr>
                                        <td>${b.id}</td>
                                        <td>${b.ban_reason || '-'}</td>
                                        <td>${b.warnings}</td>
                                        <td><button class="btn btn-success" onclick="unbanUser('${b.id}')">فك الحظر</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            break;
    }
}

function addCategory() {
    if (!currentSettings.categories) {
        currentSettings.categories = [];
    }
    if (currentSettings.categories.length >= 10) {
        alert('الحد الأقصى 10 فئات');
        return;
    }
    currentSettings.categories.push({ name: 'جديد', price: 1000 });
    renderTab('categories');
}

function removeCategory(index) {
    if (currentSettings.categories) {
        currentSettings.categories.splice(index, 1);
        renderTab('categories');
    }
}

function addEncryption() {
    if (!currentSettings.encryptionWords) {
        currentSettings.encryptionWords = {};
    }
    const orig = prompt('الكلمة الأصلية:');
    const enc = prompt('الكلمة المشفرة:');
    if (orig && enc) {
        currentSettings.encryptionWords[orig] = enc;
        renderTab('encryption');
    }
}

function removeEncryption(orig) {
    if (currentSettings.encryptionWords) {
        delete currentSettings.encryptionWords[orig];
        renderTab('encryption');
    }
}

async function banUser() {
    const userId = document.getElementById('banUserId').value;
    const reason = document.getElementById('banReason').value;
    if (!userId) return;

    try {
        await fetch(`/api/server/${currentServerId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, reason })
        });
        await selectServer(currentServerId);
        renderTab('bans');
    } catch (e) {
        console.error(e);
    }
}

async function unbanUser(userId) {
    try {
        await fetch(`/api/server/${currentServerId}/unban/${userId}`, { method: 'POST' });
        await selectServer(currentServerId);
        renderTab('bans');
    } catch (e) {
        console.error(e);
    }
}

function collectSettings() {
    const settings = { ...currentSettings };

    const botName = document.getElementById('botName');
    if (botName) settings.botName = botName.value;

    const shopLogo = document.getElementById('shopLogo');
    if (shopLogo) settings.shopLogo = shopLogo.value;

    const transferAccount = document.getElementById('transferAccount');
    if (transferAccount) settings.transferAccount = transferAccount.value;

    const ratingEnabled = document.getElementById('ratingEnabled');
    if (ratingEnabled) settings.ratingEnabled = ratingEnabled.checked;

    const priceNormal = document.getElementById('priceNormal');
    const mentionsNormal = document.getElementById('mentionsNormal');
    const priceGood = document.getElementById('priceGood');
    const mentionsGood = document.getElementById('mentionsGood');

    if (priceNormal) {
        settings.shopTypes = {
            normal: { price: parseInt(priceNormal.value), mentions: parseInt(mentionsNormal?.value || 5) },
            good: { price: parseInt(priceGood?.value || 3000), mentions: parseInt(mentionsGood?.value || 15) }
        };
    }

    const helperPrice = document.getElementById('helperPrice');
    if (helperPrice) settings.helperPrice = parseInt(helperPrice.value);

    const mentionPrice = document.getElementById('mentionPrice');
    if (mentionPrice) settings.mentionPrice = parseInt(mentionPrice.value);

    const warningLimit = document.getElementById('warningLimit');
    if (warningLimit) settings.warningLimit = parseInt(warningLimit.value);

    document.querySelectorAll('[data-cat-name]').forEach((el, i) => {
        if (!settings.categories) settings.categories = [];
        const priceEl = document.querySelector(`[data-cat-price="${i}"]`);
        settings.categories[i] = { name: el.value, price: parseInt(priceEl?.value || 1000) };
    });

    const encWords = {};
    document.querySelectorAll('[data-enc-orig]').forEach((el, i) => {
        const newEl = document.querySelector(`[data-enc-new="${i}"]`);
        if (el.value && newEl?.value) {
            encWords[el.value] = newEl.value;
        }
    });
    if (Object.keys(encWords).length > 0) {
        settings.encryptionWords = encWords;
    }

    return settings;
}

async function saveSettings() {
    const settings = collectSettings();

    try {
        const res = await fetch(`/api/server/${currentServerId}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (res.ok) {
            currentSettings = settings;
            alert('✅ تم الحفظ بنجاح');
        } else {
            alert('❌ حدث خطأ');
        }
    } catch (e) {
        console.error(e);
        alert('❌ حدث خطأ');
    }
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => renderTab(tab.dataset.tab);
});

document.getElementById('saveBtn').onclick = saveSettings;

init();
