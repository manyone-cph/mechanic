import React, { useState, useEffect, useRef } from "react";
import engine from "mechanic-engine-react";
import { getRandomFlag } from "../logo-utils/graphics";
import { computeBaseBricks, computeBlockGeometry, precomputeBlocks } from "../logo-utils/blocks";
import { Block } from "../logo-utils/blocks-components";
import { useDrawLoop } from "../logo-utils/drawLoopHook";

export const handler = ({ width, height, frame, done, logoWidth, logoRatio, duration }) => {
  const [blockParams, setBlockParams] = useState({
    baseBricks: [],
    blocksByIndex: [],
    blockConfigs: []
  });

  const isPlaying = useRef(false);
  const runtime = useDrawLoop(isPlaying.current);

  const rows = 2;
  const cols = 13;
  const logoHeight = Math.floor((logoWidth / logoRatio) * rows);
  const words = ["DESIGN", "SYSTEMS", "INTERNATIONAL"];

  useEffect(() => {
    let colors = getRandomFlag().colors;
    const blockGeometry = computeBlockGeometry(logoWidth, logoHeight, rows, cols);
    const baseBricks = computeBaseBricks(words, blockGeometry.fontSize);
    const blocksByIndex = precomputeBlocks(blockGeometry, baseBricks, baseBricks.length);

    const blockConfigs = [];
    let position = { x: 0, y: 0 };
    let offset = 0;
    let brickIndex = baseBricks.length - (offset % baseBricks.length);

    while (position.y < height) {
      const block = blocksByIndex[brickIndex % baseBricks.length];
      const animation = {
        loops: Math.floor(Math.random() * 4 + 1),
        progress: 0
      };
      blockConfigs.push({ position, block, colors, animation });
      position = { ...position };
      if (position.x + block.width < width) {
        position.x += block.width;
        colors = getRandomFlag().colors;
        offset++;
        brickIndex = baseBricks.length - (offset % baseBricks.length);
      } else {
        position.x = position.x - width;
        position.y += block.height;
      }
    }
    setBlockParams({ baseBricks, blocksByIndex, blockConfigs });
    isPlaying.current = true;
  }, []);

  const direction = -1;
  useEffect(() => {
    const { baseBricks, blocksByIndex, blockConfigs } = blockParams;
    if (isPlaying.current && runtime < duration) {
      frame();
      let changed = false;
      const newConfigs = blockConfigs.map(config => {
        const { position, block, colors, animation } = config;
        let currentProgress = Math.floor(2 * animation.loops * cols * (runtime / duration));
        if (currentProgress > animation.progress) {
          const newAnimation = { ...animation };
          animation.progress = currentProgress;
          changed = true;
          const index = block.brickIndex + 1 * direction;
          const brickIndex = ((index % baseBricks.length) + baseBricks.length) % baseBricks.length;
          const newBlock = blocksByIndex[brickIndex];
          return { position, colors, block: newBlock, animation: newAnimation };
        }
        return config;
      });
      if (changed) {
        setBlockParams(blockParams => ({ ...blockParams, blockConfigs: newConfigs }));
      }
    } else if (isPlaying.current) {
      isPlaying.current = false;
      done();
    }
  }, [runtime]);

  const { blockConfigs } = blockParams;
  return (
    <svg width={width} height={height}>
      {blockConfigs &&
        blockConfigs.map(({ position, block, colors }) => (
          <Block
            key={`${position.x}-${position.y}`}
            position={position}
            block={block}
            colors={colors}></Block>
        ))}
    </svg>
  );
};

export const params = {
  size: {
    default: {
      width: 300,
      height: 300
    },
    bigger: {
      width: 1000,
      height: 1000
    },
    panoramic: {
      width: 1000,
      height: 250
    },
    long: {
      width: 500,
      height: 1000
    }
  },
  logoWidth: {
    type: "integer",
    default: 80
  },
  logoRatio: {
    type: "integer",
    default: 9
  },
  duration: {
    type: "integer",
    default: 5000
  }
};

export const settings = {
  engine,
  animated: true
};
