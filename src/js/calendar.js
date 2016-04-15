/*
 * 日历组件
 * 依赖Zepto、Widget.js
 */
;
(function(global, factory) {
    if (typeof exports === 'object') {
        var $ = require('zepto');
        var widget = require('widget');
        module.exports = factory(global, widget, $);
    } else if (typeof global.define === 'function' && (define.amd || define.cmd)) {
        define(['zepto', 'widget'], function($, widget) {
            return factory(global, widget, $);
        });
    } else {
        global.Calendar = global.Calendar || factory(global, global.Widget, Zepto);
    }
})(this, function(global, Widget, $) {
    //日历主函数
    function Calendar(settings) {
        Widget.call(this);

        return this.render(settings);
    }

    Calendar.prototype = $.extend({}, Widget.prototype, {
        constructor: Calendar,

        //初始化配置
        initCfg: function(settings) {
            var today = this.getToday();

            //默认配置
            this.cfg = {
                'target': 'body', //日历根节点选择器
                'className': 'calendar',
                'year': today.year,
                'month': today.month,
                'date': today.date,
                'today': today,
                'headText': '', //头部自定义字样
                'todayText': '', //今天的自定义字样
                'showToday': false, //是否显示今天按钮
                'tagDates': null, //需要标记的日期，[]或{'className': []}
                'dateItems': {}, //存放每个日期节点（jQuery)
                'onPreMonth': null,
                'onNextMonth': null,
                'onChangeMonthBefore': null,
                'onChangeMonth': null,
                'onToday': null,
                'onSelect': null,
                'onInit': null,
                'onReady': null,
                'onReDrawCalendar': null
            };

            $.extend(this.cfg, settings);
        },

        init: function(settings) {
            this.fire('onInit', this.getCurrDateObj());
        },

        //生成日历
        renderUI: function() {
            var year = this.get('year'),
                month = this.get('month'),
                date = this.get('date'),
                $calWrap = this.tplCalendarWrap(),
                $calDates = this.tplCalendar(year, month, date);

            this._$elem = $calWrap.append($calDates);
        },

        bindHandler: function() {
            this.eachBind({
                'preMonth': 'onPreMonth', //绑定上一个月监听
                'nextMonth': 'onNextMonth', //绑定下一个月监听
                'today': 'onToday', //绑定点击今天监听
                'select': 'onSelect', //选中当前月日期
                'changeMonBefore': 'onChangeMonthBefore', //改变月之前触发
                'changeMonth': 'onChangeMonth', //改变月触发
                'init': 'onInit', //首次生成日历前触发
                'ready': 'onReady', //首次生成日历后触发
                'reDrawCalendar': 'onReDrawCalendar' //每次重新生成日历触发
            });
        },

        _getEventType: function() {
            return ['on', 'tap'];
        },

        //绑定事件
        bindUI: function() {
            var me = this;

            //绑定外部事件
            this.bindHandler();

            //点击头部上一月
            this._$elem.on('tap', '.pre-mon', function() {
                    me._preMon();
                })
                //点击头部下一月
                .on('tap', '.next-mon', function() {
                    me._nextMon();
                })
                //点击上一月的日期
                .on('tap', '.pre', function() {
                    me._preMon($(this).data('date'));
                })
                //点击下一月的日期
                .on('tap', '.next', function() {
                    me._nextMon($(this).data('date'));
                })
                //点击今天
                .on('tap', '.today', function() {
                    me._onToday();
                })
                //点击日历表当前月日期
                .on('tap', '.date', function(e) {
                    me._onSelect(e, $(this));
                });
        },

        syncUI: function() {
            this._$elem.addClass(this.cfg.className);
        },

        ready: function() {
            this.fire('ready', this.getCurrDateObj());
        },

        //点击选中当前月日期
        _onSelect: function(e, $currElem) {
            /*if ($currElem.hasClass('curr-date')) {
                return ;
            }*/

            var date = $currElem.data('date');

            this.select(date, $currElem, e);
        },

        //点击今天
        _onToday: function() {
            //当前日期是今天
            if (this.isToday(this.get('year'), this.get('month'), this.get('date'))) {
                return;
            }

            var today = this.getToday();

            if (today.year == this.get('year') && today.month == this.get('month')) {
                this.select(today.date);
            } else {
                //重新生成日历
                this.reDrawCalendar(today.year, today.month, today.date);
                this.fire('changeMonth', this.getCurrDateObj());
            }

            //触发"今天"监听函数
            this.fire('today', this.getCurrDateObj());
        },

        //上一月
        _preMon: function(date) {
            this._goPreOrNextMon('pre', date);
        },

        //下一月
        _nextMon: function(date) {
            this._goPreOrNextMon('next', date);
        },

        //上一月或下一月处理
        _goPreOrNextMon: function(type, date) {
            var year = this.get('year'),
                month = +this.get('month');

            this.fire('changeMonBefore', this.getCurrDateObj(), type);

            var changeDate = this.getChangeMonthDate(year, month, type, date);

            this._changeMonth(changeDate.year, changeDate.month, changeDate.date, type);

            this.fire('preMonth', this.getCurrDateObj());
        },

        //改变月份执行
        _changeMonth: function(year, month, date, type) {
            //调整年月日
            //this._adjustTime(year, month, date);

            //重新生成日历
            this.reDrawCalendar(year, month, date);

            this.fire('changeMonth', this.getCurrDateObj(), type);
        },

        //重新调整年月
        _adjustTime: function(year, month, date) {
            this.set('year', year).set('month', month).set('date', date);
        },

        //改变月（上一月或下一月）后的日期
        getChangeMonthDate: function(year, month, type, date) {
            var dateObj;

            if (type === 'next') {
                dateObj = new Date(year, month); //下一个月的时间
            } else if (type === 'pre') {
                dateObj = new Date(year, month - 2); //上一个月的时间
            }

            if (dateObj) {
                year = dateObj.getFullYear();
                month = dateObj.getMonth() + 1;
            }

            var currDate = date || this.getSelectedDate(),
                lastDate = this.getLastDate(year, month);

            //如果要设置的天大于上一月（下一月）的最后一天
            //则以上一月（下一月）最后一天为准
            if (currDate > lastDate) {
                currDate = lastDate;
            }

            return {
                year: year,
                month: month,
                date: currDate
            };
        },

        //更新title年月
        updateTitleTime: function(year, month) {
            var $calTitle = this.find('.title-wrap');

            $calTitle.find('.year').html(year);
            $calTitle.find('.month').html(month);
        },

        //日历大体框架
        tplCalendarWrap: function() {
            var html = '';

            html = '<div class="calendar">' + '<div class="cal-header">';

            if (this.cfg.showToday) {
                html += '<span class="today">今天</span>';
            }

            html += '<span class="pre-mon"></span>' + '<span class="title-wrap">' + '<span class="year">' + this.get('year') + '</span> 年 ' + '<span class="month">' + this.get('month') + '</span> 月 ' + '<span class="head-text">' + this.get('headText') + '</span>' + '</span>' + '<span class="next-mon"></span>' + '</div>' + '<div class="days">' + '<span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>' + '</div>' + '</div>';

            return $(html);
        },

        //日历主体内容
        tplCalendar: function(year, month, currDate) {
            var datesData = this.getDatesData(year, month), //日历表全部数据
                lastDate = datesData.lastDate, //最后一天
                datesArr = datesData.datesArr, //日历表数组所有天
                preMonthDates = datesData.preMonthDates, //要显示的上个月天数
                i, len;

            var $html = $('<div class="date-wrap"></div>'),
                $oneweek = $('<div class="oneweek"></div>'),
                date, $date;

            //如果需要标记日期
            if (this.get('tagDates')) {
                var tagObj = this.parseTagDates(this.get('tagDates'));
            }

            //生成上个月的几天日历
            for (i = 0, len = preMonthDates; i < len; i++) {
                date = datesArr[i];

                $date = $('<span class="pre" data-date="' + date + '" data-index="' + i + '">' + '<span>' + date + '</span>' + '</span>');

                $oneweek.append($date);
            }

            //生成当前月的日历
            for (i = preMonthDates, len = lastDate + preMonthDates; i < len; i++) {
                date = datesArr[i];

                //拼装节点
                $date = this._tplCurrMonthItem(i, date, year, month, currDate, tagObj);

                $oneweek.append($date);

                //周六另起一周
                if (i % 7 === 6) {
                    $html.append($oneweek);
                    $oneweek = $('<div class="oneweek"></div>');
                }
            }

            //生成下个月的几天日历
            for (i = lastDate + preMonthDates, len = datesArr.length; i < len; i++) {
                date = datesArr[i];

                $date = $('<span class="next" data-date="' + date + '" data-index="' + i + '">' + '<span>' + date + '</span>' + '</span>');

                $oneweek.append($date);

                //最后一天
                if (i === len - 1) {
                    $html.append($oneweek);
                }
            }

            return $html;
        },

        //拼装当前月的节点html
        _tplCurrMonthItem: function(i, date, year, month, currDate, tagObj) {
            var $date = $('<span class="date" data-date="' + date + '" data-index="' + i + '">' + '<span>' + date + '</span>' + '</span>');

            //周末
            if (i % 7 === 0 || i % 7 === 6) {
                $date.addClass('weekends');
            }

            //当前天
            if (date == currDate) {
                $date.addClass('curr-date');
            }

            //判断是否是今天
            if (this.get('todayText') && this.isToday(year, month, date)) {
                $date.addClass('today-date small-font').children('span').html(this.get('todayText'));
            }

            //标记当月需要标记的日期
            if (tagObj && tagObj[date]) {
                $date.addClass(tagObj[date]);
            }

            //存储节点
            this.get('dateItems')[date] = $date;

            return $date;
        },

        //取得当月日历表详细数据({arr: [], preMonthDates: number, nextMonthDates: number})
        getDatesData: function(year, month) {
            var datesArr = [],
                j = 1,
                k = 1,
                lastDate = this.getLastDate(year, month), //获取当月的最后一天是几号（也就是当月天数）
                preMonthDates = new Date(year, month - 1, 1).getDay(), //要显示上一个月的天数
                all = lastDate + preMonthDates, //日历表显示的总天数
                nextMonthDates = (42 - all) % 7; //要显示下一个月的天数

            //日历上个月天数数组
            var preMonthDatesArr = this.getPreMonthDates(year, month, preMonthDates);

            //根据当月第一天星期几和最后一天来拼装当月天数数组
            for (var i = 0; i < lastDate + nextMonthDates; i++) {
                if (i < lastDate) {
                    datesArr[i] = j++;
                } else {
                    datesArr[i] = k++;
                }
            }

            var datesData = {
                datesArr: preMonthDatesArr.concat(datesArr), //整个日历表天数
                lastDate: lastDate, //最后一天
                preMonthDates: preMonthDates, //日历表要显示的上个月天数
                nextMonthDates: nextMonthDates //日历表要显示的下个月天数
            };

            this.set('datesData', datesData);

            return datesData;
        },

        //获取日历表中要显示的上一个月数据
        getPreMonthDates: function(year, month, preMonthDates) {
            var datesArr = [],
                lastDate;

            if (!preMonthDates || preMonthDates === 0) {
                return datesArr;
            }

            //上一个月的最后一天
            lastDate = new Date(year, month - 1, 0).getDate();
            //生成日历表中显示的上个月的日历天数
            while (preMonthDates) {
                datesArr.unshift(lastDate--);
                preMonthDates--;
            }

            return datesArr;
        },

        //转换标记日期，return {1: 'tag', 12: 'className'}
        parseTagDates: function(tagDates) {
            var tagObj = {},
                i, len;

            //数组
            if (this.isArray(tagDates)) {
                for (i = 0, len = tagDates.length; i < len; i++) {
                    tagObj[tagDates[i]] = 'tag';
                }
                //对象
            } else if (tagDates instanceof Object) {
                for (var a in tagDates) {
                    if (!this.isArray(tagDates[a])) {
                        continue;
                    }

                    for (i = 0, len = tagDates[a].length; i < len; i++) {
                        tagObj[tagDates[a][i]] = a;
                    }
                }
            }

            return tagObj;
        },


        /*外部操作方法*/

        destroy: function() {
            this._$elem.off();
            this._$elem.remove();

            this.fire('destroy');
        },

        //重绘日历
        reDrawCalendar: function(year, month, date) {
            date = date || this.getSelectedDate();

            var checkDate = this.checkeDate(year, month, date);

            if (!checkDate) return;

            //重置缓存的节点
            this.set('dateItems', {});

            var $calHtml = this.tplCalendar(checkDate.year, checkDate.month, date),
                $dateWrap = this.find('.date-wrap');

            this._adjustTime(checkDate.year, checkDate.month, date);

            //更新头部日期
            this.updateTitleTime(checkDate.year, checkDate.month);

            $dateWrap.html($calHtml.children());

            this.fire('reDrawCalendar', this.getCurrDateObj());
        },

        //校验时间合法性
        checkeDate: function(year, month, date) {
            var d = new Date(year, +month - 1, date),
                year = d.getFullYear();

            if (isNaN(year)) return false;

            return {
                year: year,
                month: d.getMonth() + 1,
                date: d.getDate()
            };

        },

        getDateItem: function(date) {
            return this.get('dateItems')[date];
        },

        //获取当前选中天
        getSelectedDate: function() {
            return this.getCurrDateObj().date;
        },

        //获取某月的最后一天
        getLastDate: function(year, month) {
            return new Date(year, month, 0).getDate();
        },

        //获取今天日期
        getToday: function() {
            var today = this.get('today');

            if (today) {
                return today;
            }

            var date = new Date();

            today = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                date: date.getDate()
            };

            return today;
        },

        //判断当前日期是否是今天
        isToday: function(year, month, date) {
            var today = this.getToday();

            return year == today.year && month == today.month && date == today.date;
        },

        //获取当前日期年月日
        getCurrDateObj: function() {
            return {
                year: this.get('year'),
                month: this.get('month'),
                date: this.get('date')
            };
        },

        //判断是否数组
        isArray: function(arr) {
            return Object.prototype.toString.call(arr) == '[object Array]';
        },

        //切换上一月
        preMonth: function(date) {
            this._preMon(date);
        },
        //切换下一月
        nextMonth: function(date) {
            this._nextMon(date);
        },
        //选中今天
        today: function() {
            this._onToday();
        },
        //选中某一天
        select: function(date, $elem, e) {
            if (!date || typeof date !== 'number') return;

            $elem = $elem || this.getDateItem(date);

            if (!$elem.hasClass('curr-date')) {
                var lastDate = this.getLastDate(this.get('year'), this.get('month'));

                if (date > lastDate) {
                    date = lastDate;
                } else if (date < -lastDate) {
                    date = 1;
                } else if (-lastDate < date && date < 0) {
                    date += lastDate;
                }

                this.find('.curr-date').removeClass('curr-date');

                $elem.addClass('curr-date');

                this.set('date', date);
            }

            this.fire('select', this.getCurrDateObj(), e);
        },
        //给相应日期加标记
        takeTags: function(tagsDates) {
            var parseTagDates = this.parseTagDates(tagsDates),
                $dates = this.find('.date');

            for (var a in parseTagDates) {
                $dates.eq(a - 1).addClass(parseTagDates[a]);
            }
        }

    });

    return Calendar;
});