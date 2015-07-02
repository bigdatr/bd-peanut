

var React = require('react'),
    _ = require('lodash'),
    moment = require('moment');
var Immutable = require('immutable');

var Maths = require('bd-stampy/utils/Maths');
var Legend = require('./Legend.jsx');

var _MAX_TICKS = 10;

var Line = React.createClass({
    displayName: 'Line',
    propTypes: {         
        data: React.PropTypes.object
    },
    getDefaultProps: function() {
        return {
            data: Immutable.List(),
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
        this.setState({
            width: this.refs.graphContent.getDOMNode().clientWidth
        });
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

        var _values = data
                        .map((s) => {
                            return s.map((d) => d.get('value'));
                        })
                        .flatten()
                        .sort();
        
        var max = _values.last() || 0;
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
        var minDate = this.props.data.first().first().get('date');
        var maxDate = this.props.data.first().last().get('date');

        var xRange = this.getXLabels(minDate, maxDate);

        return {
            min: _values.first() || 0,
            max: roundMax,
            numberOfTicks: numberOfTicks,
            ySpacer: ySpacer,
            yPadding: yPadding,
            yRange: yRange,
            xRange: xRange
        };
    },
    getPath: function(series, MAX) {
        if (!series || series.size === 0) {
            return 'M0,0';
        }

        if (series.size === 1) { // copy the first( and the only) value, to draw a line.
            series = series.push(series.first());
        }

        var _this = this;

        var path = series
                        .map((d, i) => {
                            var coord = {
                                x: _this.getX(i, series.size),
                                y: _this.getY(d.get('value'), MAX)
                            };

                            var c = i === 0 ? 'M' : 'L';
                            return c + [coord.x, coord.y].join(',');
                        })
                        .join(' ');

        return path;
    },
    getXLabels: function(firstDate, lastDate) {
        firstDate = moment(firstDate, 'YYYYMMDD');
        lastDate = moment(lastDate, 'YYYYMMDD');

        var interval = lastDate.diff(firstDate, 'days');
        var interval_format = 'dd DD-MMM-YY';
        var interval_type = 'day';

        var labels = [];

        if (interval >= 85) {
            // MONTHS
            interval_format = 'MMM YY';
            interval_type = 'month';
        }
        else if (interval >= 14) {
            // WEEKS
            interval_format = 'D MMM YY';
            interval_type = 'week';
        }
        else {
            // WEEKS
            interval_format = 'dd D/M';
            interval_type = 'day';
        }

        var _labelCount = interval + 1;

        for (var i=0; i < _labelCount; i++) {
            var nextLabel = moment(firstDate)
                                .add(i, 'days')
                                .startOf(interval_type);

            if (nextLabel.isBefore(firstDate)) {
                nextLabel = firstDate;
            }

            labels.push(nextLabel.format(interval_format));
        }

        return labels;
    },
    onShowDatapointDetails: function(d, x, y) {
        this.setState({
            currentDatapoint: {
                d: d,
                x: x,
                y: y
            }
        });
    },
    onHideDatapointDetails: function() {
        this.setState({
            currentDatapoint: null
        });
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

                    {this.renderTooltip()}
                </div>
            </div>
        );
    },
    renderSeries: function(computedValues) {
        var data = this.props.data || Immutable.List();

        return data
                .map(function(d, i) {
                    var seriesStyle = {
                        stroke: this.props.colors[i]
                    };

                    return (
                        <g key={i} className={'series series-' + (i+1)}>
                            <path className="Line_path" style={seriesStyle} d={this.getPath(d, computedValues.max)} />
                        </g>
                    );
                }.bind(this))
                .reverse()
                .toJS();
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
            if (d.size !== this.props.data.get(i).size) {
                console.warn('Each series must have a value for the same data points');
            }
        }.bind(this));

        var _this = this;
        var height = this.state.height + 24;

        var labels = computedValues.xRange.map(function(l, i) {
            var nextLabel = l;
            var prevLabel = computedValues.xRange[i-1];

            if (nextLabel === prevLabel) {
                return null;
            }

            var x = _this.getX(i, computedValues.xRange.length);

            return <text className="Line_xlabel" key={i} x={x} y={height}>{nextLabel}</text>;
        });

        return <g className="xAxis">{labels}</g>;
    },
    renderDatapoints: function(computedValues) {
        if (!this.props.datapoints) {
            return null;
        }

        var _this = this;

        var currentDatapoint = this.state.currentDatapoint ? this.state.currentDatapoint.d : null;

        var datapoints = this.props.data
                            .map(function(series, seriesIndex) {
                                var seriesColor = _this.props.colors[seriesIndex];

                                var points = series
                                    .map(function(d, i) {
                                        var x = _this.getX(i, series.size);
                                        var y = _this.getY(d.get('value'), computedValues.max);

                                        return <circle  key={i}
                                                        cx={x}
                                                        cy={y}
                                                        r="3"
                                                        stroke={seriesColor}
                                                        strokeWidth="2"
                                                        fill={currentDatapoint === d ? seriesColor : '#fff'}
                                                        onMouseOver={_this.onShowDatapointDetails.bind(_this, d, x, y)}
                                                        onMouseOut={_this.onHideDatapointDetails} />;
                                    }).toJS();

                                return <g key={seriesIndex} className={"datapoints_series datapoints_series-" + seriesIndex}>{points}</g>;
                            })
                            .toJS();

        return <g className="datapoints">{datapoints}</g>;
    },
    renderTooltip: function() {
        if (!this.props.datapoints || !this.state.currentDatapoint) {
            return null;
        }

        var currentDatapoint = this.state.currentDatapoint;

        var styles = {
            datapointDetails: {
                position: 'absolute',
                backgroundColor: 'hotpink',
                color: '#fff',
                fontSize: '0.9em',
                fontWeight: 600,
                textAlign: 'center',
                padding: 10,

                left: currentDatapoint.x,
                top: currentDatapoint.y - 90
            },
            value: {
                fontSize: 40,
                fontWeight: 'bold'
            },
            date: {
                fontWeight: 200,
            }
        };

        var date = moment(currentDatapoint.d.get('date'), 'YYYYMMDD').format('Do MMMM YYYY');
        var value = currentDatapoint.d.get('value').toFixed(2);
        
        return (
            <div style={styles.datapointDetails}>
                <div style={styles.value}>{value}</div>
                <div style={styles.date}>{date}</div>
            </div>
        );
    }
});

module.exports = Line;