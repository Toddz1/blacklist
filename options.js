document.addEventListener('DOMContentLoaded', async () => {
    // 创建 JSONEditor 实例
    const container = document.getElementById('jsoneditor');
    const options = {
        mode: 'tree', // 使用树形模式
        modes: ['tree', 'view', 'form', 'code', 'text'], // 允许切换的模式
        onError: function(err) {
            alert(err.toString());
        },
        onModeChange: function(newMode, oldMode) {
            console.log('Mode switched from', oldMode, 'to', newMode);
        }
    };
    const editor = new JSONEditor(container, options);

    const saveButton = document.getElementById('save');
    const resetButton = document.getElementById('reset');

    // 加载当前配置
    try {
        const result = await chrome.storage.sync.get('config');
        if (result.config) {
            editor.set(result.config);
        } else {
            const response = await fetch(chrome.runtime.getURL('config.json'));
            const defaultConfig = await response.json();
            editor.set(defaultConfig);
        }
    } catch (error) {
        console.error('加载配置失败:', error);
    }

    // 保存配置
    saveButton.addEventListener('click', async () => {
        try {
            const newConfig = editor.get();
            await chrome.storage.sync.set({ config: newConfig });
            alert('配置已保存');
        } catch (error) {
            alert('配置格式错误: ' + error);
        }
    });

    // 重置配置
    resetButton.addEventListener('click', async () => {
        try {
            const response = await fetch(chrome.runtime.getURL('config.json'));
            const defaultConfig = await response.json();
            editor.set(defaultConfig);
            await chrome.storage.sync.set({ config: defaultConfig });
        } catch (error) {
            alert('重置失败: ' + error);
        }
    });
});
