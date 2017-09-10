// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ControlPanel, Line} from "./primatives";

console.log("shipyard.ts");


window.onload = () => {

  const stage = new Konva.Stage({
    container: "shipyard",
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // add canvas element
  const layer = new Konva.Layer();
  stage.add(layer);

  const line = new Line();
  layer.add(line);

  const pannel = new ControlPanel();
  pannel.addButton("test", (buttonName) => {
    layer.add(new Line());
    layer.draw();
  }, "red");
  pannel.addButton("test2", (buttonName) => {
    console.log(CommandBuffer.summary());
  }, "green");
  pannel.addButton("test3", (buttonName) => {
    CommandBuffer.undo([stage]);
  }, "yellow");
  layer.add(pannel);

  layer.draw();
};
