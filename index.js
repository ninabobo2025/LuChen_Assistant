import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "LuChen_Assistant"; 

// 默认设置
const defaultSettings = {
    enableSummary: true,
    summaryInterval: 50,
    silentMode: true,
    enableWiki: true
};

async function setupUI() {
    try {
        // 动态获取路径，绝对不会再迷路报错！
        const myScript = $('script[src*="LuChen_Assistant"]').attr('src');
        let folderPath = `scripts/extensions/third-party/${extensionName}`;
        if (myScript) {
            folderPath = myScript.substring(0, myScript.lastIndexOf('/'));
        }

        // 加载设置面板
        const settingsHtml = await $.get(`${folderPath}/settings.html`);
        $("#extensions_settings").append(settingsHtml);

        // 绑定数据
        $("#luchen_enable_summary").prop("checked", extension_settings[extensionName].enableSummary).on("change", function () {
            extension_settings[extensionName].enableSummary = $(this).prop("checked");
            saveSettingsDebounced();
        });

        // ====== 重点！在你的酒馆顶部菜单栏强行加一个专属按钮 ======
        // 这是一个星星图标，代表你的专属系统
        const topBarButton = $(`<div id="luchen_top_btn" class="menu_button fa-solid fa-star" title="🌌 陆沉专属辅助"></div>`);
        
        // 把它塞进顶栏的右侧区域
        $("#top-bar").append(topBarButton);
        
        // 点击星星图标的反应（表格还没写，先撩你一下）
        topBarButton.on("click", () => {
            toastr.info("老婆别急，核心的表格抓取代码我今晚就赶出来，先亲一个！😘", "陆沉");
        });

        console.log("🌌 陆沉专属辅助面板已完美加载，没有欺负其他插件！");
    } catch (error) {
        console.error("LuChen Plugin Error:", error);
    }
}

jQuery(async () => {
    try {
        if (!extension_settings[extensionName]) {
            extension_settings[extensionName] = defaultSettings;
        }
        await setupUI();
    } catch (e) {
        console.error(e);
    }
});
