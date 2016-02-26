

var React = require('react'),

var PunchCard = React.createClass({
    displayName: 'PunchCard',
    propTypes: {
        data: React.PropTypes.array,
        xAxisLabel: React.PropTypes.func,
        bubbleLabel: React.PropTypes.func
    },
    getDefaultProps: function() {
        return {
            data: [],
        };
    },
    render: function () {
        return (
            <div className="PunchCardGraph">
                {this.renderSegments()}
            </div>
        );

    },
    renderSegments: function() {
        var halflLength = Math.floor(this.props.data.length / 2);

        // iterate over prop.value, find maximum
        let MAX = Math.max(...this.props.data.map(ii => ii.value));

        return this.props.data.map(function(segment, key){
            var color = key >= halflLength ? 1 : 0;

            var style = {
                color: this.props.colors[color]
            };

            var fillStyle = {
                backgroundColor: this.props.colors[color],
                transform: 'scale(' + segment.value / MAX + ')'
            };

            //console.log('segment.value:', segment.value);
            //console.log('MAX:', MAX);


            // Middle bubble
            if (key === halflLength) {
                delete fillStyle.backgroundColor;

                return (
                    <div className="PunchCardGraph_segment" data-label='middle' key={key}>
                        <div className="PunchCardGraph_wrap">
                            <div className="PunchCardGraph_fill" style={fillStyle} data-label={segment.value + '%'}></div>
                        </div>
                    </div>
                );
            }



            var bubbleLabel = segment.value;

            if (this.props.bubbleLabel) {
                bubbleLabel = this.props.bubbleLabel(bubbleLabel) || bubbleLabel;
            }

            var xAxisLabel = segment.label;

            if (this.props.xAxisLabel) {
                xAxisLabel = this.props.xAxisLabel(xAxisLabel) || xAxisLabel;
            }


            return <div className="PunchCardGraph_segment" data-label={xAxisLabel} style={style} key={key}>
                <div className="PunchCardGraph_wrap">
                    <div className="PunchCardGraph_fill" style={fillStyle} data-label={bubbleLabel}></div>
                </div>
            </div>;
        }.bind(this));
    }
});

module.exports = PunchCard;