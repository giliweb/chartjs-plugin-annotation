// Line Annotation implementation
module.exports = function(Chart) {
    /* eslint-disable global-require */
    // var chartHelpers = Chart.helpers;
    var helpers = require('../helpers.js')(Chart);
    /* eslint-enable global-require */

    function calculateLabelPosition(view, width, height, padWidth, padHeight) {


        var line = view.line;
        var ret = {};
        var xa = 0;
        var ya = 0;

        switch (true) {
            // top align
            case view.labelPosition === 'top':
                ya = padHeight + view.labelYAdjust;
                xa = (width / 2) + view.labelXAdjust;
                ret.y = view.y + ya;
                ret.x = view.x - xa;
                break;

            // bottom align
            case view.labelPosition === 'bottom':
                ya = height + padHeight + view.labelYAdjust;
                xa = (width / 2) + view.labelXAdjust;
                ret.y = view.y - ya;
                ret.x = view.x - xa;
                break;

            // left align
            case view.labelPosition === 'left':
                xa = padWidth + view.labelXAdjust;
                ya = -(height / 2) + view.labelYAdjust;
                ret.x = view.x + xa;
                ret.y = view.y + ya;
                break;

            // right align
            case view.labelPosition === 'right':
                xa = width + padWidth + view.labelXAdjust;
                ya = -(height / 2) + view.labelYAdjust;
                ret.x = view.x - xa;
                ret.y = view.y + ya;
                break;

            // center align
            default:
                ret.x = ((view.x - width) / 2) + view.labelXAdjust;
                ret.y = ((view.y - height) / 2) + view.labelYAdjust;
        }

        return ret;
    }

    var PointAnnotation = Chart.Annotation.Element.extend({
        configure: function() {

            var model = this._model;
            var options = this.options;
            var chartInstance = this.chartInstance;
            var ctx = chartInstance.chart.ctx;

            var xScale = chartInstance.scales[options.xScaleID];
            var yScale = chartInstance.scales[options.yScaleID];
            var x, y;
            if (xScale) {
                x = helpers.isValid(options.xValue) ? xScale.getPixelForValue(options.xValue) : NaN;
                y = helpers.isValid(options.yValue) ? yScale.getPixelForValue(options.yValue) : NaN;
            }
            if (isNaN(x) || isNaN(y)) {
                return;
            }

            var chartArea = chartInstance.chartArea;

            model.borderColor = options.borderColor || 'red';
            model.backgroundColor = options.backgroundColor || 'yellow'
            model.borderWidth = options.borderWidth || 2;
            model.borderDash = options.borderDash || [];
            model.radius = options.radius || 10
            model.style = options.style || 'circle'
            model.rotation = options.rotation || 0
            model.borderDash = options.borderDash || []
            model.drawHorizontalLine = options.drawHorizontalLine || false
            model.drawVerticalLine = options.drawVerticalLine || false
            model.drawVerticalLineOverPoint = options.drawVerticalLineOverPoint || false
            model.drawHorizontalLineOverPoint = options.drawHorizontalLineOverPoint || false

            model.x = x;
            model.y = y;


            if(model.drawHorizontalLine){
                if(model.drawVerticalLineOverPoint){
                    model.horizontalLine = [{
                        x1: chartArea.left,
                        y1: y,
                        x2: chartArea.right,
                        y2: y
                    }]
                } else {
                    model.horizontalLine = [
                        {
                            x1: chartArea.left,
                            y1: y,
                            x2: x - model.radius,
                            y2: y
                        },
                        {
                            x1: x + model.radius,
                            y1: y,
                            x2: chartArea.right,
                            y2: y
                        }
                    ]
                }

            }

            if(model.drawVerticalLine){
                if(model.drawVerticalLineOverPoint){
                    model.verticalLine = [{
                        x1: x,
                        y1: chartArea.top,
                        x2: x,
                        y2: chartArea.bottom
                    }]
                } else {
                    model.verticalLine = [
                        {
                            x1: x,
                            y1: chartArea.top,
                            x2: x,
                            y2: y - model.radius
                        },
                        {
                            x1: x,
                            y1: y + model.radius,
                            x2: x,
                            y2: chartArea.bottom
                        }
                    ]
                }

            }



            // Figure out the label:
            if(options.label){
                model.labelBackgroundColor = options.label.backgroundColor || 'white';
                model.labelFontFamily = options.label.fontFamily || 'arial';
                model.labelFontSize = options.label.fontSize || '12px';
                model.labelFontStyle = options.label.fontStyle || 'regular';
                model.labelFontColor = options.label.fontColor || 'black';
                model.labelXPadding = options.label.xPadding || 0;
                model.labelYPadding = options.label.yPadding || 0;
                model.labelCornerRadius = options.label.cornerRadius || 0;
                model.labelPosition = options.label.position || 'left';
                model.labelXAdjust = options.label.xAdjust || 0;
                model.labelYAdjust = options.label.yAdjust || 0;
                model.labelEnabled = options.label.enabled || true;
                model.labelContent = options.label.content || 'label text';
                model.labelTextAlign = options.label.textAlign || 'center'
                model.labelShadow = options.label.shadow || false
                model.labelBorderWidth = options.label.borderWidth || 0
                model.labelBorderColor = options.label.borderColor || 'black'
                model.labelStrokeColor = options.label.strokeColor || 'white'
                model.labelStrokeWidth = options.label.strokeWidth || 0
                model.labelBoxBorderWidth = options.label.boxBorderWidth || 0;
                model.labelBoxBorderColor = options.label.boxBorderColor || 'black';
                model.labelBoxBorderDash = options.label.boxBorderDash || [];

                model.labelLines = model.labelContent ? model.labelContent.split('\n') : []
                ctx.font = Chart.helpers.fontString(model.labelFontSize, model.labelFontStyle, model.labelFontFamily);
                var textWidth = model.labelContent ? ctx.measureText(model.labelLines[0]).width : 0;
                var textHeight = ctx.measureText('M').width;

                var labelPosition = calculateLabelPosition(model, textWidth, textHeight, model.labelXPadding, model.labelYPadding);
                model.labelX = labelPosition.x - model.labelXPadding;
                model.labelY = Math.max(labelPosition.y - model.labelYPadding, chartArea.top + 10);
                model.labelWidth = textWidth + (2 * model.labelXPadding);
                model.labelHeight = textHeight + (2 * model.labelYPadding);
            }



        },
        draw: function() {
            var view = this._view;
            var ctx = this.chartInstance.chart.ctx;
            ctx.save();
            ctx.strokeStyle = view.borderColor
            ctx.lineWidth = view.borderWidth;
            ctx.fillStyle = view.backgroundColor
            ctx.setLineDash(view.borderDash)
            Chart.helpers.canvas.drawPoint(ctx, view.style, view.radius, view.x, view.y, view.rotation)

            if(view.horizontalLine){
                ctx.beginPath();
                Chart.helpers.each(view.horizontalLine, function(line){
                    ctx.moveTo(line.x1, line.y1)
                    ctx.lineTo(line.x2, line.y2)
                    ctx.stroke();
                })

            }

            if(view.verticalLine){
                ctx.beginPath();
                Chart.helpers.each(view.verticalLine, function(line){
                    ctx.moveTo(line.x1, line.y1)
                    ctx.lineTo(line.x2, line.y2)
                    ctx.stroke();
                })

            }

            if(view.labelEnabled){
                ctx.fillStyle = view.labelBackgroundColor
                ctx.setLineDash(view.labelBoxBorderDash)
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

                ctx.font = Chart.helpers.fontString(
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


                Chart.helpers.each(view.labelLines, function(line, i){
                    ctx.fillText(
                        line,
                        x,
                        view.labelY + (view.labelHeight / 2) + (i * view.labelFontSize)
                    );

                })
            }


            ctx.restore();
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
    });

    return PointAnnotation;
};
