/* 
 * 拓张日历功能：添加滑动切换月，上下折叠功能
 * @author muqin_deng
 * @time 2015/04/22
 */
(function (window, undefined) {
	var __prop__ = Calendar.prototype;

	//拓展日历功能
	Calendar.prototype = $.extend({}, Calendar.prototype, {
		// 重写ready方法
		ready: function() {
			__prop__.ready.call(this);
			this.resetCalSwipeProp();
			this.adjustDateWrapHeight();
		},

		//获取当前日所在行下标
		getSelectedDateRowIndex: function () {
			var datesData = this.get('datesData'),	//日历表数据
				selectedDate = this.getSelectedDate();	//当前选中日期

			//当前选中日期在日历表的下标
			var currDateIndex = +selectedDate + datesData.preMonthDates;
				
			return Math.ceil(currDateIndex / 7) - 1;
		},
		
		//滑动切换月
		bindSwipeEvt: function () {
			var me = this;
			
			this.find('.date-wrap').tap('swipeLeft', function () {
				me.nextMonth();	
			})
			.tap('swipeRight', function () {
				me.preMonth();
			});
			
			return this;
		},
		
		getLineHeight: function () {
			var lineHeight = this.get('lineHeight');
			
			if (!lineHeight) {
				lineHeight = this.find('.oneweek').first().height();
				this.set('lineHeight', lineHeight);
			}
			return lineHeight;
		},
		
		get$dateWrap: function () {
			var $dateWrap = this.get('$dateWrap');
			
			if (!$dateWrap) {
				$dateWrap = this.find('.date-wrap');
				this.set('$dateWrap', $dateWrap);
			}
			return $dateWrap;
		},
		
		//获取日历表的原始高度
		getDateWrapOriginHeight: function () {
			var dateWrapOriginHeight = this.get('dateWrapOriginHeight');
			
			if (!dateWrapOriginHeight) {
				dateWrapOriginHeight = this.get$dateWrap().height();
				this.set('dateWrapOriginHeight', dateWrapOriginHeight);
			}
			return dateWrapOriginHeight;
		},
		
		//重置日历滑动折叠事件所需的部分参数
		resetCalSwipeProp: function () {
			var height = this.get$dateWrap().height();
			
			this.set('isSlideDown', true)
				.set('isSlideUp', false)
				.set('dateWrapOriginHeight', height)
				.set('dateWrapHeight', height)
				.set('top', 0);

			this.get$dateWrap().height(height).css('top',0);
		},
		
		//日历折叠
		slideControll: function (distance) {
			if (!distance) return ;
			
			var $dateWrap = this.get$dateWrap(),
				lineHeight = this.getLineHeight(),		//日历表每行的高度
				dateWrapOriginHeight = this.getDateWrapOriginHeight(),	//日历表的原高度
				rowIndex = this.getSelectedDateRowIndex(),	//选中日期的日历表行下标
				maxSlideDis = rowIndex * lineHeight,		//日历可以折叠的最大距离
				top = (this.get('top') || 0) + distance,			//日历表向上偏移差
				dateWrapHeight = (this.get('dateWrapHeight') || dateWrapOriginHeight) + distance;	//日历表高度
			
			this.set('isSlideUp', false)	//重置向上折叠状态
				.set('isSlideDown', false);	//重置向下展开状态
			
			//向上偏移不能超过最大的折叠距离且不能小于0
			if (top < -maxSlideDis) {
				top = -maxSlideDis;
			} else if (top > 0) {
				top = 0;
			}
			
			//日历表的高度不能小于一行的高度且不能高于原本的高度
			if (dateWrapHeight < lineHeight) {
				dateWrapHeight = lineHeight;
				this.set('isSlideUp', true);	//处于向上折叠状态
			} else if (dateWrapHeight > dateWrapOriginHeight) {
				dateWrapHeight = dateWrapOriginHeight;
				this.set('isSlideDown', true);	//处于向下展开状态
			}
			
			this.set('maxSlideDis', maxSlideDis)
				.set('top', top)
				.set('dateWrapHeight', dateWrapHeight);
			
			$dateWrap.css({
				'height': dateWrapHeight + 'px',
				'top': top + 'px'
			});
				
		},
		
		//根据当前日历表的折叠高度是否超过阀值来判断
		//要进行向下折叠还是向上展开
		autoSlide: function (slideStatus) {
			var threshold = this.get('autoSlideThreshold') || 0.25,		//折叠阀值
				lineHeight = this.getLineHeight(),						//最低的可折叠高度
				dateWrapOriginHeight = this.getDateWrapOriginHeight(),	//日历表原始高度
				dateWrapHeight = this.get('dateWrapHeight');			//日历表当前高度
			
			//处于向下展开状态
			if (slideStatus == 'slideDown') {
				//滑动距离超过阀值
				if (dateWrapHeight <= dateWrapOriginHeight * (1 - threshold)) {
					this.slideUp();
				} else {
					this.slideDown();
				}
			}
			//处于向上折叠状态
			if (slideStatus == 'slideUp') {
				//滑动距离超过阀值
				if (dateWrapHeight > lineHeight + dateWrapOriginHeight * threshold) {
					this.slideDown();
				} else {
					this.slideUp();
				}
			} 
		},

		//向下展开
		slideDown: function () {
			var dateWrapOriginHeight = this.getDateWrapOriginHeight();
			
			//判断是否已处于向下展开状态
			if (this.isSlideDown()) {
				this.fire('slideDown');
				return ;
			}
			
			this.slideAnimate({
				height: dateWrapOriginHeight + 'px',
				top: 0
			}, function () {
				this.set('top', 0)
					.set('dateWrapHeight', dateWrapOriginHeight)
					.set('isSlideDown', true)
					.set('isSlideUp', false);
				
				this.fire('slideDown');
			});
		},

		//向上收起
		slideUp: function () {
			var lineHeight = this.getLineHeight(),		//日历表每行的高度
				maxSlideDis = this.get('maxSlideDis') || this.getSelectedDateRowIndex() * lineHeight;	//日历可以折叠的最大距离
			
			//判断是否已处于向下展开状态
			if (this.isSlideUp()) {
				this.fire('slideUp');
				return ;
			}
			
			this.slideAnimate({
				height: lineHeight + 'px',
				top: -maxSlideDis + 'px'
			}, function () {
				this.set('top', -maxSlideDis)
					.set('dateWrapHeight', lineHeight)
					.set('isSlideUp', true)
					.set('isSlideDown', false);
				
				this.fire('slideUp');
			});
		},	
		
		//展开、收起动画 
		slideAnimate: function (cssObj, callback) {
			var me = this,
				$dateWrap = this.get$dateWrap(),
				time = this.get('slideAnimateTime') || 200;
						
			var animateText = 'all ' + time + 'ms ' + 'ease-out';
			
			$dateWrap.css({
				'-webkit-transition': animateText,
				'transition': animateText
			})
			.css(cssObj);
			
			window.setTimeout(function () {
				$dateWrap.css({
					'-webkit-transition': 'none',
					'transition': 'none'
				});
				callback.call(me);
			}, time);
			
		},
		
		isSlideDown: function () {
			return this.get('isSlideDown');
		},
		
		isSlideUp: function () {
			return this.get('isSlideUp');
		},

		adjustDateWrapHeight: function () {
			this.on('changeMonth', function() {
				var $dateWrap = this.get$dateWrap()
				var height = 0;

				$dateWrap.find('.oneweek').each(function(i, el) {
					height += $(el).height()
				});

				$dateWrap.height(height);
			}.bind(this))
		}
	});
})(window);
