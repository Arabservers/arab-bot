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
                            <label>شعار المتجر (يظهر جنب الروم)</label>
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
                    <div class="form-group">
                        <label>رابط Webhook اللوج (اختياري)</label>
                        <input type="text" id="logWebhook" value="${currentSettings.logWebhook || ''}" placeholder="https://discord.com/api/webhooks/...">
                        <small style="color: var(--text-muted);">سيتم إرسال لوج لكل عملية في السيرفر</small>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h2>💰 أسعار المتاجر</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>سعر المتجر العادي</label>
                            <input type="number" id="priceNormal" value="${currentSettings.shopTypes?.normal?.price || 1000}">
                        </div>
                        <div class="form-group">
                            <label>منشنات العادي</label>
                            <input type="number" id="mentionsNormal" value="${currentSettings.shopTypes?.normal?.mentions || 5}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>سعر المتجر المميز</label>
                            <input type="number" id="priceGood" value="${currentSettings.shopTypes?.good?.price || 3000}">
                        </div>
                        <div class="form-group">
                            <label>منشنات المميز</label>
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

        case 'panel':
            content.innerHTML = `
                <div class="settings-section">
                    <h2>🤖 حالة البوت</h2>
                    <div id="botStatus" style="padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.3); margin-bottom: 15px;">
                        <span style="color: var(--warning);">⏳ جاري التحقق...</span>
                    </div>
                    <button class="btn btn-secondary" onclick="checkBotStatus()">🔄 تحقق من البوت</button>
                </div>
                
                <div class="settings-section">
                    <h2>🎫 إعدادات التكت</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم زر شراء المتجر</label>
                            <input type="text" id="ticketBtnShop" value="${currentSettings.ticketButtons?.shop || 'شراء متجر 🏪'}">
                        </div>
                        <div class="form-group">
                            <label>اسم زر المنشنات</label>
                            <input type="text" id="ticketBtnMentions" value="${currentSettings.ticketButtons?.mentions || 'منشنات 📢'}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم زر المساعد</label>
                            <input type="text" id="ticketBtnHelper" value="${currentSettings.ticketButtons?.helper || 'مساعد 👥'}">
                        </div>
                        <div class="form-group">
                            <label>لون الأزرار</label>
                            <select id="ticketBtnColor">
                                <option value="Primary" ${currentSettings.ticketButtons?.color === 'Primary' ? 'selected' : ''}>أزرق</option>
                                <option value="Success" ${currentSettings.ticketButtons?.color === 'Success' ? 'selected' : ''}>أخضر</option>
                                <option value="Danger" ${currentSettings.ticketButtons?.color === 'Danger' ? 'selected' : ''}>أحمر</option>
                                <option value="Secondary" ${currentSettings.ticketButtons?.color === 'Secondary' ? 'selected' : ''}>رمادي</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>عنوان بانل التكت</label>
                        <input type="text" id="ticketPanelTitle" value="${currentSettings.ticketPanel?.title || '🛒 نظام المتاجر'}">
                    </div>
                    <div class="form-group">
                        <label>وصف بانل التكت</label>
                        <textarea id="ticketPanelDesc" rows="3">${currentSettings.ticketPanel?.description || 'اختر نوع الخدمة المطلوبة من الأزرار أدناه'}</textarea>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h2>📤 إرسال بانل التكتات</h2>
                    <div class="form-group">
                        <label>Channel ID (آيدي الروم)</label>
                        <input type="text" id="panelChannelId" placeholder="مثال: 1234567890123456789">
                    </div>
                    <button class="btn btn-primary btn-glow" onclick="sendTicketPanel()" style="width: 100%;">
                        <span>📤</span> إرسال بانل التكتات
                    </button>
                </div>
                
                <div class="settings-section">
                    <h2>📁 إعداد الكاتيجوري</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>كاتيجوري المتاجر</label>
                            <input type="text" id="shopCategoryId" value="${currentSettings.shopCategoryId || ''}" placeholder="آيدي الكاتيجوري">
                        </div>
                        <div class="form-group">
                            <label>كاتيجوري التكتات</label>
                            <input type="text" id="ticketCategoryId" value="${currentSettings.ticketCategoryId || ''}" placeholder="آيدي الكاتيجوري">
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h2>💬 إرسال رسالة مخصصة (Embed)</h2>
                    <div class="form-group">
                        <label>آيدي الروم</label>
                        <input type="text" id="embedChannelId" placeholder="مثال: 1234567890123456789">
                    </div>
                    <div class="form-group">
                        <label>عنوان الرسالة</label>
                        <input type="text" id="embedTitle" placeholder="عنوان الإيمبد">
                    </div>
                    <div class="form-group">
                        <label>محتوى الرسالة</label>
                        <textarea id="embedContent" rows="4" placeholder="اكتب الرسالة هنا..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اللون</label>
                            <input type="color" id="embedColor" value="#5865f2" style="height: 50px;">
                        </div>
                        <div class="form-group">
                            <label>رابط الصورة (اختياري)</label>
                            <input type="text" id="embedImage" placeholder="https://...">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Footer (اختياري)</label>
                        <input type="text" id="embedFooter" placeholder="نص في الأسفل">
                    </div>
                    <button class="btn btn-success" onclick="sendCustomEmbed()" style="width: 100%;">
                        <span>📨</span> إرسال الرسالة
                    </button>
                </div>
                
                <div class="settings-section">
                    <h2>🏪 أنواع المتاجر</h2>
                    <div id="shopTypesList">
                        ${(currentSettings.customShopTypes || [
                    { name: 'عادي', price: 1000, mentions: 5, emoji: '📦' },
                    { name: 'مميز', price: 3000, mentions: 15, emoji: '👑' }
                ]).map((t, i) => `
                            <div class="category-item" style="display: grid; grid-template-columns: 1fr 1fr 1fr 80px auto; gap: 10px; align-items: center;">
                                <input type="text" value="${t.name}" data-type-name="${i}" placeholder="الاسم">
                                <input type="number" value="${t.price}" data-type-price="${i}" placeholder="السعر">
                                <input type="number" value="${t.mentions}" data-type-mentions="${i}" placeholder="المنشنات">
                                <input type="text" value="${t.emoji || '📦'}" data-type-emoji="${i}" placeholder="الإيموجي" maxlength="2">
                                <button class="btn btn-danger" onclick="removeShopType(${i})">حذف</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" onclick="addShopType()" style="margin-top: 15px;">+ إضافة نوع</button>
                </div>
            `;
            setTimeout(checkBotStatus, 500);
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
                                    <th>الشعار</th>
                                    <th>الاسم</th>
                                    <th>النوع</th>
                                    <th>الفئة</th>
                                    <th>المنشنات</th>
                                    <th>التقييم</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${shops.length === 0 ? '<tr><td colspan="6" style="text-align:center;">لا توجد متاجر</td></tr>' : shops.map(s => `
                                    <tr>
                                        <td><span class="badge badge-gold">${s.logo}</span></td>
                                        <td>${s.name}</td>
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
            const words = currentSettings.encryptionWords || { 'بيع': 'بي3', 'شراء': 'شر4ء', 'سعر': 'سع2', 'حساب': 'ح5اب' };
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
                    <p style="color: var(--text-muted);">عند الوصول لهذا العدد سيتم حظر المستخدم تلقائياً</p>
                </div>
            `;
            break;

        case 'ratings':
            const topShops = serverData.topShops || [];
            content.innerHTML = `
                <div class="settings-section">
                    <h2>🏆 أفضل المتاجر</h2>
                    ${topShops.length === 0 ? '<p style="color: var(--text-muted);">لا توجد تقييمات بعد</p>' : topShops.map((s, i) => `
                        <div class="top-shop">
                            <div class="top-shop-rank">#${i + 1}</div>
                            <div class="top-shop-info">
                                <h4>${s.logo} | ${s.name}</h4>
                                <p>
                                    <span class="stars">${'⭐'.repeat(Math.round(s.avg_rating || 0))}</span>
                                    (${(s.avg_rating || 0).toFixed(1)}) - ${s.rating_count || 0} تقييم
                                </p>
                            </div>
                        </div>
                    `).join('')}
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
                                ${bans.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا يوجد محظورين</td></tr>' : bans.map(b => `
                                    <tr>
                                        <td>${b.id}</td>
                                        <td>${b.ban_reason || '-'}</td>
                                        <td>${b.warnings || 0}</td>
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

async function sendTicketPanel() {
    const channelId = document.getElementById('panelChannelId').value;
    if (!channelId) {
        alert('❌ أدخل آيدي الروم');
        return;
    }
    try {
        const res = await fetch(`/api/server/${currentServerId}/send-panel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId })
        });
        if (res.ok) {
            alert('✅ تم إرسال البانل بنجاح');
        } else {
            const data = await res.json();
            alert('❌ ' + (data.error || 'حدث خطأ'));
        }
    } catch (e) {
        alert('❌ حدث خطأ في الاتصال');
    }
}

async function checkBotStatus() {
    const statusEl = document.getElementById('botStatus');
    if (!statusEl) return;
    statusEl.innerHTML = '<span style="color: var(--warning);">⏳ جاري التحقق...</span>';
    try {
        const res = await fetch(`/api/server/${currentServerId}/bot-status`);
        const data = await res.json();
        if (data.online) {
            statusEl.innerHTML = `<span style="color: var(--success);">✅ البوت متصل ويعمل</span> <span style="color: var(--text-muted);">(${data.name || 'سيرفر'})</span>`;
        } else {
            statusEl.innerHTML = `
                <span style="color: var(--danger);">❌ البوت غير موجود في السيرفر</span>
                <br><br>
                <a href="${data.inviteUrl}" target="_blank" class="btn btn-primary">➕ إضافة البوت للسيرفر</a>
            `;
        }
    } catch (e) {
        statusEl.innerHTML = '<span style="color: var(--danger);">❌ تعذر التحقق من حالة البوت</span>';
    }
}

async function sendCustomEmbed() {
    const channelId = document.getElementById('embedChannelId').value;
    const title = document.getElementById('embedTitle').value;
    const content = document.getElementById('embedContent').value;
    const color = document.getElementById('embedColor').value;
    const image = document.getElementById('embedImage').value;
    const footer = document.getElementById('embedFooter').value;

    if (!channelId || !content) {
        alert('❌ أدخل آيدي الروم والمحتوى');
        return;
    }

    try {
        const res = await fetch(`/api/server/${currentServerId}/send-embed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId, title, content, color, image, footer })
        });
        if (res.ok) {
            alert('✅ تم إرسال الرسالة بنجاح');
            document.getElementById('embedTitle').value = '';
            document.getElementById('embedContent').value = '';
        } else {
            const data = await res.json();
            alert('❌ ' + (data.error || 'حدث خطأ'));
        }
    } catch (e) {
        alert('❌ حدث خطأ في الاتصال');
    }
}

