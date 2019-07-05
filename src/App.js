// @ts-check
import React, { Component } from 'react';
import Snake from './Snake';
import Food from './Food';
import './App.css';
import { logicalExpression } from "@babel/types";


const GAMESTATE = {
  PAUSED: 0,
  RUNNING: 1,
  MENU: 2,
  GAMEOVER: 3,
};

const getRandomCoordinates = () => {
  let min = 1;
  let max = 98;
  let x = Math.floor((Math.random() * (max - min + 1) + min) / 2) * 2;
  let y = Math.floor((Math.random() * (max - min + 1) + min) / 2) * 2;
  return [x, y];
};

const defaultState = {
  gamestate: GAMESTATE.PAUSED,
  speed: 100,
  snake: {
    direction: 'RIGHT',
    id: 0,
    alive: 1,
    dots: [
      [2, 2],
      [4, 2]
    ]
  },
  otherSnakes: [
    {
      id: 1,
      dots: [
        [92, 2],
        [94, 2]
      ]
    },
    {
      id: 2,
      dots: [
        [90, 90],
        [92, 90]
      ]
    },
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
    console.log(e.keyCode);
    const { snake } = this.state;
    let { direction } = snake;
    switch (e.keyCode) {
      case 38:
        direction = 'UP';
        break;
      case 40:
        direction = 'DOWN';
        break;
      case 37:
        direction = 'LEFT';
        break;
      case 39:
        direction = 'RIGHT';
        break;
      case 32:
        this.togglePause();
        break;
    }
    this.setState({
      snake: {
        ...snake,
        direction,
      }
    })
  };

  reset = () => {
    console.log('Resetting');
    this.setState({
      gamestate: GAMESTATE.GAMEOVER,
    });
  };

  togglePause = () => {
    let { gamestate } = this.state;
    if (gamestate === GAMESTATE.RUNNING) {
      gamestate = GAMESTATE.PAUSED;
    } else if (gamestate === GAMESTATE.GAMEOVER) {
      this.setState(defaultState);
      return;
    } else gamestate = GAMESTATE.RUNNING;
    this.setState({ gamestate });
  };

  moveSnake = () => {
    let { foodDot, gamestate, snake } = this.state;

    if (gamestate === GAMESTATE.PAUSED) return;

    console.log(`Moving snake with id: ${snake.id}`);
    // console.log(this.state);

    let dots = [...snake.dots];
    console.log(dots);
    let head = dots[dots.length - 1];

    switch (snake.direction) {
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
      this.setState({
        foodDot: getRandomCoordinates(),
      })
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
      snake: {
        ...snake,
        dots,
      }
    })
  };

  checkGay = (dots) => {
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
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
    if (head[0] === -2 || head[0] === 100 || head[1] === -2 || head[1] === 100) {
      return true;
    }
  };

  render() {
    return (
      <div className="game-area">
        <Snake key={this.state.snake.id} snakeDots={this.state.snake.dots} />
        {
          this.state.otherSnakes.map((snake) => {
            // console.log(snake.dots);
            return (
              <Snake key={snake.id} snakeDots={snake.dots} />
            )
          })
        }
        <Food dot={this.state.foodDot} />
      </div>
    )
  }
}

export default App;
