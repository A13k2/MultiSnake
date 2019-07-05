import React, { Component } from 'react';
import Snake from './Snake';
import Food from './Food';
import './App.css';


const GAMESTATE = {
  PAUSED: 0,
  RUNNING: 1,
  MENU: 2,
  GAMEOVER: 3,
}

const getRandomCoordinates = () => {
  let min = 1;
  let max = 98;
  let x = Math.floor((Math.random() * (max - min + 1) + min) / 2) * 2;
  let y = Math.floor((Math.random() * (max - min + 1) + min) / 2) * 2;
  return [x, y];
};

const defaultState = {
  gamestate: GAMESTATE.PAUSED,
    direction: 'RIGHT',
    speed: 100,
    snakeDots: [
      [0, 0],
      [2, 0],
      [2, 2],
      [2, 4],
    ],
    foodDot: getRandomCoordinates(),
}

class App extends Component {
  state = defaultState;

  componentDidMount() {
    setInterval(this.moveSnake, this.state.speed);
    document.onkeydown = this.onKeyDown;
  }

  onKeyDown = (e) => {
    e = e || window.event;
    switch (e.keyCode) {
      case 38:
        this.setState({ direction: 'UP' });
        break;
      case 40:
        this.setState({ direction: 'DOWN' });
        break;
      case 37:
        this.setState({ direction: 'LEFT' });
        break;
      case 39:
        this.setState({ direction: 'RIGHT' });
        break;
      case 32:
        this.togglePause();
        break;
    }
  };

  reset = () => {
    this.setState(defaultState);
  };

  togglePause = () => {
    let { gamestate } = this.state;
    if (gamestate === GAMESTATE.RUNNING)  {
      gamestate = GAMESTATE.PAUSED;
    } else gamestate = GAMESTATE.RUNNING;
    this.setState({gamestate});
  };

  moveSnake = () => {
    let { foodDot, gamestate } = this.state;

    if (gamestate === GAMESTATE.PAUSED) return;

    let dots = [...this.state.snakeDots];
    let head = dots[dots.length - 1];

    switch (this.state.direction) {
      case "RIGHT":
        head = [head[0] + 2, head[1]];
        break;
      case "LEFT":
        head = [head[0] - 2, head[1]];
        break;
      case "DOWN":
        head = [head[0], head[1] + 2];
        break;
      case "UP":
        head = [head[0], head[1] - 2];
        break;
    }
    if (this.checkFood(head, foodDot)) {
      foodDot = getRandomCoordinates();
    } else {
      dots.shift();
    }
    if (this.checkBorders(head)) {
      this.reset();
      return;
    }
    dots.push(head);
    if (this.checkGay(dots)) {
      this.reset();
      return;
    }
    this.setState({
      snakeDots: dots,
      foodDot: foodDot,
    })
  };

  checkGay = (dots) => {
    for (let i = 0; i < dots.length; i++) {
      for (let j = i+1; j < dots.length; j++) {
        if (dots[i][0] === dots[j][0] && dots[i][1] === dots[j][1]) {
          console.log('gay');
          return true;
        }
      }
    }
    return false;
  };

  checkFood = (head, foodDot) => {
    if (head[0] === foodDot[0] && head[1] === foodDot[1]) {
      return true;
    }
  };

  checkBorders = (head) => {
    if (head[0] === 0 || head[0] === 100 || head[1] === 0 || head[1] === 100) {
      return true;
    }
  };

  render() {
    return (
      <div className="game-area">
        <Snake snakeDots={this.state.snakeDots} />
        <Food dot={this.state.foodDot} />
      </div>
    )
  }
}

export default App;
