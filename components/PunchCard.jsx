

var React = require('react'),
    _ = require('lodash');

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

        // grab field inside array
        function getFields(input, field) {
            var output = [];
            for (var i=0; i < input.length ; ++i)
                output.push(input[i][field]);
            return output;
        }

        var result = getFields(this.props.data, 'value');

        // find the maximum value
        var MAX = Math.max.apply(null, result);


        //console.log('result:', result);
        //console.log('MAX:', MAX);

        return _.map(this.props.data, function(segment, key){
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