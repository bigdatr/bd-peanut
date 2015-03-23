/** @jsx React.DOM */

var React = require('react'),
    _ = require('lodash'),
    moment = require('moment');

var Maths = require('bd-stampy/utils/Maths');
var Legend = require('./Legend.jsx');

var _MAX_TICKS = 10;

var Line = React.createClass({
    displayName: 'Line',
    propTypes: {         
        data: React.PropTypes.array
    },
    getDefaultProps: function() {
        return {
            data: [],
            colors: [],
            tickInterval: 1,
            yAxisLabel: null,
            padding: 0,

            datapoints: true
        };
    },
    getInitialState: function() {
        return {
            width: 0,
            height: 300
        };
    },
    componentDidMount: function() {
        this.setState({width: this.refs.graphContent.getDOMNode().clientWidth});
    },
    getY: function(val, MAX) {
        var h = this.state.height - this.props.padding;
        return h - ((val / MAX) * h);
    },
    getX: function(val, numberOfTicks) {
        var padding = this.props.padding;
        var w = this.state.width - padding;
        var xSpacer = w / numberOfTicks;

        return (val * xSpacer) + padding;
    },
    getComputedValues: function(data, tickInterval) {
        // TODO: Refactor this function and add tests!!
        data = data || this.props.data;
        tickInterval = tickInterval || this.props.tickInterval;

        var _values = _.chain(data)
                            .map(function(s) {
                                return s.map(function(d) {
                                    return d.value;
                                });
                            })
                            .flatten()
                            .remove(null)
                            .value();

        var extent = Maths.extent(_values);
        
        var max = extent[1] || 0;
        var roundToNearest = tickInterval;
        var roundMax = Math.ceil(max / roundToNearest) * roundToNearest;

        var numberOfTicks = roundMax / tickInterval;

        if (numberOfTicks > _MAX_TICKS) {
            var nextTickInterval = tickInterval * 2;
            
            // To avoid going over the yMax
            if (this.props.yMax && roundMax > this.props.yMax) {
                if (this.props.tickInterval === 1 || this.props.tickInterval % 2 === 0) {
                    nextTickInterval = 5;
                }
                else {
                    nextTickInterval = 1;
                }
            }

            // Keep increasing the tickInterval until we get less than the _MAX_TICKS ticks
            return this.getComputedValues(data, nextTickInterval);
        }


        // More calcs
        var yRange = [],
            height = this.state.height - this.props.padding;

        if (numberOfTicks > 0) {
            yRange = Maths.tickRange(numberOfTicks, 0, roundMax);
        }

        var ySpacer = height / yRange.length;

        var yPadding = 0,
            diff = (yRange.length - 1) * ySpacer;

        if (diff < height) {
            yPadding = height - diff;
        }


        // X Calcs
        var xRange = this.getXLabels(this.props.data[0][0].date, this.props.data[0][this.props.data[0].length - 1].date);
        var xSpacer = (this.state.width - this.props.padding) / xRange.length;

        return {
            min: extent[0] || 0,
            max: roundMax,
            numberOfTicks: numberOfTicks,
            ySpacer: ySpacer,
            yPadding: yPadding,
            yRange: yRange,
            xRange: xRange,
            xSpacer: xSpacer
        };
    },
    getPath: function(series, MAX) {
        if (!series || series.length === 0) {
            return 'M0,0';
        }

        var _this = this;

        var path = _.chain(series)
                        .map(function(d, i) {
                            return {
                                x: _this.getX(i, series.length),
                                y: _this.getY(d.value, MAX)
                            };
                        })
                        .map(function(d, i) {
                            var c = i === 0 ? 'M' : 'L';

                            return c + [d.x, d.y].join(',');
                        })
                        .value();

        return path.join(' ');
    },
    getXLabels: function(firstDate, lastDate) {
        firstDate = moment(firstDate, 'YYYYMMDD');
        lastDate = moment(lastDate, 'YYYYMMDD');

        var interval = lastDate.diff(firstDate, 'months'),
            labels = [],
            interval_type = 'months',
            interval_format = 'MMM \'YY';
        
        // WEEKS
        if (interval <= 3) {
            interval = lastDate.diff(firstDate, 'weeks');
            interval_type = 'weeks';
            firstDate = firstDate.startOf('week');
            interval_format = 'D MMM \'YY';
        }
        
        // DAYS
        // if (interval_type === 'weeks' && interval <= 2) {
        //     console.log(interval);
        //     interval = lastDate.diff(firstDate, 'days');
        //     interval_type = 'days';
        //     firstDate = firstDate.startOf('day');
        //     interval_format = 'ddD';
        // }

        for (var i=0; i < interval; i++) {
            labels.push(moment(firstDate).add(i+1, interval_type).format(interval_format));
        }

        return labels;
    },
    render: function () {
        var computedValues = this.getComputedValues(this.props.data, this.props.tickInterval);

        return (
            <div className="Line Graph">
                <Legend legend={this.props.legend} colors={this.props.colors}></Legend>
                <div className="Graph_axis Graph_yaxis">
                    <div className="Graph_ytitle">{this.props.yAxisLabel}</div>
                </div>
                <div ref="graphContent" className="Grap_content">
                    <svg width={this.state.width} height={this.state.height} viewBox={[0, 0, this.state.width, this.state.height].join(' ')}>
                        {this.renderYAxis(computedValues)}
                        {this.renderXAxis(computedValues)}
                        {this.renderSeries(computedValues)}
                        {this.renderDatapoints(computedValues)}
                    </svg>
                </div>
            </div>
        );
    },
    renderSeries: function(computedValues) {
        var data = this.props.data || [];

        return data.map(function(d, i) {
            var seriesStyle = {
                stroke: this.props.colors[i]
            };

            return (
                <g key={i} className={'series series-' + (i+1)}>
                    <path className="Line_path" style={seriesStyle} d={this.getPath(d, computedValues.max)} />
                </g>
            );
        }.bind(this)).reverse();
    },
    renderYAxis: function (computedValues) {
        var labels = _.map(computedValues.yRange, function(key, i) {
            var lbl = key;
            var y = this.getY(key, computedValues.max);

            if (this.props.yValueLabel) {
                lbl = this.props.yValueLabel(key, i) || lbl;
            }

            return <text className="Line_ylabel" key={i} x="-16px" y={y}>{lbl}</text>;
        }, this);

        return <g className="yAxis">{labels}</g>;
    },
    renderXAxis: function(computedValues) {
        this.props.data.forEach(function(d, i) {
            if (d.length !== this.props.data[i].length) {
                console.warn('Each series must have a value for the same data points');
            }
        }.bind(this));

        var _this = this;

        var height = this.state.height + 24;

        var labels = computedValues.xRange.map(function(l, i) {
            var x = _this.getX(i, computedValues.xRange.length) + computedValues.xSpacer;

            if(i !== computedValues.xRange.length -1) {
                return <text className="Line_xlabel" key={i} x={x} y={height}>{l}</text>;
            }
        });

        return <g className="xAxis">{labels}</g>;
    },
    renderDatapoints: function(computedValues) {
        if (!this.props.datapoints) {
            return null;
        }

        var _this = this;

        var datapoints = this.props.data.map(function(series, seriesIndex) {
            var seriesColor = _this.props.colors[seriesIndex];
            var points = _.chain(series)
                .map(function(d, i) {
                    var x = _this.getX(i, series.length);
                    var y = _this.getY(d.value, computedValues.max);

                    return <circle  key={i}
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    stroke={seriesColor}
                                    strokeWidth="2"
                                    fill="#fff" />;
                })
                .value();

            return <g className={"datapoints_series datapoints_series-" + seriesIndex}>{points}</g>;
        });

        return <g className="datapoints">{datapoints}</g>;
    }
});

module.exports = Line;