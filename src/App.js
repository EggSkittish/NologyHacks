import React from "react";
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { HandPose } from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import * as fp from "fingerpose";
import GaugeChart from 'react-gauge-chart'


function App() {

  const waveGesture = new fp.GestureDescription('wave');
  waveGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
 

  // do this for all other fingers
  waveGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  waveGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  waveGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
  waveGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);

  const middleUpGesture = new fp.GestureDescription('middle_up');
  middleUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
  middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 0.0);
  middleUpGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 0.0);
  // do this for all other fingers
  middleUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  middleUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
  middleUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  middleUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

  const fistGesture = new fp.GestureDescription('fist');
  fistGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);

  // do this for all other fingers
  fistGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 0.0);

  const handpose = require('@tensorflow-models/handpose')
  const runHandpose = async () => {
    const net = await handpose.load();
    console.log("Handpose model loaded.");
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const webcamstyle = {
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    left: "600px",
    right: 0,
    textAlign: "center",
    zindex: 9,
    width: 700,
    height: 700,
  };

  const webcamRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [confidence, setConfidence] = React.useState(null);
  const [riskLevel, setRiskLevel] = React.useState(0.5);

// based on
//https://heartbeat.fritz.ai/how-to-detect-a-thumbs-up-in-the-browser-with-tensorflow-js-b53fde1bf0f7
  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {

      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hand = await net.estimateHands(video);

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.ThumbsUpGesture,
          middleUpGesture,
          fistGesture,
          waveGesture
        ]);
        const gesture = await GE.estimate(hand[0].landmarks, 4);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) { //Knows it's a gesture


          const confidence = gesture.gestures.map(
            (prediction) => prediction.confidence
          );

          const mxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );

          const name = gesture.gestures[mxConfidence].name;
          const rawScore = Math.max.apply(null, confidence) / 10;




          if (rawScore > .6) {
            if (name == "fist" || name == "middle_up") {
              setRiskLevel(0.5 + rawScore / 2);
            }
            else //good
            {
              setRiskLevel(0.5 - rawScore / 2);
            }
          }
          else {
            setRiskLevel(0.5);
          }
          setConfidence(JSON.stringify(gesture.gestures) + " - " + confidence.toString() + gesture.gestures[mxConfidence].name);
        } else {
          setConfidence(0);
          setRiskLevel(0.5);
        }
      }


    }
  };

  React.useEffect(() => {
    runHandpose()
  }, [])

  const [imageSrc, setImageSrc] = React.useState("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIcfOT7WcxjYwbq-jr6XPegBaJBlgirozRvw&usqp=CAU")

  const capture = React.useCallback(
    () => {
      setImageSrc(webcamRef.current.getScreenshot());
    },
    [webcamRef]
  );

  return (
    <div className="App" style={{
      width: '100%', display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      backgroundColor: '#000000'
    }}>
      <div style={{ color: '#ff0000', fontFamily: 'Comic Sans MS', fontSize: '80px', textAlign: 'center', gridColumnStart: 1,
  gridColumnEnd: 4 }}>👊 Hand Crime Detector 2000‼</div>
      <div style={{ gridColumnStart: 1,
  gridColumnEnd: 3}}> <GaugeChart id="gauge-chart1" percent={riskLevel} formatTextValue={(value => value > 50 ? 'Bad Hand' : value==50 ? '' : 'Good Hand')} />
      </div>
      <div><Webcam ref={webcamRef} />
      </div>
      
      <div style={{ display: "none" }}><canvas
        ref={canvasRef}
        style={webcamstyle}
      />
        <header className="App-header">
          <img src={imageSrc} className="App-logo" alt="logo" />
          This is the risk {riskLevel}
          <p>
            <br /><br />
            to see if this is good or bad press the button below<br />

            <code></code>
          </p>
          {confidence}
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >

          </a>
          <p>

            <input></input><br />

          </p>


          <button onClick={capture}>click here to see if it is safe</button>
        </header>
      </div>
    </div>
  );
}

export default App;
