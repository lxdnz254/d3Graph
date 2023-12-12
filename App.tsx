/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef, useState } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';
import Wizard, { WizardRef } from 'react-native-wizard';
import Graph from './Graph';
import Map from './Map';
import ZoomMap from './ZoomMap';


function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const wizard = useRef<WizardRef>(null);
  const [isFirstStep, setIsFirstStep] = useState(true);
  const [isLastStep, setIsLastStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const stepList = [
    {
      content: <Graph />,
      title: 'Graph',
    },
    {
      content: <Map />,
      title: 'Map',
    },
    {
      content: <ZoomMap />,
      title: 'Zoom Map',
    },
  ];
  const [isAnimating, setIsAnimating] = useState(false);


  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
      >
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            flex: 1,
          }}
        >
          <View
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
              backgroundColor: "#FFF",
              borderBottomColor: "#dedede",
              borderBottomWidth: 1,
            }}>
            <Button disabled={isFirstStep} title={currentStep ? stepList[currentStep - 1].title : 'Prev'} onPress={() => wizard.current?.prev()} />
              <Text>{stepList[currentStep].title}</Text>
            <Button disabled={isLastStep} title={currentStep < stepList.length - 1 ? stepList[currentStep + 1].title : 'Next'} onPress={() => wizard.current?.next()} />
          </View>
          <View style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Wizard
              ref={wizard}
              steps={stepList}
              isFirstStep={(val: boolean) => setIsFirstStep(val)}
              isLastStep={(val: boolean) => setIsLastStep(val)}
              onNext={() => {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 1000);
              }}
              currentStep={({ currentStep, isLastStep, isFirstStep }) => {
                setCurrentStep(currentStep);
              }}
              nextStepAnimation='slideRight'
              prevStepAnimation='slideLeft'
              duration={1000}
              useNativeDriver={true}
            />
            <View style={{ flexDirection: "row", margin: 18 }}>
              {stepList.map((val, index) => (
                <View
                  key={"step-indicator-" + index}
                  style={{
                    width: 10,
                    marginHorizontal: 6,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: index === currentStep ? "#fc0" : "#000",
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

export default App;