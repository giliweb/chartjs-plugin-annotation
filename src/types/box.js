// Box Annotation implementation
module.exports = function(Chart) {
	/* eslint-disable global-require */
	var helpers = require('../helpers.js')(Chart);
	var chartHelpers = Chart.helpers;
	/* eslint-enable global-require */

	var BoxAnnotation = Chart.Annotation.Element.extend({
		setDataLimits: function() {
			var model = this._model;
			var options = this.options;
			var chartInstance = this.chartInstance;

			var xScale = chartInstance.scales[options.xScaleID];
			var yScale = chartInstance.scales[options.yScaleID];
			var chartArea = chartInstance.chartArea;

			// Set the data range for this annotation
			model.ranges = {};

			if (!chartArea) {
				return;
			}

			var min = 0;
			var max = 0;

			if (xScale) {
				min = helpers.isValid(options.xMin) ? options.xMin : xScale.getValueForPixel(chartArea.left);
				max = helpers.isValid(options.xMax) ? options.xMax : xScale.getValueForPixel(chartArea.right);

				model.ranges[options.xScaleID] = {
					min: Math.min(min, max),
					max: Math.max(min, max)
				};
			}

			if (yScale) {
				min = helpers.isValid(options.yMin) ? options.yMin : yScale.getValueForPixel(chartArea.bottom);
				max = helpers.isValid(options.yMax) ? options.yMax : yScale.getValueForPixel(chartArea.top);

				model.ranges[options.yScaleID] = {
					min: Math.min(min, max),
					max: Math.max(min, max)
				};
			}
		},
		configure: function() {
			var model = this._model;
			var options = this.options;
			var chartInstance = this.chartInstance;
			var ctx = chartInstance.chart.ctx;
			var xScale = chartInstance.scales[options.xScaleID];
			var yScale = chartInstance.scales[options.yScaleID];
			var chartArea = chartInstance.chartArea;

			// clip annotations to the chart area
			model.clip = {
				x1: chartArea.left,
				x2: chartArea.right,
				y1: chartArea.top,
				y2: chartArea.bottom
			};

			var left = chartArea.left;
			var top = chartArea.top;
			var right = chartArea.right;
			var bottom = chartArea.bottom;

			var min, max;

			if (xScale) {
				min = helpers.isValid(options.xMin) ? xScale.getPixelForValue(options.xMin) : chartArea.left;
				max = helpers.isValid(options.xMax) ? xScale.getPixelForValue(options.xMax) : chartArea.right;
				left = Math.min(min, max);
				right = Math.max(min, max);
			}

			if (yScale) {
				min = helpers.isValid(options.yMin) ? yScale.getPixelForValue(options.yMin) : chartArea.bottom;
				max = helpers.isValid(options.yMax) ? yScale.getPixelForValue(options.yMax) : chartArea.top;
				top = Math.min(min, max);
				bottom = Math.max(min, max);
			}

			// Ensure model has rect coordinates
			model.left = left;
			model.top = top;
			model.right = right;
			model.bottom = bottom;

			// Stylistic options
			model.borderColor = options.borderColor;
			model.borderWidth = options.borderWidth;
			model.backgroundColor = options.backgroundColor;
			model.lineDash = options.lineDash ? options.lineDash : []
			model.data = options.data ? options.data : null
			model.selected = options.selected ? options.selected : null


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
			var textWidth = model.labelContent ? ctx.measureText(model.labelContent.split('\n')[0]).width : 0;
			var textHeight = ctx.measureText('M').width;
			//var labelPosition = calculateLabelPosition(model, textWidth, textHeight, model.labelXPadding, model.labelYPadding);
			model.labelX = model.left - model.labelXPadding - (model.labelPosition === 'center' ? textWidth / 2 : 0) + model.labelXAdjust;
			model.labelY = model.top - model.labelYPadding + model.labelYAdjust;
			model.labelWidth = textWidth + (2 * model.labelXPadding);
			model.labelHeight = textHeight + (2 * model.labelYPadding);
		},
		inRange: function(mouseX, mouseY) {
			var model = this._model;
			return model &&
				mouseX >= model.left &&
				mouseX <= model.right &&
				mouseY >= model.top &&
				mouseY <= model.bottom;
		},
		getCenterPoint: function() {
			var model = this._model;
			return {
				x: (model.right + model.left) / 2,
				y: (model.bottom + model.top) / 2
			};
		},
		getWidth: function() {
			var model = this._model;
			return Math.abs(model.right - model.left);
		},
		getHeight: function() {
			var model = this._model;
			return Math.abs(model.bottom - model.top);
		},
		getArea: function() {
			return this.getWidth() * this.getHeight();
		},
		draw: function() {
			var view = this._view;
			var ctx = this.chartInstance.chart.ctx;

			ctx.save();

			// Canvas setup
			ctx.beginPath();
			ctx.rect(view.clip.x1, view.clip.y1, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1);
			ctx.clip();

			ctx.lineWidth = view.borderWidth;
			ctx.strokeStyle = view.borderColor;
			ctx.fillStyle = view.backgroundColor;
			ctx.setLineDash(view.lineDash)

			// Draw
			var width = view.right - view.left;
			var height = view.bottom - view.top;

			ctx.fillRect(view.left, view.top, width, height);
			ctx.strokeRect(view.left, view.top, width, height);

			if (view.labelEnabled && view.labelContent) {
				var lines = view.labelContent.split('\n')
				ctx.beginPath();
				ctx.rect(view.clip.x1, view.clip.y1, view.clip.x2 - view.clip.x1, view.clip.y2 - view.clip.y1);
				ctx.clip();

				ctx.fillStyle = view.labelBackgroundColor;
				// Draw the tooltip
				ctx.shadowColor = 'black';
				ctx.shadowBlur = 5;
				chartHelpers.drawRoundedRectangle(
					ctx,
					view.labelX, // x
					view.labelY, // y
					view.labelWidth, // width
					(view.labelHeight * lines.length * .7), // height
					view.labelCornerRadius // radius
				);
				ctx.fill();
				ctx.shadowColor = 'transparent'
				// Draw the text
				ctx.font = chartHelpers.fontString(
					view.labelFontSize,
					view.labelFontStyle,
					view.labelFontFamily
				);
				ctx.fillStyle = view.labelFontColor;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';


				for (var i = 0; i<lines.length; i++)
					ctx.fillText(
						lines[i],
						view.labelX + (view.labelWidth / 2),
						view.labelY + (view.labelHeight / 2) + (i * view.labelFontSize)
					);

			}


			ctx.restore();
		}
	});

	return BoxAnnotation;
};
