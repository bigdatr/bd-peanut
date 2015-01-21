/** @jsx React.DOM */

var React = require('react');

var CSS = require('bd-stampy/utils/CSS');

var Donut = React.createClass({
    displayName: 'Donut',
    getSplitValue: function () {
        var value = this.props.data.value;
        return [Math.max(0, value - 50), Math.min(Math.max(value, 0), 50)];
    },
    render: function () {
        var color = {backgroundColor: this.props.data.fill};

        var leftStyle = new CSS(color);
        var rightStyle = new CSS(color);

        leftStyle.rotate(this.getSplitValue()[0]);
        rightStyle.rotate(this.getSplitValue()[1]);

        return (
            <div className="DonutGraph">
                <div className="DonutGraph_content">
                    <div className="DonutGraph_side DonutGraph_side-left">
                        <div className="DonutGraph_fill" style={leftStyle.prefix()}></div>
                    </div>
                    <div className="DonutGraph_side DonutGraph_side-right">
                        <div className="DonutGraph_fill" style={rightStyle.prefix()}></div>
                    </div>
                </div>
                <div className="DonutGraph_labels">
                    <div className="DonutGraph_value">{this.props.data.value}%</div>
                    <div className="DonutGraph_title">{this.props.data.label}</div>
                </div>
            </div>
        );
        
    }
});

module.exports = Donut;