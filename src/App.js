// @ts-check
import React, { Component } from 'react';
import Snake from './Snake';
import Food from './Food';
import './App.css';
import firebase from './firebase.js';


const GAMESTATE = {
  PAUSED: 0,
  RUNNING: 1,
  MENU: 2,
  GAMEOVER: 3,
};

const STARTING_POSITIONS = {
  0: {
    direction: 'RIGHT',
    dots: [[2, 2], [4, 2]]
  },
  1: {
    direction: 'LEFT',
    dots: [[92, 92], [94, 92]]
  },
  2: {
    direction: 'DOWN',
    dots: [[92, 2], [94, 2]]
  },
  3: {
    direction: 'UP',
    dots: [[2, 92], [4, 92]]
  },
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
    alive: true,
    dots: [
      [2, 2],
      [4, 2]
    ]
  },
  otherSnakes: [],
  foodDot: [],

};

const db = firebase.database();

class App extends Component {
  state = defaultState;

  componentDidMount() {
    setInterval(this.moveSnake, this.state.speed);
    document.onkeydown = this.onKeyDown;
    this.initDb();
  }

  initDb = () => {
    const lastActive = db.ref('last_active');
    lastActive.once('value', snapshot => {
      const now = new Date().getTime();
      if (!snapshot.val() || now - snapshot.val() > 1000 * 30) {
        lastActive.set(now);
        db.ref('snakeStates').remove();
      }
      this.initPlayer();
    });
  };

  initPlayer = () => {
    const { snake } = this.state;
    var id = 0;
    db.ref('snakeStates').once('value', snapshot => {
      id = snapshot.val() ? snapshot.val().length : 0;
      db.ref(`snakeStates/${id}`).set({
        snake: {
          ...snake,
          dots: STARTING_POSITIONS[id].dots,
          direction: STARTING_POSITIONS[id].direction,
          id
        },
      });
      console.log('playerId: ', id);
      this.setState({
        snake: {
          ...snake,
          dots: STARTING_POSITIONS[id].dots,
          direction: STARTING_POSITIONS[id].direction,
          id
        },
      });
    });
    db.ref('snakeStates').on('value', snapshot => {
      let snakeData = snapshot.val();
      this.setState({ otherSnakes: snakeData });
    });
    db.ref('gamestate').on('value', snapshot => {
      this.setState({ gamestate: snapshot.val() });
    });
    db.ref('foodDot').on('value', snapshot => {
      if (snapshot.exists()) {
        this.setState({ foodDot: snapshot.val() });
      } else {
        let foodDot = getRandomCoordinates()
        this.setState({ foodDot: foodDot });
        db.ref('foodDot').set(foodDot);
      }
    });
  };


  onDirectionChange = direction => {
    const { snake } = this.state;
    this.setState({
      snake: {
        ...snake,
        direction
      }
    });
  };

  onKeyDown = e => {
    e = e || window.event;
    switch (e.keyCode) {
      case 38:
        this.onDirectionChange('UP');
        break;
      case 40:
        this.onDirectionChange('DOWN');
        break;
      case 37:
        this.onDirectionChange('LEFT');
        break;
      case 39:
        this.onDirectionChange('RIGHT');
        break;
      case 32:
        this.togglePause();
        break;
    }
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
    db.ref(`gamestate`).set(gamestate);
  };

  moveSnake = () => {
    let { foodDot, gamestate, snake } = this.state;
    let { alive } = snake;

    if (gamestate === GAMESTATE.PAUSED) return;
    if (!alive) return;

    let dots = [...snake.dots];
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
      foodDot = getRandomCoordinates();
      this.setState({
        foodDot,
      });
      db.ref('foodDot').set(foodDot);
    } else {
      dots.shift();
    }
    dots.push(head);

    if (this.checkSelfGay(dots) || this.checkBorders(head) || this.checkOthersGay(head)) {
      alive = false;
      this.setState({
        snake: {
          ...snake,
          alive,
        }
      });
      db.ref(`snakeStates/${this.state.snake.id}`).set({
        snake: {
          ...snake,
          alive,
        }
      });
      return;
    } else {
      this.setState({
        snake: {
          ...snake,
          dots,
        }
      });
      db.ref(`snakeStates/${this.state.snake.id}`).set({
        snake: {
          ...snake,
          dots,
        }
      });
    }
  };

  checkSelfGay = (dots) => {
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

  checkOthersGay = (head) => {
    const { otherSnakes, snake: { id } } = this.state;
    let gay = false;
    otherSnakes.forEach((other) => {
      if (other.snake.id != id) {
        other.snake.dots.forEach((dot) => {
          if (head[0] === dot[0] && head[1] === dot[1]) {
            gay = true;
          }
        })
      }
    });
    return gay;
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
            console.log(snake);
            if (snake.snake.id !== this.state.snake.id) {
              return (
                <Snake key={snake.snake.id} snakeDots={snake.snake.dots} />
              )
            }
          })
        }
        <Food dot={this.state.foodDot} />
      </div>
    )
  }
}

export default App;
