// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer} from "./command_buffer";
import {Controls, CrossSection, SideView} from "./widgets";

console.log("shipyard.ts");


window.onload = () => {
  CommandBuffer.init();
  const crossSection = new CrossSection();
  const sideView = new SideView();
  const controls = new Controls();
};
