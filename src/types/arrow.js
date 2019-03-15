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

	var ArrowAnnotation = Chart.Annotation.Element.extend({
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

			// clip annotations to the chart area


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

			ctx.font = chartHelpers.fontString(model.labelFontSize, model.labelFontStyle, model.labelFontFamily);
			var textWidth = ctx.measureText(model.labelContent).width;
			var textHeight = ctx.measureText('M').width;
			var labelPosition = calculateLabelPosition(model, textWidth, textHeight, model.labelXPadding, model.labelYPadding);
			model.labelX = labelPosition.x - model.labelXPadding;
			model.labelY = labelPosition.y - model.labelYPadding;
			model.labelWidth = textWidth + (2 * model.labelXPadding);
			model.labelHeight = textHeight + (2 * model.labelYPadding);

			model.borderColor = options.borderColor;
			model.backgroundColor = options.backgroundColor;
			model.borderWidth = options.borderWidth;
			model.borderDash = options.borderDash || [];
			model.borderDashOffset = options.borderDashOffset || 0;
			model.mirror = options.mirror || false
			model.align = options.align || 'left'
			model.padding = options.padding ? options.padding * (model.align === 'left' ? -1 : 1) : 0
			model.inside = options.inside || false

			model.clip = {
				x1: chartArea.left + model.padding,
				x2: chartArea.right + model.padding,
				y1: chartArea.top,
				y2: chartArea.bottom
			};

			if (this.options.mode === horizontalKeyword) {
				model.x1 = chartArea.left + model.padding;
				model.x2 = chartArea.right + model.padding;
				model.y1 = pixel;
				model.y2 = endPixel;
			} else {
				model.y1 = chartArea.top;
				model.y2 = chartArea.bottom;
				model.x1 = pixel + model.padding;
				model.x2 = endPixel + model.padding;
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
		draw: function() {
			var view = this._view;
			//console.log(view)
			var ctx = this.chartInstance.chart.ctx;

			if (!view.clip) {
				return;
			}



			if (this.options.mode === horizontalKeyword){
				if(view.align === 'left'){
					ctx.save();
					// Canvas setup
					ctx.beginPath();
					ctx.rect(view.clip.x1 - 21, view.clip.y1 - 20, view.clip.x2 - view.clip.x1 + 200, view.clip.y2 - view.clip.y1 + 200);
					ctx.clip();

					ctx.lineWidth = view.borderWidth;
					ctx.strokeStyle = view.borderColor;

					if (ctx.setLineDash) {
						ctx.setLineDash(view.borderDash);
					}
					ctx.lineDashOffset = view.borderDashOffset;

					// Draw
					ctx.beginPath();
					ctx.fillStyle = view.backgroundColor
					ctx.moveTo(view.x1 - 1 + (view.inside ? 11 : 0), view.y1);
					ctx.lineTo(view.x1 - 11 + ( view.inside ? 11 : 0), view.y1 - 10);
					ctx.lineTo(view.x1 - 11 + (view.inside ? 11 : 0), view.y1 + 10);
					ctx.lineTo(view.x1 - 1 + (view.inside ? 11 : 0), view.y1 );

					ctx.fill();
					ctx.restore();
				}




				if(view.mirror || view.align === 'right'){

					ctx.save();
					// Canvas setup
					ctx.beginPath();
					ctx.rect(view.clip.x2 - 11, view.clip.y1, view.clip.x2 - view.clip.x1 + 11, view.clip.y2 - view.clip.y1);
					ctx.clip();

					// Draw
					ctx.beginPath();
					ctx.fillStyle = view.backgroundColor

					ctx.moveTo(view.x2 + 1 - (view.inside ? 11 : 0), view.y1);
					ctx.lineTo(view.x2 + 11 - (view.inside ? 11 : 0), view.y1 - 10);
					ctx.lineTo(view.x2 + 11 - (view.inside ? 11 : 0), view.y1 + 10);
					ctx.lineTo(view.x2 + 1  - (view.inside ? 11 : 0), view.y1 );
					ctx.fill();
					ctx.restore();
				}
			} else {
				if(view.align === 'top'){
					//console.log(view)
					ctx.save();
					// Canvas setup
					ctx.beginPath();
					//console.log(view.clip.x1, view.clip.y1, view.clip.x2, view.clip.y1, view.x1, view.y1)
					ctx.rect(view.clip.x1, view.clip.y1 - 11, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1);
					ctx.clip();

					ctx.lineWidth = view.borderWidth;
					ctx.strokeStyle = view.borderColor;

					if (ctx.setLineDash) {
						ctx.setLineDash(view.borderDash);
					}
					ctx.lineDashOffset = view.borderDashOffset;

					// Draw
					ctx.beginPath();
					ctx.fillStyle = view.backgroundColor
					ctx.moveTo(view.x1, view.y1 + (view.inside ? 11 : 0));
					ctx.lineTo(view.x1 + 10, view.y1 - 11 + (view.inside ? 11 : 0));
					ctx.lineTo(view.x1 - 10, view.y1 - 11 + (view.inside ? 11 : 0));
					ctx.lineTo(view.x1 , view.y1 + (view.inside ? 11 : 0));
					ctx.fill();
					ctx.restore();
				}

				if(view.mirror || view.align === 'bottom'){
					ctx.save();
					// Canvas setup
					ctx.beginPath();
					ctx.rect(view.clip.x1, view.clip.y1 - 11, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1 + 11);
					ctx.clip();

					// Draw
					ctx.beginPath();
					ctx.fillStyle = view.backgroundColor

					ctx.moveTo(view.x1, view.y2 - (view.inside ? 11 : 0));
					ctx.lineTo(view.x1 - 10, view.y2 + 11 - (view.inside ? 11 : 0));
					ctx.lineTo(view.x1 + 10, view.y2 + 11 - (view.inside ? 11 : 0));
					ctx.lineTo(view.x1, view.y2 - (view.inside ? 11 : 0));
					ctx.fill();
					ctx.restore();
				}
			}



			if (view.labelEnabled && view.labelContent) {
				ctx.save();
				ctx.beginPath();
				ctx.rect(view.clip.x1, view.clip.y1, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1);
				ctx.clip();

				ctx.fillStyle = view.labelBackgroundColor;
				// Draw the tooltip
				chartHelpers.drawRoundedRectangle(
					ctx,
					view.labelX, // x
					view.labelY, // y
					view.labelWidth, // width
					view.labelHeight, // height
					view.labelCornerRadius // radius
				);
				ctx.fill();

				// Draw the text
				ctx.font = chartHelpers.fontString(
					view.labelFontSize,
					view.labelFontStyle,
					view.labelFontFamily
				);
				ctx.fillStyle = view.labelFontColor;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(
					view.labelContent,
					view.labelX + (view.labelWidth / 2),
					view.labelY + (view.labelHeight / 2)
				);
				ctx.restore();
			}


		}
	});

	return ArrowAnnotation;
};
