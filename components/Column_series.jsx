/** @jsx React.DOM */
var React = require('react');
var _ = require('lodash');

var CSS = require('bd-stampy/utils/CSS');

var Column_series = React.createClass({
    displayName: 'Column_series',
    propTypes: {
        value:          React.PropTypes.number,
        seriesIndex:    React.PropTypes.number,
        containerSize:  React.PropTypes.number,
        column_data:    React.PropTypes.object,
        columnStyle:    React.PropTypes.func,
        colors:         React.PropTypes.array,
        computedValues: React.PropTypes.object
    },
    getDefaultProps: function () {
        return {
            value: 0,
            yPos: 0
        };
    },
    // shouldComponentUpdate: function (nextProps) {
    //     // Make sure to ignore nested object and arrays.
    //     for (var prop in nextProps) {
    //         if(Compare.shallowNotEqual(this.props[prop], nextProps[prop])) {
    //             return true;
    //         }
    //     }
    //     return false;
    // },
    onColumnOver: function (e) {
        if (this.props.onColumnOver) {
            this.props.onColumnOver(e);
        }
    },
    onColumnOut: function (e) {
        if (this.props.onColumnOut) {
            this.props.onColumnOut(e);
        }
    },
    render: function() {
        var value = this.props.value;

        if (value === undefined || value === null) {
            return null;
        }
        
        var max = this.props.computedValues.max,
            min = this.props.computedValues.min,
            ammount;

        if (min === 0 && min === max) {
            // Don't display column
            ammount = 100;
        }
        else if(this.props.containerSize) {
            ammount = 100 - (Math.round(this.props.containerSize * value / max) / this.props.containerSize * 100);
        } else {
            // no value is 0;
            ammount = 100;
        }

        var style = {
            backgroundColor: this.props.colors[this.props.seriesIndex]
        };

        if (this.props.columnStyle) {
            style = _.defaults(this.props.columnStyle(value, this.props.column_data) || {}, style);
        }

        var css = new CSS(style);
        css.translateY(Math.max(0, ammount) + '%');
        
        return (
            <div key={this.props.seriesIndex} 
                className="Column_series" 
                ref="wrapper"
                style={css.prefix()}
                onMouseOver={this.onColumnOver.bind(this, ammount)}
                onMouseOut={this.onColumnOut}
            ></div>
        );
    },
});

module.exports = Column_series;