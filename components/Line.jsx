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
            padding: 0
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
    getMax: function() {
        var MAX = _.chain(this.props.data)
                    .flatten()
                    .max(function(d) {
                        return d.value;
                    })
                    .value();

        return MAX.value;
    },
    getComputedValues: function(data, tickInterval) {
        data = data || this.props.data;
        tickInterval = tickInterval || this.props.tickInterval;

        var extent = Maths.extent(
            _.chain(data)
                .map(function(s) {
                    return s.map(function(d) {
                        return d.value;
                    });
                })
                .flatten()
                .remove(null)
                .value()
        );
        
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

        return {
            min: extent[0] || 0,
            max: roundMax,
            numberOfTicks: numberOfTicks
        };
    },
    getPath: function(series, MAX) {
        if (!series || series.length === 0) {
            return 'M0,0';
        }

        var padding = this.props.padding;
        var h = this.state.height - padding,
            w = this.state.width - padding;

        var xSpacer = w / series.length;

        var getY = function(val) {
            return h - ((val / MAX) * h);
        };

        var path = _.chain(series)
                        .map(function(d, i) {
                            return {
                                x: (i * xSpacer) + padding,
                                y: getY(d.value)
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
        firstDate = moment(new Date(firstDate));
        lastDate = moment(new Date(lastDate));

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
                        {this.renderSeries()}
                    </svg>
                </div>
            </div>
        );
    },
    renderSeries: function() {
        var data = this.props.data || [];

        var MAX = this.getMax();

        return data.map(function(d, i) {
            var seriesStyle = {
                stroke: this.props.colors[i]
            };

            return <path className="Line_path" key={i} style={seriesStyle} d={this.getPath(d, MAX)} />;
        }.bind(this)).reverse();
    },
    renderYAxis: function (computedValues) {        
        var range = [],
            height = this.state.height - this.props.padding;

        if (computedValues.numberOfTicks > 0) {
            range = Maths.tickRange(computedValues.numberOfTicks, 0, computedValues.max);
        }

        var ySpacer = height / range.length;
        var padding = 0,
            diff = (range.length - 1) * ySpacer;

        if (diff < height) {
            padding = height - diff;
        }

        var labels = _.map(range, function(key, i) {
            var lbl = key,
                y = i * ySpacer + padding;

            if (this.props.yValueLabel) {
                lbl = this.props.yValueLabel(key, i) || lbl;
            }

            return <text className="Line_ylabel" key={i} x="-16px" y={y}>{lbl !== undefined ? lbl : key}</text>;
        }, this);

        var left = this.props.padding,
            bottom = height;

        return (
            <g>
                {labels}
            </g>
        );
                // <line className="Line_path" x1={left} x2={left} y1={0} y2={bottom} />
    },
    renderXAxis: function() {
        if (this.props.data[0].length !== this.props.data[1].length) {
            console.warn('benchmark and query days do not match!');
        }


        var range = this.getXLabels(this.props.data[0][0].date, this.props.data[0][this.props.data[0].length - 1].date);

        var left = this.props.padding,
            right = this.state.width,
            bottom = this.state.height - this.props.padding,
            height = this.state.height + 24;

        var xSpacer = (this.state.width - this.props.padding) / range.length;

        var labels = range.map(function(l, i) {
            var xPos = (xSpacer * i) + xSpacer;
            if(i !== range.length -1) {
                return <text className="Line_xlabel" key={i} x={xPos} y={height}>{l}</text>;                
            }
        });

        return (
            <g>
                {labels}
            </g>
        );
                // <line className="Line_path" x1={left} x2={right} y1={bottom} y2={bottom} />
    }
});

module.exports = Line;