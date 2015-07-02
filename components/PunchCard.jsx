

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

        var MAX = _.max(this.props.data, 'value').value;

        return _.map(this.props.data, function(segment, key){
            var color = key >= halflLength ? 1 : 0;

            var style = {
                color: this.props.colors[color]
            };

            var fillStyle = {
                backgroundColor: this.props.colors[color],
                transform: 'scale(' + segment.value / MAX + ')'
            };

            
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
        }, this);
        // if(this.state.width) {
        //     var data = this.state.data;

        //     var segmentTotal = _.reduce(data, function(sum, d) {
        //         return sum + d.value;
        //     }, 0);

        //     var startRadius;

        //     var segments = data.map(function(seg, i) {
        //         var path = this.getPath(seg.value, segmentTotal, startRadius, seg.animationDecimal);

        //         startRadius = path.startRadius + path.segmentAngle;

        //         return (
        //             <path   
        //                 key={seg.label + i}
        //                 stroke={this.props.stroke}
        //                 strokeWidth={this.props.strokeWidth}
        //                 fill={seg.fill || this.props.fill}
        //                 dataOrder={i}
        //                 d={path.d}
        //             />
        //         );

        //     }.bind(this));

        //     return <g>{segments}</g>;
        // }        
    }
});

module.exports = PunchCard;