function addShopType() {
    if (!currentSettings.customShopTypes) {
        currentSettings.customShopTypes = [];
    }
    currentSettings.customShopTypes.push({ name: 'جديد', price: 1000, mentions: 5, emoji: '📦' });
    renderTab('panel');
}

function removeShopType(index) {
    if (currentSettings.customShopTypes) {
        currentSettings.customShopTypes.splice(index, 1);
        renderTab('panel');
    }
}

function addCategory() {
    if (!currentSettings.categories) currentSettings.categories = [];
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
    if (!currentSettings.encryptionWords) currentSettings.encryptionWords = {};
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

    const logWebhook = document.getElementById('logWebhook');
    if (logWebhook) settings.logWebhook = logWebhook.value;

    const shopCategoryId = document.getElementById('shopCategoryId');
    if (shopCategoryId) settings.shopCategoryId = shopCategoryId.value;

    const ticketCategoryId = document.getElementById('ticketCategoryId');
    if (ticketCategoryId) settings.ticketCategoryId = ticketCategoryId.value;

    const ticketBtnShop = document.getElementById('ticketBtnShop');
    const ticketBtnMentions = document.getElementById('ticketBtnMentions');
    const ticketBtnHelper = document.getElementById('ticketBtnHelper');
    const ticketBtnColor = document.getElementById('ticketBtnColor');
    if (ticketBtnShop) {
        settings.ticketButtons = {
            shop: ticketBtnShop.value,
            mentions: ticketBtnMentions?.value || 'منشنات 📢',
            helper: ticketBtnHelper?.value || 'مساعد 👥',
            color: ticketBtnColor?.value || 'Primary'
        };
    }

    const ticketPanelTitle = document.getElementById('ticketPanelTitle');
    const ticketPanelDesc = document.getElementById('ticketPanelDesc');
    if (ticketPanelTitle) {
        settings.ticketPanel = {
            title: ticketPanelTitle.value,
            description: ticketPanelDesc?.value || ''
        };
    }

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

    document.querySelectorAll('[data-type-name]').forEach((el, i) => {
        if (!settings.customShopTypes) settings.customShopTypes = [];
        const priceEl = document.querySelector(`[data-type-price="${i}"]`);
        const mentionsEl = document.querySelector(`[data-type-mentions="${i}"]`);
        const emojiEl = document.querySelector(`[data-type-emoji="${i}"]`);
        settings.customShopTypes[i] = {
            name: el.value,
            price: parseInt(priceEl?.value || 1000),
            mentions: parseInt(mentionsEl?.value || 5),
            emoji: emojiEl?.value || '📦'
        };
    });

    const encWords = {};
    document.querySelectorAll('[data-enc-orig]').forEach((el, i) => {
        const newEl = document.querySelector(`[data-enc-new="${i}"]`);
        if (el.value && newEl?.value) encWords[el.value] = newEl.value;
    });
    if (Object.keys(encWords).length > 0) settings.encryptionWords = encWords;

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
        alert('❌ حدث خطأ');
    }
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => renderTab(tab.dataset.tab);
});

document.getElementById('saveBtn').onclick = saveSettings;

init();
