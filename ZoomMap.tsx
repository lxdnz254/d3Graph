/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  StyleSheet, View,  PanResponder, PanResponderInstance
} from 'react-native';
import Slider from '@react-native-community/slider';

import {  scaleLinear, scaleBand, scaleSequential, interpolateCool, min, max, geoPath, geoCentroid, geoBounds, geoEquirectangular } from 'd3';
import { DataPoint, originalData } from './Data';
import { Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Svg, Text } from 'react-native-svg';
import Animated,{ useAnimatedProps, useSharedValue } from 'react-native-reanimated';

import { GeoJsonFeatureCollection, geoJsonData } from './MapData';


interface GraphData {
  // Define the properties of a GraphData here
  max: number;
  min: number;
  curve: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ZoomMap(): JSX.Element {
  const [tooltip, setTooltip] = useState<{x: number, y: number, value: number, paddockName: string, triangleSide: string} | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const panResponder: PanResponderInstance = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      if (scale > 1) {
        console.log(gestureState);
        setPan({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      }
    },
  });
  const GRAPH_HEIGHT = 300;
  const GRAPH_WIDTH = 370;
  const bottomPadding = 50;
  const leftPadding = 10;
  const height = GRAPH_HEIGHT - bottomPadding;
  const width = GRAPH_WIDTH - leftPadding;
  const TOOLTIP_WIDTH = 150; // Adjust as needed
  const TRIANGLE_SIZE = 10; // Adjust as needed

  const mapData = geoJsonData;

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

  const leftTopMost = mapData.features.reduce(
    ([minLon, maxLat], feature) => {
      const [lon, lat] = feature.geometry.coordinates[0].reduce(
        ([minLonInner, maxLatInner], [lon, lat]) => [
          Math.min(minLonInner, lon),
          Math.max(maxLatInner, lat),
        ],
        [Infinity, -Infinity]
      );
      return [Math.min(minLon, lon), Math.max(maxLat, lat)];
    },
    [Infinity, -Infinity]
  );

  const rightBottomMost = mapData.features.reduce(
    ([maxLon, minLat], feature) => {
      const [lon, lat] = feature.geometry.coordinates[0].reduce(
        ([maxLonInner, minLatInner], [lon, lat]) => [
          Math.max(maxLonInner, lon),
          Math.min(minLatInner, lat),
        ],
        [-Infinity, Infinity]
      );
      return [Math.max(maxLon, lon), Math.min(minLat, lat)];
    },
    [-Infinity, Infinity]
  );

  const boundingBox = geoBounds(mapData);
  // console.log(boundingBox);''
  const projection = geoEquirectangular().fitExtent(boundingBox, mapData);
  const pathGenerator = geoPath().projection(projection);
  
  const makePaddockMap = (data: GeoJsonFeatureCollection) => {
    const yScale = scaleLinear().domain([leftTopMost[1], rightBottomMost[1]]).range([0, GRAPH_HEIGHT]);
    const xScale = scaleLinear().domain([leftTopMost[0], rightBottomMost[0]]).range([0, GRAPH_WIDTH]);

    const polygons = data.features.map(feature => {
      return feature.geometry.coordinates[0].map(([lon, lat]) => {
        const projectionResult = projection([lon, lat]);
        if (projectionResult) {
          const [x, y] = projectionResult;
          return `${xScale(x)},${yScale(-y)}`;
        }
        return '';
      }).join(' ');
    });

    const paddocks = data.features.map(p => {
      return {
        name: p.properties.Paddock.toString(),
        centroid: geoCentroid(p),
      }
    });

    return {
      paddocks,
      polygons,
      xScale,
      yScale,
    };
  };

  const paddocksMap = makePaddockMap(mapData);

  return (
    <View>
      <Animated.View style={styles.chartContainer}>
        <Svg style={{ transform: [{ scale }, { translateX: pan.x }, { translateY: pan.y }] }} width={GRAPH_WIDTH} height={GRAPH_HEIGHT + (bottomPadding * 2)}>
        <G transform={`translate(0, ${bottomPadding})`}>
          {paddocksMap.polygons.map((feature, index) => {
            const paddock = sortedData.find(d => d.paddockName === paddocksMap.paddocks[index].name);
            const value = paddock?.value ?? 0;
            return (
            <Polygon
              key={index}
              points={feature}
              fill={value ? colorScale(value) : 'transparent'}
              strokeWidth={1}
              stroke="rgba(255,105,180,1)"
              onPressIn={(event) => {
                let x = event.nativeEvent.locationX;
                let triangleSide = 'right';
                if (x < TOOLTIP_WIDTH) {
                  triangleSide = 'left';
                }
                setTooltip({
                  x,
                  y: event.nativeEvent.locationY,
                  value,
                  paddockName: paddock?.paddockName ?? '',
                  triangleSide
                });
              }}
              onPressOut={() => setTooltip(null)}
            />
            );
          })}
          {/* <Polygon
            key={0}
            points='M365.276,189.045L365.276,189.046L365.277,189.046L365.277,189.047L365.278,189.046L365.277,189.046L365.277,189.046L365.277,189.045L365.276,189.045L365.276,189.045ZM0,57.5L185,57.5L370,57.5L370,80.625L370,103.75L370,126.875L370,150L370,173.125L370,196.25L370,219.375L370,242.5L185,242.5L0,242.5L0,219.375L0,196.25L0,173.125L0,150L0,126.875L0,103.75L0,80.625L0,57.5Z'
            //fill={colorScale(1000)}
            stroke="pink"
          /> */}

          </G>
          {/* {tooltip && (
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
            )} */}
        </Svg>
        
      </Animated.View>
      <Animated.View style={styles.chartContainer}>
      <Svg width={GRAPH_WIDTH} height={(bottomPadding * 2)}>
        <Defs>
            <LinearGradient id="colorScaleGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={colorScale(barGraph.minValue)} />
              <Stop offset="100%" stopColor={colorScale(barGraph.maxValue)} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={bottomPadding + 10} // Adjust as needed
            width={GRAPH_WIDTH}
            height={20} // Adjust as needed
            fill="url(#colorScaleGradient)"
          />
        </Svg>
        <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={1}
          maximumValue={4}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
          value={scale}
          onValueChange={setScale}
        />
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

export default ZoomMap;