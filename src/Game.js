import React, { Component } from 'react';

const GAMESTATE = {
  PAUSED: 0,
  RUNNING: 1,
  MENU: 2,
  GAMEOVER: 3,
}

export default class Game extends Component {
  constructor(props)  {
    super(props);
    this.gameWidth = props.gameWidth;
    this.gameHeight = props.gameHeight;
    this.gamestate = props.gamestate;
    this.snakes = props.snakes;
    this.foodDot = props.foodDot;
  }

  updatePositions = () => {
    this.snakes.forEach(

    );
  };
}