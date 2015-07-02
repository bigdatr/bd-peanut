
var React = require('react');
// var _ = require('lodash');

// var Compare = require('bd-stampy/utils/Compare');

var Legend = React.createClass({
    propTypes: {
        colors: React.PropTypes.array.isRequired,
        legend: React.PropTypes.array.isRequired
    },
    // shouldComponentUpdate: function (nextProps) {
    //     if(_.difference(this.props.legend, nextProps.legend).length > 0) {
    //         return true;
    //     }
    //     if(Compare.array(this.props.colors, nextProps.colors)) {
    //         return true;
    //     }
    //     return false;  
    // },
    render: function () {
        return (
            <ul className="Legend">{this.renderItems(this.props.legend)}</ul>
        );
    },
    renderItems: function (legend) {
        return legend.map(function (series, key) {
            return <li className="Legend_item" key={key} data-label={series} style={{borderColor: this.props.colors[key]}}></li>;
        }.bind(this));
    }
});

module.exports = Legend;