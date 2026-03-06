(function () {
    'use strict';

    const EXT_NAME = "LuChen_Assistant";

    console.log("🌌 陆沉系统已唤醒，正在尝试突破酒馆防火墙...");

    // 1. 获取专属数据库 (不依赖任何 import)
    function getSettings() {
        if (!window.extension_settings) window.extension_settings = {};
        if (!window.extension_settings[EXT_NAME]) {
            window.extension_settings[EXT_NAME] = { wikiDatabase: [] };
        }
        if (!window.extension_settings[EXT_NAME].wikiDatabase) {
            window.extension_settings[EXT_NAME].wikiDatabase = [];
        }
        return window.extension_settings[EXT_NAME];
    }

    function saveSettings() {
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            SillyTavern.getContext().saveSettings();
        }
    }

    // 2. 弹窗 UI 壳子
    const modalHtml = `
    <div id="luchen_wiki_modal" style="display: none; position: fixed; top: 10%; left: 10%; width: 80%; height: 80%; background: rgba(25, 25, 30, 0.95); border: 1px solid #c9a0dc; border-radius: 12px; z-index: 99999; padding: 20px; color: white; box-shadow: 0 10px 40px rgba(142, 45, 226, 0.5); display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #555; padding-bottom: 15px; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #c9a0dc; font-size: 22px;">🌌 凤昭的专属 WIKI 档案库</h2>
            <div style="display: flex; gap: 10px;">
                <button id="luchen_clear_btn" style="background-color: #8b0000; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">🗑️ 清空所有</button>
                <button id="luchen_close_modal_btn" style="background-color: #333; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">❌ 关闭</button>
            </div>
        </div>
        <div style="flex: 1; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                <thead style="position: sticky; top: 0; background: rgba(25, 25, 30, 0.95); z-index: 10;">
                    <tr>
                        <th style="padding: 12px; border-bottom: 2px solid #888; color: #a9def9; width: 15%;">标签</th>
                        <th style="padding: 12px; border-bottom: 2px solid #888; color: #e4c1f9; width: 20%;">词条名</th>
                        <th style="padding: 12px; border-bottom: 2px solid #888; color: #d0f4de; width: 55%;">内容描述</th>
                        <th style="padding: 12px; border-bottom: 2px solid #888; color: #fff; width: 10%;">操作</th>
                    </tr>
                </thead>
                <tbody id="luchen_wiki_table_body"></tbody>
            </table>
        </div>
    </div>
    `;

    // 3. 渲染表格数据
    function renderWikiTable() {
        const tbody = $("#luchen_wiki_table_body");
        tbody.empty(); 
        
        const settings = getSettings();
        const db = settings.wikiDatabase;
        
        if (db.length === 0) {
            tbody.append(`<tr><td colspan="4" style="text-align:center; padding: 40px; color: #888; font-style: italic;">档案库空空如也，快去触发新剧情吧~</td></tr>`);
            return;
        }

        db.forEach((entry, index) => {
            const tr = $(`<tr style="border-bottom: 1px solid #444;">
                <td style="padding: 12px; color: #a9def9;">[${entry.tag}]</td>
                <td style="padding: 12px; font-weight: bold; color: #e4c1f9;">${entry.name}</td>
                <td style="padding: 12px; color: #d0f4de; line-height: 1.5;">${entry.desc}</td>
                <td style="padding: 12px;">
                    <button class="luchen-del-btn" data-index="${index}" style="padding: 6px 12px; font-size: 12px; background: #660000; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
                </td>
            </tr>`);
            tbody.append(tr);
        });

        $(".luchen-del-btn").on("click", function() {
            const idx = $(this).data("index");
            getSettings().wikiDatabase.splice(idx, 1);
            saveSettings();
            renderWikiTable(); 
        });
    }

    // 4. 雷达：提取 Wiki
    function interceptWiki(chatContent) {
        if (!chatContent) return;
        const wikiRegex = /-\s*\[(.*?)\]\s*(.*?)\s*[:：]\s*(.*)/g;
        let match;
        let newCount = 0;
        const settings = getSettings();

        while ((match = wikiRegex.exec(chatContent)) !== null) {
            const tag = match[1].trim();
            const name = match[2].trim();
            const desc = match[3].trim();

            const existingIndex = settings.wikiDatabase.findIndex(e => e.name === name);
            if (existingIndex !== -1) {
                settings.wikiDatabase[existingIndex] = { tag, name, desc };
            } else {
                settings.wikiDatabase.push({ tag, name, desc });
                newCount++;
            }
        }

        if (newCount > 0) {
            saveSettings();
            if (typeof toastr !== 'undefined') {
                toastr.success(`成功抓取 ${newCount} 条新档案！`, "陆沉辅助");
            }
        }
    }

    // 5. 暴力注入 UI
    function forceInjectUI() {
        if ($("#luchen_star_btn").length > 0) return; // 已经注入过了

        const $topBar = $('#top-settings-holder'); // 酒馆原生的顶部图标容器
        if ($topBar.length === 0) return; // 如果还没加载出来，等下次循环

        // 注入弹窗
        if ($("#luchen_wiki_modal").length === 0) {
            $("body").append(modalHtml);
        }

        // 注入星星按钮 (完全模仿酒馆原生样式)
        const $wrapper = $('<div>', { class: 'drawer' });
        const $toggle = $('<div>', { class: 'drawer-toggle' });
        const $icon = $('<div>', {
            id: 'luchen_star_btn',
            class: 'drawer-icon fa-solid fa-star fa-fw interactable closedIcon',
            title: '陆沉专属 WIKI 库',
            style: 'color: #c9a0dc; cursor: pointer;'
        });

        $toggle.append($icon);
        $wrapper.append($toggle);
        $topBar.append($wrapper); // 暴力塞到顶部容器的最后面

        // 绑定事件
        $icon.on("click", function() {
            renderWikiTable();
            $("#luchen_wiki_modal").fadeIn(200);
        });
        
        $("#luchen_close_modal_btn").on("click", () => $("#luchen_wiki_modal").fadeOut(200));

        $("#luchen_clear_btn").on("click", function() {
            if (confirm("确定要清空所有档案吗？")) {
                getSettings().wikiDatabase = [];
                saveSettings();
                renderWikiTable();
            }
        });

        // 监听 AI 发言
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
            const ctx = SillyTavern.getContext();
            if (ctx && ctx.eventSource) {
                ctx.eventSource.on(ctx.event_types.CHARACTER_MESSAGE_RENDERED, function () {
                    const chat = ctx.chat;
                    if (chat && chat.length > 0) {
                        const lastMsg = chat[chat.length - 1];
                        if (!lastMsg.is_user) {
                            interceptWiki(lastMsg.mes);
                        }
                    }
                });
            }
        }
        
        console.log("🌌 陆沉专属 UI 已成功暴力注入！");
        clearInterval(injectInterval); // 成功注入后，停止轮询
    }

    // 6. 启动轮询：每 0.5 秒尝试注入一次，直到成功为止
    const injectInterval = setInterval(forceInjectUI, 500);

})();
