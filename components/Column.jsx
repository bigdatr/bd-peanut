/** @jsx React.DOM */

var React = require('react');
var _ = require('lodash');
var Maths = require('stampy/src/utils/Maths');
var Legend = require('./Legend.jsx');


var Stampy = require('stampy');

var Column_series = require('./Column_series.jsx');

var _MAX_TICKS = 10;

var Column = React.createClass({
    displayName: 'Column',
    mixins: [
        Stampy.ClassMixin
    ],
    propTypes: {         
        data: React.PropTypes.array.isRequired,
        colors: React.PropTypes.arrayOf(React.PropTypes.string),
        displayAxis: React.PropTypes.bool,
        xAxisLabel: React.PropTypes.func,
        yAxisLabel: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.func
        ]),
        yValueLabel: React.PropTypes.func,
        columnStyle: React.PropTypes.func,
        yMax: React.PropTypes.number,
        yAxisMax: React.PropTypes.number
    },
    getDefaultProps: function() {
        return {
            data: [],
            colors: ['#FDC855', '#FD9457'],
            tickInterval: 1,
            series: null,
            xAxisLabel: null,
            displayAxis: true,
            yValueLabel: null,

            yMax: null,

            columnStyle: null
        };
    },
    getInitialState: function () {
        return {
            tooltipValue: {},
            mouseCoordinates: [0,0],
            tooTight: false
        };
    },
    componentDidMount: function () {
        this.setState({containerSize: this.getDOMNode().offsetHeight});   
    },
    // onMouseMove: function (e) {
    //     var dom = this.refs.wrapper.getDOMNode();
    //     var main = this.refs.main.getDOMNode();
    //     console.dir(main);
    //     var ct = e.currentTarget;
    //     var top = e.currentTarget.offsetTop + e.currentTarget.offsetHeight;
    //     // var left = e.currentTarget.offsetWidth;
        
    //     var left = 0;

    //     // console.log(ct.offsetWidth, ct.offsetLeft, e.clientX, dom.offsetLeft);
    
    //     this.setState({
    //         mouseCoordinates: [e.clientX - left, e.clientY - top]
    //     });
    // },
    onColumnWrapperOver: function (value) {
        // this.setState({
        //     tooltipValue: value.series,
        // });
    },
    onColumnOver: function (value) {
        this.setState({
            currentValue: value,
            hover: true
        });
    }, 
    onColumnOut: function (e) {
        if(e.currentTarget === e.target) {
            this.setState({hover: false});            
        }
    },
    getComputedValues: function(data, tickInterval) {
        data = data || this.props.data;

        tickInterval = tickInterval || this.props.tickInterval;

        var extent = Maths.extent(
            _.chain(data)
                .map('series')
                .flatten()
                .remove(null)
                .value()
        );
        
        var max = extent[1] || 0;
        
        if(this.props.yAxisMax) {
            max = this.props.yAxisMax;
        }

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
    render: function () {
        var classes = this.ClassMixin_getClass('Column');
        var data = this.props.data;

        var computedValues = this.getComputedValues(data, this.props.tickInterval);

        return (
            <div ref="main"className={classes.className}>
                {this.renderLegend()}
                {this.renderYAxis(computedValues)}
                {this.renderColumns(data, computedValues)}
                {this.renderValueBar(computedValues)}
                {this.renderTooltip(this.state.tooltipValue)}
            </div>
        );
    },
    renderLegend: function () {
        if (!this.props.legend) {
            return null;
        }

        return <Legend legend={this.props.legend} colors={this.props.colors}></Legend>;
    },
    renderLegendItem: function (series, key) {
        return <li className="Column_seriesItem" key={key} data-label={series} style={{borderColor: this.props.colors[key]}}></li>;
    },
    renderYAxis: function (computedValues) {
        if (this.props.displayAxis) {
            var range = [];
            
            if (computedValues.numberOfTicks > 0) {
                range = Maths.tickRange(computedValues.numberOfTicks, 0, computedValues.max);
            }

            return (
                <div className="Column_yaxis">
                    <div className="Graph_ytitle">{this.props.yAxisLabel}</div>
                    {_.map(range, function(key, i) {
                        var lbl = key;

                        if (this.props.yValueLabel) {
                            lbl = this.props.yValueLabel(key, i);
                        }

                        var style = {
                            height: (100 / (range.length - 1) + '%')
                        };

                        return <div key={i} className="Column_ylabel" style={style}>{lbl !== undefined ? lbl : key}</div>;
                    }, this)}
                </div>
            );           
        }        
    },
    renderColumns: function (data, computedValues) {
        var _this = this;

        var columns = _.map(data, function(column, columnIndex){
            var stackSize = 0;
            var totalStackSize = 0;
            
            column.series.forEach(function(val) {
                totalStackSize += val;
            });

            var series = _.map(column.series, function(vv, ii) {
                stackSize += vv;
                return _this.renderSeries(vv, ii, column, computedValues, stackSize, totalStackSize);
            }).reverse();

            

            // var seriesOrder = (_this.props.type === 'accumulative') ? series.reverse() : series;

            return (
                <div key={columnIndex} className="Column_col">
                    <div className="Column_seriesWrapper" onMouseOver={_this.onColumnWrapperOver.bind(_this, column)}>
                        <div className="Column_seriesReposition">
                            {series}
                        </div>
                    </div>
                    <div className="Graph_xlabel Column_xlabel">{_this.renderXLabel(column, columnIndex)}</div>                    
                </div>
            );
        });
        return (
            <div className="Column_wrapper">{columns}</div>
        );
    },
    renderXLabel: function (column, columnIndex) {
        var xlabel = column.xlabel;
        if (this.props.displayAxis) {
            if (this.props.xAxisLabel) {
                xlabel = this.props.xAxisLabel(column.xlabel, columnIndex);
            }

            return xlabel !== undefined ? xlabel : column.xlabel;
        }
        // return "\u00a0"; // Non breaking space;
    },
    renderSeries: function(value, seriesIndex, column_data, computedValues, stackSize, totalStackSize) {
        var yPos = stackSize - value;
        var yPercent = (yPos / totalStackSize) * 100;

        var newValue = value;

        if(this.props.type === 'stacked') {
            newValue = value + yPos;
        }

        return <Column_series
            value={newValue}
            yPos={yPercent}
            key={seriesIndex}
            seriesIndex={seriesIndex}
            containerSize={this.state.containerSize}
            column_data={column_data}
            columnStyle={this.props.columnStyle}
            colors={this.props.colors}
            computedValues={computedValues}
        />;
    },
    renderValueBar: function () {
        var style = {
            top: this.state.currentValue + '%',
            opacity: 0
        };

        if(this.state.hover) {
            style.opacity = 1;
        }

        return <div className="Column_valueBar" style={style}></div>;
    },
    renderTooltip: function (data) {
        var style = {
            top: this.state.mouseCoordinates[1],
            left: this.state.mouseCoordinates[0],
            opacity: 0
        },
        series;

        if(this.state.hover) {
            style.opacity = 1;
        }
        

        if(data) {
            series = _.map(data, function (value, key) {
                return this.renderSeriesItem(value, key);
            }, this);           
        }

        return <div className="Column_tooltip" style={style}>
            <ul>{series}</ul>
        </div>;
    }
});

module.exports = Column;