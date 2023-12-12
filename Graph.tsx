/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  StyleSheet, View,
} from 'react-native';

import { curveBasis, line, scaleLinear, scaleTime, scaleBand, scaleSequential, interpolateCool, min, interpolateBuGn, interpolateSinebow, interpolateYlOrBr, interpolateGnBu, interpolateBlues, interpolateYlGn, interpolateCubehelixLong, interpolateCubehelix, interpolateCubehelixDefault } from 'd3';
import { DataPoint, originalData } from './Data';
import { G, Line, Path, Polygon, Rect, Svg, Text } from 'react-native-svg';
import Animated,{ useAnimatedProps, useSharedValue } from 'react-native-reanimated';

import { max } from 'd3-array';


interface GraphData {
  // Define the properties of a GraphData here
  max: number;
  min: number;
  curve: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Graph(): JSX.Element {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{x: number, y: number, value: number, paddockName: string, triangleSide: string} | null>(null);
  const GRAPH_HEIGHT = 300;
  const GRAPH_WIDTH = 370;
  const bottomPadding = 50;
  const leftPadding = 10;
  const height = GRAPH_HEIGHT - bottomPadding;
  const width = GRAPH_WIDTH - leftPadding;
  const TOOLTIP_WIDTH = 150; // Adjust as needed
  const TRIANGLE_SIZE = 10; // Adjust as needed

  const makeBarGraph = (data: DataPoint[]) => {
    const maxValue = max(data, d => d.value) || 0;
    const minValue = min(data, d => d.value) || 0;
    const yScale = scaleLinear().domain([0, maxValue]).range([height, 0]);
    const xScale = scaleBand<string>().domain(data.map(d => d.paddockName)).range([0, GRAPH_WIDTH]).padding(0.1);

    const bars = data.map(d => {
      return {
        x: xScale(d.paddockName),
        y: yScale(d.value),
        height: GRAPH_HEIGHT - yScale(d.value),
        width: xScale.bandwidth(),
      };
    });

    return {
      bars,
      xScale,
      yScale,
      maxValue,
      minValue,
    };
  };
  
  // Sort the data in descending order based on the value
  const sortedData = [...originalData].sort((a, b) => b.value - a.value);

  // Pass the sorted data to the makeBarGraph function
  const barGraph = makeBarGraph(sortedData);
  
  //const barGraph = makeBarGraph(originalData);
  const colorScale = scaleSequential(interpolateCool).domain([barGraph.maxValue, barGraph.minValue]);

  

  return (
    <View>
      <Animated.View style={styles.chartContainer}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT + (bottomPadding * 2)} stroke="#6231ff">
          <G >
            {barGraph.bars.map((bar, index) => {
              const cover = sortedData[index].value;
              return <Rect
                key={index}
                x={bar.x}
                y={bar.y + bottomPadding}
                width={bar.width}
                height={bar.height}
                fill={colorScale(cover)}
                onPressIn={(event) => {
                  let x = event.nativeEvent.locationX;
                  let triangleSide = 'right';
                  if (x < TOOLTIP_WIDTH) {
                    triangleSide = 'left';
                  }
                  setTooltip({
                    x,
                    y: event.nativeEvent.locationY,
                    value: cover,
                    paddockName: sortedData[index].paddockName,
                    triangleSide
                  });
                }}
                onPressOut={() => setTooltip(null)}
              />
            })}
            
            {hoveredBarIndex !== null && (
              <Text
                x={barGraph.bars[hoveredBarIndex].x! + barGraph.bars[hoveredBarIndex].width / 2}
                y={barGraph.bars[hoveredBarIndex].y - 10 + bottomPadding}
                textAnchor="middle"
              >
                {sortedData[hoveredBarIndex].value}
              </Text>
            )}
            <Line
              x1={(barGraph.bars[0]?.x! + (barGraph.bars[0]?.width ?? 0) / 2 ?? 0) }
              y1={barGraph.bars[0]?.y + bottomPadding}
              x2={barGraph.bars[barGraph.bars.length - 1]?.x! + (barGraph.bars[barGraph.bars.length - 1]?.width ?? 0) / 2}

              y2={barGraph.bars[barGraph.bars.length - 1]?.y + bottomPadding}
              stroke="red"
              strokeDasharray="4,2"
            />
            {/* {barGraph.bars.map((bar, index) => (
            <Text
              key={index}
              x={bar.x! + leftPadding}
              y={GRAPH_HEIGHT + bottomPadding}
              textAnchor="middle"
              transform={`rotate(-45, ${bar.x! - bar.width + leftPadding}, ${GRAPH_HEIGHT + bottomPadding})`}
              stroke={hoveredBarIndex === index ? 'black' : 'red'}
              dy="1.2em"
              fontSize={6}
            >
              {sortedData[index].paddockName}
            </Text>
          ))}
          <Text
            x={0}
            y={GRAPH_HEIGHT / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${0}, ${GRAPH_HEIGHT / 2})`}
            stroke={'red'}
            dy="0.8em"
            scale={1.2}
          >
            kgDM/ha
          </Text> */}
          {tooltip && (
              <>
                <Rect
                  x={tooltip.triangleSide === 'right' ? tooltip.x - (TRIANGLE_SIZE/2) - TOOLTIP_WIDTH : tooltip.x + (TRIANGLE_SIZE/2)}
                  y={tooltip.y - 30} // Adjust as needed
                  width={TOOLTIP_WIDTH}
                  height={60} // Adjust as needed
                  fill="white"
                  stroke="black"
                  rx={10}
                  ry={10}
                />
                <Polygon
                  points={
                    tooltip.triangleSide === 'right'
                    ? `${tooltip.x},${tooltip.y} ${tooltip.x - (TRIANGLE_SIZE/2)},${tooltip.y - (TRIANGLE_SIZE/2)} ${tooltip.x - (TRIANGLE_SIZE / 2)},${tooltip.y + (TRIANGLE_SIZE/2)}`
                    : `${tooltip.x},${tooltip.y} ${tooltip.x + (TRIANGLE_SIZE/2)},${tooltip.y - (TRIANGLE_SIZE/2)} ${tooltip.x + (TRIANGLE_SIZE / 2)},${tooltip.y + (TRIANGLE_SIZE/2)}`
                  }
                  fill="white"
                  stroke="black"
                />
                <Text
                  x={tooltip.triangleSide === 'right' ? tooltip.x - (TRIANGLE_SIZE/2) - TOOLTIP_WIDTH + 20 : tooltip.x + (TRIANGLE_SIZE/2) + 20}
                  y={tooltip.y - 10} // Adjust as needed
                  fill="black"
                  fontSize={10}
                  textAnchor="start"
                >
                  PADDOCK: {tooltip.paddockName}
                </Text>
                <Text
                  x={tooltip.triangleSide === 'right' ? tooltip.x - (TRIANGLE_SIZE/2) - TOOLTIP_WIDTH + 20 : tooltip.x + (TRIANGLE_SIZE/2) + 20}
                  y={tooltip.y + 10} // Adjust as needed
                  fill="black"
                  fontSize={10}
                  textAnchor="start"
                >
                  COVER: {tooltip.value} kg DM/ha
                </Text>
              </>
            )}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default Graph;