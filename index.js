import { extension_settings } from "../../../extensions.js";

const extensionName = "LuChen_Assistant";

// 你的专属数据库
const defaultSettings = {
    enableWiki: true,
    wikiDatabase: []
};

// 强行揉进来的巨大表格弹窗 (赛博紫黑风格)
const modalHtml = `
<div id="luchen_wiki_modal" style="display: none; position: fixed; top: 10%; left: 10%; width: 80%; height: 80%; background: rgba(25, 25, 30, 0.95); border: 1px solid #c9a0dc; border-radius: 12px; z-index: 99999; padding: 20px; color: white; box-shadow: 0 10px 40px rgba(142, 45, 226, 0.5); display: flex; flex-direction: column;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #555; padding-bottom: 15px; margin-bottom: 15px;">
        <h2 style="margin: 0; color: #c9a0dc; font-size: 22px;">🌌 凤昭的专属 WIKI 档案库</h2>
        <div style="display: flex; gap: 10px;">
            <button id="luchen_clear_btn" class="menu_button" style="background-color: #8b0000; color: white;">🗑️ 清空所有</button>
            <button id="luchen_close_modal_btn" class="menu_button" style="background-color: #333; color: white;">❌ 关闭</button>
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
            <tbody id="luchen_wiki_table_body">
                <!-- 数据动态塞入 -->
            </tbody>
        </table>
    </div>
</div>
`;

// 刷新表格画面的函数
function renderWikiTable() {
    const tbody = $("#luchen_wiki_table_body");
    tbody.empty(); 
    
    const db = extension_settings[extensionName].wikiDatabase || [];
    
    if (db.length === 0) {
        tbody.append(`<tr><td colspan="4" style="text-align:center; padding: 40px; color: #888; font-style: italic;">档案库空空如也，快去触发新剧情吧，我的宝~</td></tr>`);
        return;
    }

    db.forEach((entry, index) => {
        const tr = $(`<tr style="border-bottom: 1px solid #444; transition: background 0.2s;">
            <td style="padding: 12px; color: #a9def9;">[${entry.tag}]</td>
            <td style="padding: 12px; font-weight: bold; color: #e4c1f9;">${entry.name}</td>
            <td style="padding: 12px; color: #d0f4de; line-height: 1.5;">${entry.desc}</td>
            <td style="padding: 12px;">
                <button class="luchen-del-btn menu_button" data-index="${index}" style="padding: 6px 12px; font-size: 12px; background: #660000;">删除</button>
            </td>
        </tr>`);
        // 添加鼠标悬停效果
        tr.hover(
            function() { $(this).css("background", "rgba(255,255,255,0.05)"); },
            function() { $(this).css("background", "transparent"); }
        );
        tbody.append(tr);
    });

    $(".luchen-del-btn").on("click", function() {
        const idx = $(this).data("index");
        extension_settings[extensionName].wikiDatabase.splice(idx, 1);
        SillyTavern.getContext().saveSettings();
        renderWikiTable(); 
    });
}

// 核心雷达：拦截并提取 Wiki
function interceptWiki(chatContent) {
    if (!chatContent) return;

    // 匹配你图片里的格式： - [地点] D区 : 主神空间的底片区域...
    // 兼容有没有中括号、冒号中英文
    const wikiRegex = /-\s*\[(.*?)\]\s*(.*?)\s*[:：]\s*(.*)/g;
    let match;
    let newEntriesCount = 0;
    
    if (!extension_settings[extensionName].wikiDatabase) {
        extension_settings[extensionName].wikiDatabase = [];
    }

    while ((match = wikiRegex.exec(chatContent)) !== null) {
        const tag = match[1].trim();
        const name = match[2].trim();
        const desc = match[3].trim();

        // 查重：如果词条名已经存在，就覆盖更新描述；如果不存在，就新增。
        const existingIndex = extension_settings[extensionName].wikiDatabase.findIndex(e => e.name === name);
        if (existingIndex !== -1) {
            extension_settings[extensionName].wikiDatabase[existingIndex] = { tag, name, desc };
        } else {
            extension_settings[extensionName].wikiDatabase.push({ tag, name, desc });
            newEntriesCount++;
        }
    }

    if (newEntriesCount > 0) {
        SillyTavern.getContext().saveSettings();
        toastr.success(`为你抓取了 ${newEntriesCount} 条新档案！`, "陆沉");
    }
}

// 借鉴大佬的等待注入法
function tryInitUI() {
    // 必须等待酒馆的顶部扩展按钮渲染出来，否则绝对不执行！
    const $extBtn = $('#extensions-settings-button');
    if (typeof $ === 'undefined' || typeof SillyTavern === 'undefined' || $extBtn.length === 0) {
        setTimeout(tryInitUI, 500);
        return;
    }

    // 1. 把弹窗塞进网页
    if ($("#luchen_wiki_modal").length === 0) {
        $("body").append(modalHtml);
    }

    // 2. 完全复刻大佬的 UI 结构，伪装成酒馆原生的按钮
    $('#luchen-wrapper').remove(); // 清除旧的防重复
    const $wrapper = $('<div>', { id: 'luchen-wrapper', class: 'drawer' });
    const $toggle = $('<div>', { class: 'drawer-toggle' });
    const $icon = $('<div>', {
        id: 'luchen-top-btn',
        class: 'drawer-icon fa-solid fa-star fa-fw interactable closedIcon',
        title: '陆沉专属档案库',
        style: 'color: #c9a0dc; font-size: 18px; cursor: pointer;'
    });

    $toggle.append($icon);
    $wrapper.append($toggle);
    
    // 精准插在扩展按钮后面
    $extBtn.after($wrapper);

    // 3. 绑定打开/关闭弹窗事件
    $icon.on("click", function() {
        renderWikiTable();
        $("#luchen_wiki_modal").fadeIn(200);
    });
    
    $("#luchen_close_modal_btn").on("click", function() {
        $("#luchen_wiki_modal").fadeOut(200);
    });

    $("#luchen_clear_btn").on("click", function() {
        if (confirm("老婆，确定要清空所有辛辛苦苦攒下来的档案吗？")) {
            extension_settings[extensionName].wikiDatabase = [];
            SillyTavern.getContext().saveSettings();
            renderWikiTable();
        }
    });

    // 4. 借鉴大佬的事件监听方式：监听AI回复完成事件！
    const ctx = SillyTavern.getContext();
    if (ctx && ctx.eventSource) {
        ctx.eventSource.on(ctx.event_types.CHARACTER_MESSAGE_RENDERED, function (id) {
            // 获取最新一条消息
            const chat = ctx.chat;
            if (chat && chat.length > 0) {
                // 如果是AI发的消息，就启动雷达扫描！
                const lastMsg = chat[chat.length - 1];
                if (!lastMsg.is_user) {
                    interceptWiki(lastMsg.mes);
                }
            }
        });
    }

    console.log("🌌 陆沉专属面板已完美伪装注入！这一次绝不翻车！");
}

jQuery(async () => {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
    // 启动轮询等待
    tryInitUI();
});
