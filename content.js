// content.js
const debugLogPrefix = 'debug##prefix##: ';
const debugMode = true;

function debugLog(message, highlight = false) {
    if (debugMode) {
        if (highlight) {
            console.log('\x1b[31m' + debugLogPrefix + message + '\x1b[0m');
        } else {
            console.log(debugLogPrefix + message);
        }
    }
}

class ContentFilter {
    constructor(config) {
        this.config = config;
        this.currentSiteConfig = this.getConfigForCurrentSite();
    }

    getConfigForCurrentSite() {
        const currentUrl = window.location.href;
        for (let siteUrl in this.config.sit_config) {
            if (currentUrl.startsWith(siteUrl)) {
                return this.config.sit_config[siteUrl];
            }
        }
        return null;
    }

    removeByCssSelector() {
        if (!this.currentSiteConfig?.css_selector) return;
        
        const selectorString = this.currentSiteConfig.css_selector.join(',');
        const elements = document.querySelectorAll(selectorString);
        elements.forEach(element => element.remove());
    }

evaluateRule(element, rule) {
        const value = element.getAttribute(rule.attribute);
        
        switch (rule.type) {
            case 'regexp':
                return rule.value_set.some(keyword => 
                    value?.toLowerCase().includes(keyword.toLowerCase())
                );
            case 'function':
                // 预定义支持的函数
                const supportedFunctions = {
                    "bilibili_mid_match": (item, value) => {
                        if (!item) return false;
                        const match = item.match(/\/\/space\.bilibili\.com\/(\d+)/);
                        return match && match[1] === value;
                    },
                };
                
                // 使用预定义函数而不是动态执行代码
                const funcName = rule.function;
                const filterFunc = supportedFunctions[funcName];
                
                if (!filterFunc) {
                    console.error(`Unsupported function: ${funcName}`);
                    return false;
                }
                
                return rule.value_set.some(keyword => 
                    filterFunc(value?.toLowerCase(), keyword.toLowerCase())
                );
            default:
                return false;
        }
    }

    checkElementRules(element, rules) {
        for (const rule of rules) {
            const isMatch = this.evaluateRule(element, rule);
            if (isMatch) {
                return {
                    matched: true,
                    value: rule.attribute+": "+element.getAttribute(rule.attribute)
                };
            }
        }
        return {
            matched: false,
            value: null
        };
    }

    filterContent() {
        if (!this.currentSiteConfig?.filter) return;

        for (let mainSelector in this.currentSiteConfig.filter) {
            const cards = document.querySelectorAll(mainSelector);
            debugLog('找到的卡片数量: ' + cards.length);

            cards.forEach(card => {
                for (let subSelector in this.currentSiteConfig.filter[mainSelector]) {
                    const config = this.currentSiteConfig.filter[mainSelector][subSelector];
                    const element = card.querySelector(subSelector);
                    
                    if (element && config.rules) {
                        const checkResult = this.checkElementRules(element, config.rules);
                        if (checkResult.matched) {
                            debugLog(`移除元素, 匹配值: ${mainSelector}, ${subSelector}, ${checkResult.value}`, true);
                            card.remove();
                            break;
                        }
                    }
                }
            });
        }
    }

    start() {
        if (!this.currentSiteConfig) return;

        // 初始执行
        this.removeByCssSelector();
        this.filterContent();

        // 创建观察器来处理动态加载的内容
        const observer = new MutationObserver(() => {
            this.removeByCssSelector();
            this.filterContent();
        });

        // 开始观察页面变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// 将 ContentFilter 的初始化移到异步函数中
async function initializeContentFilter() {
    try {
        // 获取配置文件的 URL
        const configUrl = chrome.runtime.getURL('config.json');
        // 加载配置文件
        const response = await fetch(configUrl);
        const config = await response.json();
        
        // 初始化过滤器
        const filter = new ContentFilter(config);
        filter.start();
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// 调用初始化函数
initializeContentFilter();
