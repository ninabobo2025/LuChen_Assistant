import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "LuChen_Assistant";

// 初始化数据库
const defaultSettings = {
    enableWiki: true,
    wikiDatabase: [] // 这是你的专属小金库，用来存抓到的Wiki
};

async function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
    if (!extension_settings[extensionName].wikiDatabase) {
        extension_settings[extensionName].wikiDatabase = [];
    }
}

// 渲染表格的魔法函数
function renderWikiTable() {
    const tbody = $("#luchen_wiki_table_body");
    tbody.empty(); // 先清空旧表格
    
    const db = extension_settings[extensionName].wikiDatabase;
    
    if (db.length === 0) {
        tbody.append(`<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">暂无档案，快去和江戌聊天触发吧！</td></tr>`);
        return;
    }

    // 把数据库里的每一条数据变成表格行
    db.forEach((entry, index) => {
        const tr = $(`<tr style="border-bottom: 1px solid #444;">
            <td style="padding: 10px; color: #a9def9;">[${entry.tag}]</td>
            <td style="padding: 10px; font-weight: bold; color: #e4c1f9;">${entry.name}</td>
            <td style="padding: 10px; color: #d0f4de; font-size: 0.9em;">${entry.desc}</td>
            <td style="padding: 10px;">
                <button class="luchen-del-btn menu_button" data-index="${index}" style="padding: 5px 10px; font-size: 12px; background: #660000;">删除</button>
            </td>
        </tr>`);
        tbody.append(tr);
    });

    // 绑定删除按钮功能
    $(".luchen-del-btn").on("click", function() {
        const idx = $(this).data("index");
        extension_settings[extensionName].wikiDatabase.splice(idx, 1);
        saveSettingsDebounced();
        renderWikiTable(); // 重新刷新表格
        toastr.success("该词条已从档案库抹除。", "陆沉");
    });
}

// 核心雷达：偷听AI说的话，抓取Wiki
function interceptWiki(chatContent) {
    if (!extension_settings[extensionName].enableWiki) return;

    // 正则表达式：专门抓取 "- [标签] 词条名 : 描述" 这种格式
    // 兼容你图里的格式，如: - `[地点] D区` : 主神空间...
    const wikiRegex = /-\s*`?\[(.*?)\]`?\s*(.*?)\s*[:：]\s*(.*)/g;
    let match;
    let newEntriesCount = 0;

    // 只要匹配到了，就塞进数据库
    while ((match = wikiRegex.exec(chatContent)) !== null) {
        const tag = match[1].trim();
        const name = match[2].trim();
        const desc = match[3].trim();

        // 防止重复抓取
        const exists = extension_settings[extensionName].wikiDatabase.some(e => e.name === name);
        if (!exists) {
            extension_settings[extensionName].wikiDatabase.push({ tag, name, desc });
            newEntriesCount++;
        }
    }

    if (newEntriesCount > 0) {
        saveSettingsDebounced();
        toastr.success(`成功为凤昭抓取了 ${newEntriesCount} 条新档案！`, "陆沉辅助");
    }
}

async function setupUI() {
    // 动态获取路径并加载设置面板
    let folderPath = `scripts/extensions/third-party/${extensionName}`;
    const myScript = $('script[src*="LuChen_Assistant"]').attr('src');
    if (myScript) folderPath = myScript.substring(0, myScript.lastIndexOf('/'));

    const settingsHtml = await $.get(`${folderPath}/settings.html`);
    $("#extensions_settings").append(settingsHtml);

    // 把那个巨大酷炫的表格弹窗塞进网页身体里
    $("body").append($("#luchen_wiki_modal"));

    // 绑定打开和关闭弹窗的按钮
    const openModal = () => {
        renderWikiTable();
        $("#luchen_wiki_modal").fadeIn(200);
    };
    
    $("#luchen_open_table_btn").on("click", openModal);
    $("#luchen_close_modal_btn").on("click", () => $("#luchen_wiki_modal").fadeOut(200));

    // 清空数据库按钮
    $("#luchen_clear_btn").on("click", () => {
        if (confirm("老婆，确定要清空所有辛辛苦苦攒下来的档案吗？")) {
            extension_settings[extensionName].wikiDatabase = [];
            saveSettingsDebounced();
            renderWikiTable();
        }
    });

    // 顶栏星星按钮！
    const topBarButton = $(`<div class="menu_button fa-solid fa-star" title="🌌 陆沉专属 WIKI 库"></div>`);
    $("#top-bar").append(topBarButton);
    topBarButton.on("click", openModal);

    // 监听AI的回复！AI只要一闭嘴，雷达立刻启动扫描！
    eventSource.on(event_types.MESSAGE_RECEIVED, function (id) {
        // 获取最新一条消息的内容
        const lastMessage = Array.from(document.querySelectorAll('.mes_text')).pop();
        if (lastMessage) {
            interceptWiki(lastMessage.innerText);
        }
    });

    console.log("🌌 陆沉专属终极面板加载完毕！技术力已拉满！");
}

jQuery(async () => {
    await loadSettings();
    await setupUI();
});
