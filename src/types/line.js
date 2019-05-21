// Line Annotation implementation
module.exports = function(Chart) {
	/* eslint-disable global-require */
	var chartHelpers = Chart.helpers;
	var helpers = require('../helpers.js')(Chart);
	/* eslint-enable global-require */

	var horizontalKeyword = 'horizontal';
	var verticalKeyword = 'vertical';

	function LineFunction(view) {
		// Describe the line in slope-intercept form (y = mx + b).
		// Note that the axes are rotated 90° CCW, which causes the
		// x- and y-axes to be swapped.
		var m = (view.x2 - view.x1) / (view.y2 - view.y1);
		var b = view.x1 || 0;

		this.m = m;
		this.b = b;

		this.getX = function(y) {
			// Coordinates are relative to the origin of the canvas
			return m * (y - view.y1) + b;
		};

		this.getY = function(x) {
			return ((x - b) / m) + view.y1;
		};

		this.intersects = function(x, y, epsilon) {
			epsilon = epsilon || 0.001;
			var dy = this.getY(x);
			var dx = this.getX(y);
			return (
				(!isFinite(dy) || Math.abs(y - dy) < epsilon) &&
				(!isFinite(dx) || Math.abs(x - dx) < epsilon)
			);
		};
	}

	function calculateLabelPosition(view, width, height, padWidth, padHeight) {


		var line = view.line;
		var ret = {};
		var xa = 0;
		var ya = 0;

		switch (true) {
			// top align
			case view.mode === verticalKeyword && view.labelPosition === 'top':
				ya = padHeight + view.labelYAdjust;
				xa = (width / 2) + view.labelXAdjust;
				ret.y = view.y1 + ya;
				ret.x = (isFinite(line.m) ? line.getX(ret.y) : view.x1) - xa;
				break;

			// bottom align
			case view.mode === verticalKeyword && view.labelPosition === 'bottom':
				ya = height + padHeight + view.labelYAdjust;
				xa = (width / 2) + view.labelXAdjust;
				ret.y = view.y2 - ya;
				ret.x = (isFinite(line.m) ? line.getX(ret.y) : view.x1) - xa;
				break;

			// left align
			case view.mode === horizontalKeyword && view.labelPosition === 'left':
				xa = padWidth + view.labelXAdjust;
				ya = -(height / 2) + view.labelYAdjust;
				ret.x = view.x1 + xa;
				ret.y = line.getY(ret.x) + ya;
				break;

			// right align
			case view.mode === horizontalKeyword && view.labelPosition === 'right':
				xa = width + padWidth + view.labelXAdjust;
				ya = -(height / 2) + view.labelYAdjust;
				ret.x = view.x2 - xa;
				ret.y = line.getY(ret.x) + ya;
				break;

			// center align
			default:
				ret.x = ((view.x1 + view.x2 - width) / 2) + view.labelXAdjust;
				ret.y = ((view.y1 + view.y2 - height) / 2) + view.labelYAdjust;
		}

		return ret;
	}

	var LineAnnotation = Chart.Annotation.Element.extend({
		setDataLimits: function() {
			var model = this._model;
			var options = this.options;

			// Set the data range for this annotation
			model.ranges = {};
			model.ranges[options.scaleID] = {
				min: options.value,
				max: options.endValue || options.value
			};
		},
		configure: function() {
			var model = this._model;
			var options = this.options;
			var chartInstance = this.chartInstance;
			var ctx = chartInstance.chart.ctx;

			var scale = chartInstance.scales[options.scaleID];
			var pixel, endPixel;
			if (scale) {
				pixel = helpers.isValid(options.value) ? scale.getPixelForValue(options.value, options.value.index) : NaN;
				endPixel = helpers.isValid(options.endValue) ? scale.getPixelForValue(options.endValue, options.value.index) : pixel;
			}

			if (isNaN(pixel)) {
				return;
			}

			var chartArea = chartInstance.chartArea;



			model.line = new LineFunction(model);
			model.mode = options.mode;

			// Figure out the label:
			model.labelBackgroundColor = options.label.backgroundColor;
			model.labelFontFamily = options.label.fontFamily;
			model.labelFontSize = options.label.fontSize;
			model.labelFontStyle = options.label.fontStyle;
			model.labelFontColor = options.label.fontColor;
			model.labelXPadding = options.label.xPadding;
			model.labelYPadding = options.label.yPadding;
			model.labelCornerRadius = options.label.cornerRadius;
			model.labelPosition = options.label.position;
			model.labelXAdjust = options.label.xAdjust;
			model.labelYAdjust = options.label.yAdjust;
			model.labelEnabled = options.label.enabled;
			model.labelContent = options.label.content;
			model.labelTextAlign = options.label.textAlign || 'center'
			model.labelShadow = options.label.shadow || false
			model.labelBorderWidth = options.label.borderWidth || 0
			model.labelBorderColor = options.label.borderColor || 'black'
			model.labelStrokeColor = options.label.strokeColor || 'white'
			model.labelStrokeWidth = options.label.strokeWidth || 0
			model.labelBoxBorderWidth = options.label.boxBorderWidth || 0;
			model.labelBoxBorderColor = options.label.boxBorderColor || 'black';
			var lines = model.labelContent ? model.labelContent.split('\n') : []

			ctx.font = chartHelpers.fontString(model.labelFontSize, model.labelFontStyle, model.labelFontFamily);
			var textWidth = model.labelContent ? ctx.measureText(lines[0]).width : 0;
			var textHeight = ctx.measureText('M').width;

			var labelPosition = calculateLabelPosition(model, textWidth, textHeight, model.labelXPadding, model.labelYPadding);
			model.labelX = labelPosition.x - model.labelXPadding;
			model.labelY = Math.max(labelPosition.y - model.labelYPadding, chartArea.top + 10);
			model.labelWidth = textWidth + (2 * model.labelXPadding);
			model.labelHeight = textHeight + (2 * model.labelYPadding);

			model.borderColor = options.borderColor;
			model.borderWidth = options.borderWidth;
			model.borderDash = options.borderDash || [];
			model.borderDashOffset = options.borderDashOffset || 0;
			model.extend = options.extend || [0,0]
			model.shadow = options.shadow || []
			model.shadowWidth = options.shadowWidth || 1
			model.shadowColor = options.shadowColor || '#ffffff'


			// clip annotations to the chart area
			model.clip = {
				x1: chartArea.left - model.extend[0],
				x2: chartArea.right + model.extend[1],
				y1: chartArea.top,
				y2: chartArea.bottom
			};

			if (this.options.mode === horizontalKeyword) {
				if(this.options.min && this.options.secondaryScale){
					var secondaryScale = chartInstance.scales[this.options.secondaryScale];
					if (secondaryScale) {
						model.x1 = helpers.isValid(this.options.min) ? secondaryScale.getPixelForValue(this.options.min) : NaN;
					}
				} else {
					model.x1 = chartArea.left;
				}

				if(this.options.max && this.options.secondaryScale){
					var secondaryScale = chartInstance.scales[this.options.secondaryScale];
					if (secondaryScale) {
						model.x2 = helpers.isValid(this.options.max) ? secondaryScale.getPixelForValue(this.options.max) : NaN;
					}
				} else {
					model.x2 = chartArea.right;
				}
				model.y1 = pixel;
				model.y2 = endPixel;
			} else {
				if(this.options.min && this.options.secondaryScale){
					var secondaryScale = chartInstance.scales[this.options.secondaryScale];
					if (secondaryScale) {
						model.y1 = helpers.isValid(this.options.min) ? secondaryScale.getPixelForValue(this.options.min) : NaN;
					}
				} else {
					model.y1 = chartArea.top;
				}

				if(this.options.max && this.options.secondaryScale){
					var secondaryScale = chartInstance.scales[this.options.secondaryScale];
					if (secondaryScale) {
						model.y2 = helpers.isValid(this.options.max) ? secondaryScale.getPixelForValue(this.options.max) : NaN;
					}
				} else {
					model.y2 = chartArea.bottom;
				}


				model.x1 = pixel;
				model.x2 = endPixel;
				console.log(model)
			}


		},
		inRange: function(mouseX, mouseY) {
			var model = this._model;

			return (
				// On the line
				model.line &&
				model.line.intersects(mouseX, mouseY, this.getHeight())
			) || (
				// On the label
				model.labelEnabled &&
				model.labelContent &&
				mouseX >= model.labelX &&
				mouseX <= model.labelX + model.labelWidth &&
				mouseY >= model.labelY &&
				mouseY <= model.labelY + model.labelHeight
			);
		},
		getCenterPoint: function() {
			return {
				x: (this._model.x2 + this._model.x1) / 2,
				y: (this._model.y2 + this._model.y1) / 2
			};
		},
		getWidth: function() {
			return Math.abs(this._model.right - this._model.left);
		},
		getHeight: function() {
			return this._model.borderWidth || 1;
		},
		getArea: function() {
			return Math.sqrt(Math.pow(this.getWidth(), 2) + Math.pow(this.getHeight(), 2));
		},
		roundRect: function(ctx, x, y, width, height, radius, fill, stroke, strokeColor) {
			if (typeof stroke == 'undefined') {
				stroke = true;
			}
			if (typeof radius === 'undefined') {
				radius = 5;
			}
			if (typeof strokeColor === 'undefined') {
				strokeColor = 'black';
			}
			if (typeof radius === 'number') {
				radius = {tl: radius, tr: radius, br: radius, bl: radius};
			} else {
				var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
				for (var side in defaultRadius) {
					radius[side] = radius[side] || defaultRadius[side];
				}
			}
			ctx.beginPath();

			ctx.moveTo(x + radius.tl, y);
			ctx.lineTo(x + width - radius.tr, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
			ctx.lineTo(x + width, y + height - radius.br);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
			ctx.lineTo(x + radius.bl, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
			ctx.lineTo(x, y + radius.tl);
			ctx.quadraticCurveTo(x, y, x + radius.tl, y);
			ctx.closePath();
			if (fill) {
				ctx.fill();
			}
			if (stroke) {
				ctx.strokeStyle = strokeColor
				ctx.stroke();
			}

		},
		draw: function() {
			var view = this._view;
			var ctx = this.chartInstance.chart.ctx;

			if (!view.clip) {
				return;
			}

			ctx.save();

			// Canvas setup
			ctx.beginPath();
			ctx.rect(view.clip.x1, view.clip.y1, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1);
			ctx.clip();

			ctx.lineWidth = view.borderWidth;
			ctx.strokeStyle = view.borderColor;

			if (ctx.setLineDash) {
				ctx.setLineDash(view.borderDash);
			}
			ctx.lineDashOffset = view.borderDashOffset;

			// Draw
			ctx.beginPath();
			ctx.moveTo(view.x1, view.y1);
			ctx.lineTo(view.x2, view.y2);
			ctx.stroke();
			ctx.setLineDash([])
			if(view.shadow){
				ctx.strokeStyle = view.shadowColor
				ctx.lineWidth = view.shadowWidth;
				if(view.mode === horizontalKeyword){
					ctx.beginPath();
					ctx.moveTo(view.x1, view.y1 - view.shadow[0]);
					ctx.lineTo(view.x2, view.y2 - view.shadow[0]);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(view.x1, view.y1 + view.shadow[1]);
					ctx.lineTo(view.x2, view.y2 + view.shadow[1]);
					ctx.stroke();
				} else {
					ctx.beginPath();
					ctx.moveTo(view.x1 - view.shadow[0], view.y1);
					ctx.lineTo(view.x2 - view.shadow[0], view.y2);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(view.x1 + view.shadow[1], view.y1);
					ctx.lineTo(view.x2 + view.shadow[1], view.y2);
					ctx.stroke();
				}

			}

			if (view.labelEnabled && view.labelContent) {
				var lines = view.labelContent.split('\n')
				ctx.beginPath();
				ctx.rect(view.clip.x1, view.clip.y1, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1);
				ctx.clip();

				ctx.fillStyle = view.labelBackgroundColor;
				// Draw the tooltip
				// chartHelpers.drawRoundedRectangle(
				// 	ctx,
				// 	view.labelX, // x
				// 	view.labelY, // y
				// 	view.labelWidth, // width
				// 	view.labelHeight, // height
				// 	view.labelCornerRadius // radius
				// );

				this.roundRect(
					ctx,
					view.labelX, // x
					view.labelY, // y
					view.labelWidth, // width
					view.labelHeight, // height
					view.labelCornerRadius, // radius
					true,
					view.labelBoxBorderWidth,
					view.labelBoxBorderColor
				)
				// ctx.fill();

				// Draw the text
				ctx.font = chartHelpers.fontString(
					view.labelFontSize,
					view.labelFontStyle,
					view.labelFontFamily
				);
				ctx.fillStyle = view.labelFontColor;
				ctx.textAlign = view.labelTextAlign;
				ctx.textBaseline = 'middle';

				let x
				if(view.labelTextAlign === 'left'){
					x = view.labelX
				} else if(view.labelTextAlign === 'right'){
					x = view.labelX + view.labelWidth
				} else {
					x = view.labelX + (view.labelWidth / 2)
				}





				for (var i = 0; i<lines.length; i++) {



					if(view.labelStrokeWidth > 0){
						ctx.strokeStyle = view.labelStrokeColor
						ctx.lineWidth = view.labelStrokeWidth;
						ctx.strokeText(lines[i],
							x,
							view.labelY + (view.labelHeight / 2) + (i * view.labelFontSize));

					}

					if(view.labelShadow){
						ctx.shadowColor="white";
						ctx.shadowBlur = 2;
						ctx.strokeStyle = 'white'
						ctx.borderWidth = 3


					}

					ctx.fillText(
						lines[i],
						x,
						view.labelY + (view.labelHeight / 2) + (i * view.labelFontSize)
					);
					ctx.shadowBlur=0;

				}


			}

			ctx.restore();
		}
	});

	return LineAnnotation;
};
