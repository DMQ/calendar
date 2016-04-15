/*
 * 父级组件
 * 依赖Zepto
 */
;
(function(global, factory) {
    var Widget = factory(global);

    if (typeof exports === 'object') {
        module.exports = Widget;
    } else if (typeof global.define === 'function' && (define.amd || define.cmd)) {
        define(['zepto'], function($) {
            return Widget;
        });
    } else {
        global.Widget = global.Widget || Widget;
    }
})(this, function(global) {
    //主函数
    function Widget() {
        this._$elem = null;
        this.cfg = {}; //配置项
        this._handlers = {};
    }

    Widget.prototype = {
        constructor: Widget,

        //绑定自定义事件
        on: function(type, handler) {
            if (!this._handlers.hasOwnProperty(type)) {
                this._handlers[type] = [];
            }
            this._handlers[type].push(handler);
            return this;
        },

        //触发自定义事件
        fire: function(type, data) {
            //判断是否为数组
            if (Object.prototype.toString.call(this._handlers[type]) == '[object Array]') {
                var handlers = this._handlers[type];

                for (var i = 0, len = handlers.length; i < len; i++) {
                    handlers[i].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            }
            return this;
        },

        //统一绑定外部事件 {type: funcName}
        eachBind: function(typeObj) {
            var val;

            if (!typeObj) {
                return;
            }

            for (key in typeObj) {
                if (typeObj.hasOwnProperty(key)) {
                    val = typeObj[key];

                    //如果是字符串类型且配置项中有值
                    if (typeof val === 'string' && typeof this.get(val) === 'function') {
                        this.on(key, this.get(val));
                        //如果是函数则直接绑定
                    } else if (typeof val === 'function') {
                        this.on(key, val);
                    }
                }
            }
        },

        //设置cfg的值
        set: function(key, value) {
            this.cfg[key] = value;
            return this;
        },

        //取cfg的值
        get: function(key) {
            return this.cfg[key];
        },

        //判断是否绑定了某个事件
        isBind: function(type) {
            var typeStr = Object.prototype.toString.call(this._handlers[type]);

            if (typeStr == '[object Array]' && this._handlers[type].length != 0) {
                return true;
            }

            return false;
        },

        init: function() {}, //初始化（接口）

        initCfg: function() {}, //初始化配置项（接口）

        renderUI: function() {}, //生成dom节点（接口）

        bindUI: function() {}, //绑定事件（接口）

        syncUI: function() {}, //同步设置初始样式（接口）

        ready: function() {}, //组件实例化完成后调用（接口）

        //总体渲染入口
        render: function(cfg) {
            this.init();
            this.initCfg(cfg);
            this.renderUI();
            this.bindUI();
            this.syncUI();

            var $container = $(this.get('target') || document.body);

            if (this.get('isPrepend')) {
                $container.prepend(this._$elem);
            } else {
                $container.append(this._$elem);
            }

            this.ready();

            return this;
        },

        //销毁
        destroy: function() {
            this._$elem.off().remove();

            this.fire('destroy');
        },

        find: function(selector) {
            return this._$elem.find(selector);
        },

        //获取弹窗的节点对象(jq)
        getElem: function() {
            return this._$elem;
        }

    };

    return Widget;
});