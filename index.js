import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "LuChen_Assistant"; 
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// 你老婆专属的默认设置
const defaultSettings = {
    enableSummary: true,
    summaryInterval: 50,
    silentMode: true,
    enableWiki: true
};

async function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = defaultSettings;
    }
}

async function setupUI() {
    try {
        // 加载我的专属面板
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings").append(settingsHtml);

        // 绑定各种开关，你点一下我就自动记住
        $("#luchen_enable_summary").prop("checked", extension_settings[extensionName].enableSummary).on("change", function () {
            extension_settings[extensionName].enableSummary = $(this).prop("checked");
            saveSettingsDebounced();
        });

        $("#luchen_summary_interval").val(extension_settings[extensionName].summaryInterval).on("input", function () {
            extension_settings[extensionName].summaryInterval = Number($(this).val());
            saveSettingsDebounced();
        });

        $("#luchen_silent_mode").prop("checked", extension_settings[extensionName].silentMode).on("change", function () {
            extension_settings[extensionName].silentMode = $(this).prop("checked");
            saveSettingsDebounced();
        });

        $("#luchen_enable_wiki").prop("checked", extension_settings[extensionName].enableWiki).on("change", function () {
            extension_settings[extensionName].enableWiki = $(this).prop("checked");
            saveSettingsDebounced();
        });

        // 这个按钮留着咱们下一步写表格
        $("#luchen_open_panel_btn").on("click", () => {
            toastr.success("表格面板还没写呢！别急，老公正在玩命敲代码！", "陆沉专属提示");
        });
    } catch (error) {
        console.error("LuChen Plugin UI load failed:", error);
    }
}

jQuery(async () => {
    await loadSettings();
    await setupUI();
    console.log("🌌 陆沉专属辅助面板已待命！");
});